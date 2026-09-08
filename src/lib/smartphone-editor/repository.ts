import { randomUUID, createHash } from 'node:crypto';
import sharp from 'sharp';
import { query, withTransaction, type TransactionClient } from '@/lib/db';
import { mapAdminProduct, type ProductRow } from '@/lib/admin-product-data';
import { buildAiTextProvenance } from '@/lib/product-text-provenance';
import {
  buildPayload,
  validatePayload,
  getMessages,
  type ProductPayload,
} from '@/lib/product-write-payload';
import { buildBaseSlug } from '@/lib/product-slug';
import { resolveUploadPath } from '@/lib/blob';
import { validateMarketplaceProduct } from '@/lib/marketplaces';
import {
  newPhoneDocument,
  newPhoneEntry,
  entryPayload,
  entryReadiness,
  entryProblems,
  validateDocument,
  type PhoneDocument,
  type PhoneDraft,
  type PhoneEntry,
  type PublishResult,
} from './model';
import type { ChannelKey } from '@/lib/product-channel-readiness';

type Source = {
  fingerprint: string;
  inventoryFingerprint: string;
  payload: ProductPayload;
  entryIds: string[];
  variants: boolean;
};
type DraftRow = PhoneDraft & {
  sources: Record<string, Source>;
  family_id: string | null;
};
export class DraftError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
const conflict = () => new DraftError('conflict', 409);
const view = (row: DraftRow): PhoneDraft => ({
  id: row.id,
  revision: row.revision,
  document: row.document,
  results: row.results,
});
const readRow = async (
  client: Pick<TransactionClient, 'query'>,
  id: string,
  lock = false,
): Promise<DraftRow> => {
  const result = await client.query(
    `SELECT * FROM smartphone_editor_drafts WHERE id=$1 ${lock ? 'FOR UPDATE' : ''}`,
    [id],
  );
  if (!result.rows[0]) throw new DraftError('not_found', 404);
  return result.rows[0] as DraftRow;
};
const inventoryFingerprint = async (
  client: Pick<TransactionClient, 'query'>,
  productId: string,
) => {
  const result = await client.query(
    `SELECT md5(coalesce(jsonb_agg(to_jsonb(i) ORDER BY sku,location)::text,'[]')) AS fingerprint FROM inventory_skus i WHERE product_id=$1`,
    [productId],
  );
  return result.rows[0].fingerprint as string;
};
const publicClient = { query } as Pick<TransactionClient, 'query'>;
export const loadPhoneDraft = async (id: string): Promise<PhoneDraft> => {
  const row = await readRow(publicClient, id);
  const result = view(row);
  for (const entryResult of result.results) {
    const entry = row.document.entries.find(
      (e) => e.id === entryResult.entryId,
    );
    if (!entry) continue;
    const listings = (
      await query(
        `SELECT marketplace,status,last_error FROM marketplace_listings WHERE sku=$1`,
        [entry.sku],
      )
    ).rows;
    for (const listing of listings) {
      const channel = listing.marketplace === 'ebay_de' ? 'ebay' : 'amazon';
      if (entryResult.channels[channel] === 'pending')
        entryResult.channels[channel] =
          listing.status === 'active'
            ? 'published'
            : listing.last_error || listing.status === 'failed'
              ? 'failed'
              : 'pending';
    }
  }
  return result;
};
export const listPhoneDrafts = async (productId?: string) =>
  (
    await query(
      `SELECT id,revision,document->'shared'->>'title' AS title,updated_at FROM smartphone_editor_drafts WHERE ($1::text IS NULL OR sources ? $1) ORDER BY updated_at DESC LIMIT 100`,
      [productId ?? null],
    )
  ).rows;
export const searchPhoneModels = async (search: string) =>
  (
    await query(
      `SELECT DISTINCT ON (lower(brand),lower(model)) id,brand,model,title FROM products WHERE category='smartphones' AND concat_ws(' ',brand,model,title) ILIKE $1 ORDER BY lower(brand),lower(model),updated_at DESC LIMIT 30`,
      [`%${search.slice(0, 100)}%`],
    )
  ).rows;
export const phoneModelTemplate = async (
  id: string,
): Promise<ProductPayload> => {
  const result = await query(
    `SELECT * FROM products WHERE id=$1 AND category='smartphones'`,
    [id],
  );
  if (!result.rows[0]) throw new DraftError('not_found', 404);
  const p = mapAdminProduct(result.rows[0] as ProductRow, []);
  return {
    aiGeneratedFields: p.aiGeneratedFields,
    title: p.title,
    brand: p.brand,
    model: p.model,
    description: p.description,
    specs: p.specs,
    featureBullets: p.featureBullets,
    manufacturer: p.manufacturer,
    euResponsiblePerson: p.euResponsiblePerson,
    safetyWarnings: p.safetyWarnings,
    safetyDocuments: p.safetyDocuments,
    category: 'smartphones',
  };
};
export const createPhoneDraft = async (
  actor: string,
  productId?: string,
): Promise<PhoneDraft> =>
  withTransaction(async (client) => {
    const document = newPhoneDocument();
    const sources: Record<string, Source> = {};
    let familyId: string | null = null;
    if (productId) {
      const family = await client.query(
        `SELECT f.id,f.smartphone_model_key FROM product_families f JOIN product_family_members m ON m.family_id=f.id WHERE m.product_id=$1`,
        [productId],
      );
      familyId = family.rows[0]?.id ?? null;
      const result = await client.query(
        `SELECT p.*,md5(to_jsonb(p)::text) AS fingerprint FROM products p WHERE category='smartphones' AND (id=$1 OR ($2::boolean AND id IN (SELECT product_id FROM product_family_members WHERE family_id=$3))) ORDER BY id FOR SHARE`,
        [productId, Boolean(family.rows[0]?.smartphone_model_key), familyId],
      );
      if (!result.rows.length) throw new DraftError('not_found', 404);
      document.entries = [];
      for (const row of result.rows) {
        const p = mapAdminProduct(row as ProductRow, []);
        const payload = { ...p, specs: row.specs } as ProductPayload;
        if (!document.entries.length) document.shared = { ...payload };
        // Per-product fields live in each entry; identifiers must never become shared defaults.
        for (const key of [
          'id',
          'variants',
          'images',
          'sku',
          'mpn',
          'gtin',
          'asin',
          'ebayEpid',
          'batteryHealth',
          'conditionNote',
          'condition',
          'stock',
          'price',
          'hasRealProductPhotos',
        ] as const)
          delete document.shared[key];
        const productEntries = (p.variants.length ? p.variants : [null]).map(
          (variant, index) => {
            const entry = newPhoneEntry();
            const urls = variant?.images?.length
              ? variant.images
              : p.variants.length <= 1
                ? p.images
                : [];
            return {
              ...entry,
              sourceProductId: p.id,
              variantIndex: variant ? index : undefined,
              color: variant?.color ?? '',
              storage: variant?.storage ?? '',
              condition: p.condition,
              price: variant?.price ?? p.price,
              stock: variant?.stock ?? p.stock,
              sku: variant?.sku || p.sku,
              batteryHealth: p.batteryHealth ?? null,
              conditionNote:
                row.import_metadata?.smartphoneEditor?.conditionNote ??
                p.conditionNote ??
                '',
              defects: row.import_metadata?.smartphoneEditor?.defects ?? '',
              accessories:
                row.import_metadata?.smartphoneEditor?.accessories ?? '',
              hasRealProductPhotos: Boolean(p.hasRealProductPhotos),
              channels: Array.isArray(
                row.import_metadata?.smartphoneEditor?.channels,
              )
                ? row.import_metadata.smartphoneEditor.channels
                : [...entry.channels],
              details: { ...payload, ...variant },
              photos: entry.photos.map((photo, i) => ({
                ...photo,
                url: urls[i] ?? '',
              })),
            } as PhoneEntry;
          },
        );
        // Keep source-specific facts until staff explicitly applies shared changes.
        sources[p.id] = {
          fingerprint: row.fingerprint,
          inventoryFingerprint: await inventoryFingerprint(client, p.id),
          payload,
          entryIds: productEntries.map((e) => e.id),
          variants: Boolean(p.variants.length),
        };
        document.entries.push(...productEntries);
      }
    }
    if (document.entries.length > 100) throw new DraftError('invalid_document');
    const result = await client.query(
      `INSERT INTO smartphone_editor_drafts(document,sources,family_id,created_by,updated_by) VALUES($1::jsonb,$2::jsonb,$3,$4,$4) RETURNING *`,
      [JSON.stringify(document), JSON.stringify(sources), familyId, actor],
    );
    return view(result.rows[0]);
  });
const verifySources = (document: PhoneDocument, row: DraftRow) => {
  for (const [id, source] of Object.entries(row.sources)) {
    const entries = document.entries.filter((e) => e.sourceProductId === id);
    if (
      entries.length !== source.entryIds.length ||
      source.entryIds.some(
        (entryId, i) =>
          entries[i]?.id !== entryId ||
          (source.variants && entries[i].variantIndex !== i),
      )
    )
      throw conflict();
    // Legacy variants retain one product-wide condition and its shared evidence.
    if (
      source.variants &&
      entries.some(
        (e) =>
          e.condition !== entries[0].condition ||
          e.conditionNote !== entries[0].conditionNote ||
          e.batteryHealth !== entries[0].batteryHealth ||
          e.hasRealProductPhotos !== entries[0].hasRealProductPhotos,
      )
    )
      throw new DraftError('legacy_condition_shared');
  }
  if (
    document.entries.some(
      (e) => e.sourceProductId && !row.sources[e.sourceProductId],
    )
  )
    throw conflict();
};
export const savePhoneDraft = async (
  id: string,
  revision: number,
  input: unknown,
  actor: string,
): Promise<PhoneDraft> =>
  withTransaction(async (client) => {
    let document: PhoneDocument;
    try {
      document = validateDocument(input);
    } catch {
      throw new DraftError('invalid_document');
    }
    const row = await readRow(client, id, true);
    if (revision !== row.revision) throw conflict();
    verifySources(document, row);
    const changed =
      JSON.stringify({ ...document, step: 0 }) !==
      JSON.stringify({ ...row.document, step: 0 });
    const result = await client.query(
      `UPDATE smartphone_editor_drafts SET document=$2::jsonb,revision=revision+1,updated_by=$3,results=CASE WHEN $4 THEN '[]'::jsonb ELSE results END,updated_at=now() WHERE id=$1 RETURNING *`,
      [id, JSON.stringify(document), actor, changed],
    );
    return view(result.rows[0]);
  });
const fields = [
  'title',
  'subtitle',
  'description',
  'price',
  'compareAtPrice',
  'category',
  'brand',
  'model',
  'sku',
  'stock',
  'images',
  'variants',
  'featureBullets',
  'specs',
  'isActive',
  'condition',
  'batteryHealth',
  'hasRealProductPhotos',
  'conditionNote',
  'subcategory',
  'mpn',
  'gtin',
  'manufacturer',
  'euResponsiblePerson',
  'safetyWarnings',
  'safetyDocuments',
  'eprelId',
  'energyLabel',
  'faq',
  'asin',
  'ebayEpid',
  'identifierStatus',
  'countryOfOrigin',
  'packageWeightKg',
  'packageLengthCm',
  'packageWidthCm',
  'packageHeightCm',
  'chargerIncluded',
  'chargingPowerMinW',
  'chargingPowerMaxW',
  'usbPdSupported',
  'batteryDetails',
  'marketplaceCategoryMappings',
  'marketplaceAttributes',
  'amazonGtinExemption',
  'amazonRenewedApproved',
] as const;
const jsonFields = new Set<string>([
  'variants',
  'specs',
  'manufacturer',
  'euResponsiblePerson',
  'energyLabel',
  'faq',
  'batteryDetails',
  'marketplaceCategoryMappings',
  'marketplaceAttributes',
]);
const column = (field: string) =>
  '"' + field.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase()) + '"';
export const writeProduct = async (
  client: TransactionClient,
  id: string,
  payload: ProductPayload,
  existing: boolean,
): Promise<void> => {
  const p = buildPayload(payload);
  const error = validatePayload(p, getMessages(true));
  if (error) throw new DraftError(error);
  const prior = existing ? (await client.query('SELECT title,description,import_metadata FROM products WHERE id=$1 FOR UPDATE', [id])).rows[0] : undefined;
  const provenance = JSON.stringify(buildAiTextProvenance(prior?.import_metadata, prior ?? {}, p, p.aiGeneratedFields));
  const values = fields.map((f) =>
    jsonFields.has(f) ? JSON.stringify(p[f]) : p[f],
  );
  const bind = (field: (typeof fields)[number]) =>
    `$${fields.indexOf(field) + 2}`;
  const translationUpdates = (
    [
      ['title', 'title_i18n'],
      ['description', 'description_i18n'],
      ['subtitle', 'subtitle_i18n'],
      ['specs', 'specs_i18n'],
      ['featureBullets', 'feature_bullets_i18n'],
    ] as const
  )
    .map(
      ([field, localized]) =>
        `${localized}=CASE WHEN ${column(field)} IS DISTINCT FROM ${bind(field)}${jsonFields.has(field) ? '::jsonb' : ''} THEN '{}'::jsonb ELSE ${localized} END`,
    )
    .join(',');
  if (existing) {
    await client.query(
      `UPDATE products SET ${fields.map((f, i) => `${column(f)}=$${i + 2}${jsonFields.has(f) ? '::jsonb' : ''}`).join(',')},${translationUpdates},import_metadata=coalesce(CASE WHEN condition IS DISTINCT FROM ${bind('condition')} OR condition_note IS DISTINCT FROM ${bind('conditionNote')} THEN coalesce(import_metadata,'{}'::jsonb)-'conditionNoteI18n' ELSE import_metadata END,'{}'::jsonb) || jsonb_build_object('contentProvenance',CASE WHEN jsonb_typeof(import_metadata->'contentProvenance')='object' THEN import_metadata->'contentProvenance' ELSE '{}'::jsonb END || $${values.length + 2}::jsonb),updated_at=now() WHERE id=$1`,
      [id, ...values, provenance],
    );
  } else {
    const slug = `${buildBaseSlug(payload)}-${id.slice(0, 8)}`;
    await client.query(
      `INSERT INTO products(id,slug,${fields.map(column).join(',')},import_metadata) VALUES($1,$2,${fields.map((f, i) => `$${i + 3}${jsonFields.has(f) ? '::jsonb' : ''}`).join(',')},jsonb_build_object('contentProvenance',$${values.length + 3}::jsonb))`,
      [id, slug, ...values, provenance],
    );
  }
  const units = p.variants.length
    ? p.variants
    : [{ sku: p.sku, stock: p.stock }];
  for (const unit of units) {
    const result = await client.query(
      `INSERT INTO inventory_skus(product_id,sku,location,on_hand,reserved,safety_buffer,is_active)
      VALUES($1,$2,'local',$3,0,0,true) ON CONFLICT(sku,location) DO UPDATE SET
      on_hand=excluded.on_hand+inventory_skus.reserved+inventory_skus.safety_buffer,is_active=true,updated_at=now()
      WHERE inventory_skus.product_id=excluded.product_id RETURNING id`,
      [id, unit.sku, unit.stock ?? p.stock],
    );
    if (result.rowCount !== 1) throw new DraftError('duplicate_sku');
  }
  await client.query(
    `UPDATE inventory_skus SET on_hand=reserved,is_active=false,updated_at=now() WHERE product_id=$1 AND location='local' AND NOT(sku=ANY($2::text[]))`,
    [id, units.map((u) => u.sku)],
  );
};
const verifyPhotos = async (
  client: TransactionClient,
  entries: PhoneEntry[],
) => {
  const ownership = new Map<string, PhoneEntry>();
  const hashes = new Map<string, string[]>();
  for (const entry of entries) {
    const distinct = new Set<string>();
    for (const photo of entry.photos) {
      const file = resolveUploadPath(photo.url);
      if (!file) throw new DraftError('uploaded_photos_required');
      let hash: string;
      try {
        const pixels = await sharp(file, { limitInputPixels: 40_000_000 })
          .rotate()
          .png()
          .toBuffer();
        hash = createHash('sha256').update(pixels).digest('hex');
      } catch {
        throw new DraftError('photo_missing');
      }
      // Serialize claims across draft publications, including simultaneous duplicate device uploads.
      await client.query(
        `SELECT pg_advisory_xact_lock(hashtextextended($1,0))`,
        [hash],
      );
      const claim = (
        await client.query(
          `SELECT * FROM smartphone_editor_photo_claims WHERE content_hash=$1`,
          [hash],
        )
      ).rows[0];
      if (
        claim &&
        claim.product_id !== entry.sourceProductId &&
        (entry.condition !== 'new' ||
          claim.condition !== 'new' ||
          claim.color !== entry.color.trim().toLowerCase())
      )
        throw new DraftError('device_photo_reused');
      if (distinct.has(hash)) throw new DraftError('distinct_photos_required');
      distinct.add(hash);
      const previous = ownership.get(hash);
      if (
        previous &&
        (entry.condition !== 'new' ||
          previous.condition !== 'new' ||
          entry.color.trim().toLowerCase() !==
            previous.color.trim().toLowerCase())
      )
        throw new DraftError('device_photo_reused');
      ownership.set(hash, entry);
    }
    hashes.set(entry.id, [...distinct]);
  }
  return hashes;
};

export type PublishRequest = {
  revision: number;
  requestId: string;
  entryIds: string[];
};
export const publishPhoneDraft = async (
  id: string,
  input: PublishRequest,
  actor: string,
  owner: boolean,
): Promise<PhoneDraft> =>
  withTransaction(async (client) => {
    if (
      !/^[0-9a-f-]{36}$/i.test(input.requestId ?? '') ||
      !Array.isArray(input.entryIds) ||
      !input.entryIds.length ||
      new Set(input.entryIds).size !== input.entryIds.length
    )
      throw new DraftError('invalid_request');
    const row = await readRow(client, id, true);
    const prior = await client.query(
      `SELECT request,response FROM smartphone_editor_publications WHERE draft_id=$1 AND request_id=$2`,
      [id, input.requestId],
    );
    if (prior.rows[0]) {
      if (
        JSON.stringify(prior.rows[0].request.entryIds) !==
          JSON.stringify(input.entryIds) ||
        prior.rows[0].request.revision !== input.revision
      )
        throw conflict();
      return prior.rows[0].response as PhoneDraft;
    }
    if (row.revision !== input.revision) throw conflict();
    const doc = validateDocument(row.document);
    if (doc.pendingShared) throw new DraftError('review_shared_changes');
    verifySources(doc, row);
    const selected = doc.entries.filter((e) => input.entryIds.includes(e.id));
    if (
      selected.length !== input.entryIds.length ||
      selected.some((e) => !e.channels.length)
    )
      throw new DraftError('invalid_selection');
    const skus = new Set<string>();
    const combos = new Set<string>();
    for (const entry of selected) {
      if (entry.condition !== 'new' && entry.stock > 1) {
        const original = entry.sourceProductId
          ? row.sources[entry.sourceProductId]?.payload
          : undefined;
        const originalStock =
          entry.variantIndex === undefined
            ? original?.stock
            : original?.variants?.[entry.variantIndex]?.stock;
        if (
          !original ||
          original.condition === 'new' ||
          Number(originalStock ?? 1) <= 1
        )
          throw new DraftError('individual_quantity_required');
      }
      if (entryProblems(doc, entry).length)
        throw new DraftError('entry_incomplete');
      if (skus.has(entry.sku.toLowerCase()))
        throw new DraftError('duplicate_sku');
      skus.add(entry.sku.toLowerCase());
      if (!entry.sourceProductId && entry.condition === 'new') {
        const combo = `${entry.color.trim().toLowerCase()}/${entry.storage.trim().toLowerCase()}`;
        if (combos.has(combo))
          throw new DraftError('duplicate_new_configuration');
        combos.add(combo);
      }
    }
    const photoHashes = await verifyPhotos(client, selected);
    // Lock the live rows in a fixed order; stock changes also invalidate the original snapshot.
    for (const productId of [
      ...new Set(
        selected.flatMap((e) => (e.sourceProductId ? [e.sourceProductId] : [])),
      ),
    ].sort()) {
      const source = row.sources[productId];
      if (source.entryIds.some((entryId) => !input.entryIds.includes(entryId)))
        throw new DraftError('select_all_legacy_variants');
      const current = await client.query(
        `SELECT md5(to_jsonb(p)::text) AS fingerprint FROM products p WHERE id=$1 FOR UPDATE`,
        [productId],
      );
      if (current.rows[0]?.fingerprint !== source.fingerprint) throw conflict();
      await client.query(
        `SELECT id FROM inventory_skus WHERE product_id=$1 ORDER BY sku FOR UPDATE`,
        [productId],
      );
      if (
        (await inventoryFingerprint(client, productId)) !==
        source.inventoryFingerprint
      )
        throw conflict();
    }
    let familyId = row.family_id;
    if (!familyId && selected.some((e) => !e.sourceProductId)) {
      familyId = randomUUID();
      const family = await client.query(
        `INSERT INTO product_families(id,name,slug,option_axes,is_active,smartphone_model_key) VALUES($1,$2,$3,'["color","storage","condition"]'::jsonb,true,$4) ON CONFLICT(smartphone_model_key) DO UPDATE SET updated_at=product_families.updated_at RETURNING id`,
        [
          familyId,
          `${doc.shared.brand} ${doc.shared.model}`,
          `phone-${familyId}`,
          `${doc.shared.brand?.trim().toLowerCase()}|${doc.shared.model?.trim().toLowerCase()}`,
        ],
      );
      familyId = family.rows[0].id;
    }
    if (familyId) {
      await client.query(
        'SELECT id FROM product_families WHERE id=$1 FOR UPDATE',
        [familyId],
      );
      const members = (
        await client.query(
          `SELECT m.product_id,m.option_values FROM product_family_members m JOIN products p ON p.id=m.product_id WHERE m.family_id=$1 AND p.condition='new'`,
          [familyId],
        )
      ).rows;
      const selectedProducts = new Set(selected.map((e) => e.sourceProductId));
      const keys = new Set<string>();
      for (const e of selected.filter((e) => e.condition === 'new')) {
        const key = `${e.color.trim().toLowerCase()}|${e.storage.trim().toLowerCase()}`;
        if (
          keys.has(key) ||
          members.some(
            (m) =>
              !selectedProducts.has(m.product_id) &&
              m.option_values.color?.toLowerCase() ===
                e.color.trim().toLowerCase() &&
              m.option_values.storage?.toLowerCase() ===
                e.storage.trim().toLowerCase(),
          )
        )
          throw new DraftError('duplicate_new_configuration');
        keys.add(key);
      }
    }
    const groups = new Map<string, PhoneEntry[]>();
    selected.forEach((e) => {
      const key = e.sourceProductId ?? e.id;
      groups.set(key, [...(groups.get(key) ?? []), e]);
    });
    const results = row.results.filter(
      (r) => !input.entryIds.includes(r.entryId),
    );
    for (const entries of groups.values()) {
      const first = entries[0];
      const source = first.sourceProductId
        ? row.sources[first.sourceProductId]
        : undefined;
      const productId = first.sourceProductId ?? randomUUID();
      const payload = {
        ...source?.payload,
        ...entryPayload(doc, first),
        isActive:
          entries.some((e) => e.channels.includes('store')) ||
          Boolean(source?.payload.isActive),
      };
      if (source && !source.variants) payload.variants = [];
      if (source?.variants) {
        payload.variants = entries.map((e, i) => ({
          ...entryPayload(doc, e).variants![0],
          isDefault: source.payload.variants?.[i]?.isDefault,
        }));
        payload.stock = entries.reduce((sum, e) => sum + e.stock, 0);
        const defaultEntry =
          entries[
            source.payload.variants?.findIndex((v) => v.isDefault) ?? 0
          ] ?? first;
        payload.price = defaultEntry.price;
        payload.sku = source.payload.sku || defaultEntry.sku;
        payload.images = entryPayload(doc, defaultEntry).images;
      }
      for (const e of entries)
        if (e.channels.includes('store') && !entryReadiness(doc, e).store.ready)
          throw new DraftError('website_incomplete');
      await writeProduct(client, productId, payload, Boolean(source));
      await client.query(
        `UPDATE products SET import_metadata=jsonb_set(coalesce(import_metadata,'{}'::jsonb),'{smartphoneEditor}',jsonb_build_object('googleSelected',$2::boolean,'channels',$3::jsonb,'conditionNote',$4::text,'defects',$5::text,'accessories',$6::text),true) WHERE id=$1`,
        [
          productId,
          entries.some((e) => e.channels.includes('google')),
          JSON.stringify(first.channels),
          first.conditionNote,
          first.defects,
          first.accessories,
        ],
      );
      if (source && familyId && entries.length === 1)
        await client.query(
          `UPDATE product_family_members SET option_values=$3::jsonb WHERE family_id=$1 AND product_id=$2 AND EXISTS(SELECT 1 FROM product_families WHERE id=$1 AND smartphone_model_key IS NOT NULL)`,
          [
            familyId,
            productId,
            JSON.stringify({
              color: first.color,
              storage: first.storage,
              condition: first.condition,
              device: productId,
            }),
          ],
        );
      if (!source && familyId) {
        await client.query(
          `INSERT INTO product_family_members(family_id,product_id,option_values,is_active) VALUES($1,$2,$3::jsonb,true)`,
          [
            familyId,
            productId,
            JSON.stringify({
              color: first.color,
              storage: first.storage,
              condition: first.condition,
              device: productId,
            }),
          ],
        );
        await client.query(
          `INSERT INTO product_experience_profiles(product_id,enabled_sections) VALUES($1,'{"familyConfigurator":true}'::jsonb) ON CONFLICT(product_id) DO UPDATE SET enabled_sections=product_experience_profiles.enabled_sections || excluded.enabled_sections`,
          [productId],
        );
      }
      for (const e of entries) {
        for (const hash of photoHashes.get(e.id) ?? [])
          await client.query(
            `INSERT INTO smartphone_editor_photo_claims(content_hash,product_id,condition,color) VALUES($1,$2,$3,$4) ON CONFLICT(content_hash) DO NOTHING`,
            [hash, productId, e.condition, e.color.trim().toLowerCase()],
          );
        const statuses: PublishResult['channels'] = {};
        const readiness = entryReadiness(doc, e);
        for (const channel of e.channels) {
          if (!readiness[channel].ready) {
            statuses[channel] = 'incomplete';
            continue;
          }
          if (channel === 'store') {
            statuses.store = 'published';
            continue;
          }
          statuses[channel] = await queueChannel(
            client,
            channel,
            { ...entryPayload(doc, e), isActive: payload.isActive },
            actor,
            owner,
          );
        }
        results.push({ entryId: e.id, productId, channels: statuses });
        e.sourceProductId = productId;
        e.variantIndex = payload.variants?.length
          ? entries.indexOf(e)
          : undefined;
      }
      const fresh = await client.query(
        `SELECT md5(to_jsonb(p)::text) AS fingerprint FROM products p WHERE id=$1`,
        [productId],
      );
      row.sources[productId] = {
        fingerprint: fresh.rows[0].fingerprint,
        inventoryFingerprint: await inventoryFingerprint(client, productId),
        payload,
        entryIds: entries.map((e) => e.id),
        variants: Boolean(payload.variants?.length),
      };
    }
    const saved = await client.query(
      `UPDATE smartphone_editor_drafts SET document=$2::jsonb,sources=$3::jsonb,results=$4::jsonb,family_id=$5,revision=revision+1,updated_by=$6,updated_at=now() WHERE id=$1 RETURNING *`,
      [
        id,
        JSON.stringify(doc),
        JSON.stringify(row.sources),
        JSON.stringify(results),
        familyId,
        actor,
      ],
    );
    const response = view(saved.rows[0]);
    await client.query(
      `INSERT INTO smartphone_editor_publications(draft_id,request_id,request,response) VALUES($1,$2,$3::jsonb,$4::jsonb)`,
      [id, input.requestId, JSON.stringify(input), JSON.stringify(response)],
    );
    return response;
  });

const queueChannel = async (
  client: TransactionClient,
  channel: Exclude<ChannelKey, 'store'>,
  p: ProductPayload,
  actor: string,
  owner: boolean,
): Promise<PublishResult['channels'][ChannelKey]> => {
  const marketplace =
    channel === 'google' ? 'google_merchant' : `${channel}_de`;
  const settings = (
    await client.query(
      `SELECT * FROM marketplace_channel_settings WHERE marketplace=$1`,
      [marketplace],
    )
  ).rows[0];
  if (!settings?.enabled) return 'connection_required';
  if (channel === 'google') {
    if (
      !process.env.GOOGLE_MERCHANT_SERVICE_ACCOUNT_JSON ||
      !process.env.GOOGLE_MERCHANT_SUPPLEMENTAL_DATA_SOURCE
    )
      return 'connection_required';
    return p.isActive === false ? 'complete' : 'pending';
  }
  if (!owner || !settings.price_rule_confirmed_at) return 'connection_required';
  const compliance = await client.query(
    `SELECT 1 FROM marketplace_compliance_profiles WHERE verified_at IS NOT NULL AND evidence @> '{"lucid":true,"weee":true,"batteries":true,"gpsr":true}'::jsonb LIMIT 1`,
  );
  if (!compliance.rowCount) return 'connection_required';
  const required =
    channel === 'amazon'
      ? [
          'AMAZON_SP_API_CLIENT_ID',
          'AMAZON_SP_API_CLIENT_SECRET',
          'AMAZON_SP_API_REFRESH_TOKEN',
          'AMAZON_SP_API_SELLER_ID',
        ]
      : [
          'EBAY_MERCHANT_LOCATION_KEY',
          'EBAY_PAYMENT_POLICY_ID',
          'EBAY_FULFILLMENT_POLICY_ID',
          'EBAY_RETURN_POLICY_ID',
        ];
  if (required.some((key) => !process.env[key]?.trim()))
    return 'connection_required';
  if (channel === 'ebay') {
    const connected = await client.query(
      `SELECT 1 FROM marketplace_connections WHERE marketplace='ebay_de' AND environment=$1 AND refresh_token_ciphertext IS NOT NULL AND refresh_token_expires_at>now()`,
      [
        process.env.EBAY_INVENTORY_ENVIRONMENT === 'sandbox'
          ? 'sandbox'
          : 'production',
      ],
    );
    if (!connected.rowCount) return 'connection_required';
  }
  const mp = channel === 'ebay' ? 'ebay_de' : 'amazon_de';
  const validation = validateMarketplaceProduct(mp, {
    sku: p.sku ?? '',
    title: p.title ?? '',
    description: p.description ?? '',
    price: p.price ?? 0,
    condition: p.condition ?? 'new',
    gtin: p.gtin,
    asin: p.asin,
    ebayEpid: p.ebayEpid,
    manufacturer: p.manufacturer ?? {},
    euResponsiblePerson: p.euResponsiblePerson ?? {},
    safetyWarnings: p.safetyWarnings ?? [],
    safetyDocuments: p.safetyDocuments ?? [],
    categoryMappings: p.marketplaceCategoryMappings ?? {},
    amazonRenewedApproved: p.amazonRenewedApproved,
  });
  if (!validation.valid) return 'incomplete';
  const price = Math.max(
    0.01,
    Math.round(
      ((p.price ?? 0) * (1 + Number(settings.price_markup_percent) / 100) +
        Number(settings.price_markup_fixed)) *
        100,
    ) / 100,
  );
  await client.query(
    `INSERT INTO marketplace_listings(sku,marketplace,status,price,approved_at,approved_by,fulfillment_mode) VALUES($1,$2,'queued',$3,now(),$4,'MFN') ON CONFLICT(sku,marketplace) DO UPDATE SET status='queued',price=excluded.price,approved_at=now(),approved_by=excluded.approved_by,last_error=null,updated_at=now()`,
    [p.sku, mp, price, actor],
  );
  await client.query(
    `INSERT INTO marketplace_jobs(marketplace,operation,sku,payload) SELECT $1,'publish',$2,'{}'::jsonb WHERE NOT EXISTS(SELECT 1 FROM marketplace_jobs WHERE marketplace=$1 AND sku=$2 AND operation='publish' AND status IN ('queued','processing')) ON CONFLICT DO NOTHING`,
    [mp, p.sku],
  );
  return 'pending';
};
