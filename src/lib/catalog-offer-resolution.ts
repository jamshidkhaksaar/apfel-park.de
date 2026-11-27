import { randomUUID } from "node:crypto";
import type { TransactionClient } from "@/lib/db";
import {
  readBatteryHealthRange,
  validBatteryHealthRange,
  type BatteryHealthRange,
} from "@/lib/product-offer-options";
import { buildBaseSlug, uniquifySlug } from "@/lib/product-slug";
import { markOpenIntakeRunsStale } from "@/lib/product-intake/stale-runs";
import { configurationLabel } from "@/lib/smartphone-editor/model";
import type { ProductPayload } from "@/lib/product-write-payload";
import {
  canonicalOfferColor,
  canonicalOfferStorage,
  modelFamilyKeyFor,
  normalizeBatteryTuple,
  normalizeOfferColorKey,
  normalizeOfferStorageKey,
  normalizeOfferText,
  type CatalogOfferCandidate,
  type OfferCondition,
} from "./catalog-offer-matching";

export * from "./catalog-offer-matching";

const normalizeConditionDb = (value: unknown): OfferCondition =>
  value === "open_box" || value === "refurbished"
    ? "open_box"
    : value === "used"
      ? "used"
      : "new";

const rowToCandidates = (row: Record<string, unknown>): CatalogOfferCandidate[] => {
  const condition = normalizeConditionDb(row.condition);
  const metadata =
    row.import_metadata && typeof row.import_metadata === "object"
      ? (row.import_metadata as Record<string, unknown>)
      : {};
  const editorMeta =
    metadata.smartphoneEditor && typeof metadata.smartphoneEditor === "object"
      ? (metadata.smartphoneEditor as Record<string, unknown>)
      : {};
  const metaConfig =
    editorMeta.configuration &&
    typeof editorMeta.configuration === "object" &&
    !Array.isArray(editorMeta.configuration)
      ? (editorMeta.configuration as Record<string, string>)
      : {};
  const optionValues =
    row.option_values && typeof row.option_values === "object"
      ? (row.option_values as Record<string, unknown>)
      : {};
  const batteryHealth =
    row.battery_health == null ? null : Number(row.battery_health);
  const batteryRange = readBatteryHealthRange(
    row.import_metadata,
    batteryHealth ?? undefined,
  );
  const batteryTuple = normalizeBatteryTuple(
    condition,
    batteryRange?.min ?? batteryHealth,
    batteryRange?.max ?? null,
  );
  const rawVariants = Array.isArray(row.variants)
    ? (row.variants as Array<Record<string, unknown>>)
    : [];
  const baseImages = Array.isArray(row.images)
    ? row.images.filter((u): u is string => typeof u === "string" && u.length > 0)
    : [];

  const shared = {
    id: String(row.id),
    slug: row.slug ? String(row.slug) : null,
    title: String(row.title ?? ""),
    subtitle: row.subtitle ? String(row.subtitle) : null,
    description: row.description ? String(row.description) : null,
    category: String(row.category ?? "smartphones"),
    brand: row.brand ? String(row.brand) : null,
    model: row.model ? String(row.model) : null,
    hardwareModel: row.hardware_model ? String(row.hardware_model) : null,
    condition,
    conditionNote: row.condition_note ? String(row.condition_note) : null,
    isActive: Boolean(row.is_active),
    hasRealProductPhotos: Boolean(row.has_real_product_photos),
    batteryHealth: batteryTuple.min,
    batteryHealthMax: batteryTuple.max,
    familyId: row.family_id ? String(row.family_id) : null,
    familySlug: row.family_slug ? String(row.family_slug) : null,
    configuration: metaConfig,
    specs: Array.isArray(row.specs)
      ? (row.specs as Array<{ label: string; value: string; group?: string }>)
      : [],
    featureBullets: Array.isArray(row.feature_bullets)
      ? row.feature_bullets.filter((x): x is string => typeof x === "string")
      : [],
    manufacturer:
      row.manufacturer && typeof row.manufacturer === "object"
        ? (row.manufacturer as ProductPayload["manufacturer"])
        : null,
    euResponsiblePerson:
      row.eu_responsible_person && typeof row.eu_responsible_person === "object"
        ? (row.eu_responsible_person as ProductPayload["euResponsiblePerson"])
        : null,
    safetyWarnings: Array.isArray(row.safety_warnings)
      ? row.safety_warnings.filter((x): x is string => typeof x === "string")
      : [],
    safetyDocuments: Array.isArray(row.safety_documents)
      ? row.safety_documents.filter((x): x is string => typeof x === "string")
      : [],
    eprelId: row.eprel_id ? String(row.eprel_id) : null,
    energyLabel:
      row.energy_label && typeof row.energy_label === "object"
        ? (row.energy_label as ProductPayload["energyLabel"])
        : null,
    countryOfOrigin: row.country_of_origin
      ? String(row.country_of_origin)
      : null,
    packageWeightKg:
      row.package_weight_kg == null ? null : Number(row.package_weight_kg),
    packageLengthCm:
      row.package_length_cm == null ? null : Number(row.package_length_cm),
    packageWidthCm:
      row.package_width_cm == null ? null : Number(row.package_width_cm),
    packageHeightCm:
      row.package_height_cm == null ? null : Number(row.package_height_cm),
    chargerIncluded:
      typeof row.charger_included === "boolean" ? row.charger_included : null,
    chargingPowerMinW:
      row.charging_power_min_w == null
        ? null
        : Number(row.charging_power_min_w),
    chargingPowerMaxW:
      row.charging_power_max_w == null
        ? null
        : Number(row.charging_power_max_w),
    usbPdSupported:
      typeof row.usb_pd_supported === "boolean" ? row.usb_pd_supported : null,
    batteryDetails:
      row.battery_details && typeof row.battery_details === "object"
        ? (row.battery_details as ProductPayload["batteryDetails"])
        : null,
    marketplaceCategoryMappings:
      row.marketplace_category_mappings &&
      typeof row.marketplace_category_mappings === "object"
        ? (row.marketplace_category_mappings as Record<string, unknown>)
        : {},
    marketplaceAttributes:
      row.marketplace_attributes && typeof row.marketplace_attributes === "object"
        ? (row.marketplace_attributes as Record<string, unknown>)
        : {},
  };

  if (rawVariants.length > 0) {
    return rawVariants.map((variant, index) => {
      const variantImages = Array.isArray(variant.images)
        ? variant.images.filter(
            (u): u is string => typeof u === "string" && u.length > 0,
          )
        : [];
      return {
        ...shared,
        sku: variant.sku ? String(variant.sku) : row.sku ? String(row.sku) : null,
        gtin: variant.gtin
          ? String(variant.gtin)
          : row.gtin
            ? String(row.gtin)
            : null,
        mpn: variant.mpn
          ? String(variant.mpn)
          : row.mpn
            ? String(row.mpn)
            : null,
        price:
          variant.price != null ? Number(variant.price) : Number(row.price ?? 0),
        compareAtPrice:
          variant.compareAtPrice != null
            ? Number(variant.compareAtPrice)
            : row.compare_at_price != null
              ? Number(row.compare_at_price)
              : null,
        stock:
          variant.stock != null ? Number(variant.stock) : Number(row.stock ?? 0),
        images: variantImages.length > 0 ? variantImages : baseImages,
        color: String(
          variant.color ||
            (typeof optionValues.color === "string" &&
            optionValues.color !== "unspecified"
              ? optionValues.color
              : ""),
        ),
        storage: String(
          variant.storage ||
            (typeof optionValues.storage === "string" &&
            optionValues.storage !== "unspecified"
              ? optionValues.storage
              : ""),
        ),
        variantIndex: index,
        variantCount: rawVariants.length,
      };
    });
  }

  return [
    {
      ...shared,
      sku: row.sku ? String(row.sku) : null,
      gtin: row.gtin ? String(row.gtin) : null,
      mpn: row.mpn ? String(row.mpn) : null,
      price: Number(row.price ?? 0),
      compareAtPrice:
        row.compare_at_price != null ? Number(row.compare_at_price) : null,
      stock: Number(row.stock ?? 0),
      images: baseImages,
      color:
        typeof optionValues.color === "string" &&
        optionValues.color !== "unspecified"
          ? optionValues.color
          : "",
      storage:
        typeof optionValues.storage === "string" &&
        optionValues.storage !== "unspecified"
          ? optionValues.storage
          : "",
      variantIndex: null,
      variantCount: 0,
    },
  ];
};

export const findModelCatalogCandidates = async (
  client: Pick<TransactionClient, "query">,
  input: {
    productId?: string | null;
    sku?: string | null;
    gtin?: string | null;
    category?: string | null;
    brand?: string | null;
    model?: string | null;
    title?: string | null;
  },
): Promise<CatalogOfferCandidate[]> => {
  const uuidOk = Boolean(
    input.productId && /^[0-9a-f-]{36}$/i.test(input.productId),
  );
  const category = (input.category || "smartphones").trim().toLowerCase();
  const brand = (input.brand ?? "").trim();
  const normBrand = normalizeOfferText(brand);
  const normModel = normalizeOfferText(input.model || input.title);
  const familyKey = modelFamilyKeyFor(input);
  const sku = (input.sku ?? "").trim();
  const gtin = (input.gtin ?? "").trim();

  if (!uuidOk && !sku && !gtin && !normModel) return [];

  const result = await client.query(
    `SELECT p.*, pfm.family_id, pfm.option_values, pf.slug AS family_slug
       FROM products p
       LEFT JOIN product_family_members pfm ON pfm.product_id = p.id
       LEFT JOIN product_families pf ON pf.id = pfm.family_id
      WHERE coalesce(p.import_metadata->>'catalogDeletedAt', '') = ''
        AND (
          ($1::uuid IS NOT NULL AND p.id = $1::uuid)
          OR ($2::text <> '' AND (
            lower(btrim(coalesce(p.sku, ''))) = lower($2)
            OR EXISTS (
              SELECT 1 FROM jsonb_array_elements(CASE WHEN jsonb_typeof(p.variants)='array' THEN p.variants ELSE '[]'::jsonb END) v
              WHERE lower(btrim(coalesce(v->>'sku', ''))) = lower($2)
            )
          ))
          OR ($3::text <> '' AND (
            btrim(coalesce(p.gtin, '')) = $3
            OR EXISTS (
              SELECT 1 FROM jsonb_array_elements(CASE WHEN jsonb_typeof(p.variants)='array' THEN p.variants ELSE '[]'::jsonb END) v
              WHERE btrim(coalesce(v->>'gtin', '')) = $3
            )
          ))
          OR pf.smartphone_model_key = $4
          OR (
            $5::text <> ''
            AND lower(coalesce(p.category, 'smartphones')) = $6
            AND lower(regexp_replace(coalesce(p.model, ''), '[^a-zA-Z0-9]+', '', 'g')) = $5
            AND ($7::text = '' OR lower(regexp_replace(coalesce(p.brand, ''), '[^a-zA-Z0-9]+', '', 'g')) = $7)
          )
        )
      ORDER BY p.is_active DESC, p.updated_at DESC NULLS LAST, p.created_at DESC
      LIMIT 80`,
    [
      uuidOk ? input.productId : null,
      sku,
      gtin,
      familyKey,
      normModel,
      category,
      normBrand,
    ],
  );

  const rows = result.rows as Array<Record<string, unknown>>;
  if (uuidOk) {
    const familyId = rows.find((r) => r.id === input.productId && r.family_id)?.family_id;
    const picked = rows.find((r) => r.id === input.productId);
    if (familyId && !rows.some((r) => r.family_id === familyId && r.id !== input.productId)) {
      const famRows = await client.query(
        `SELECT p.*, pfm.family_id, pfm.option_values, pf.slug AS family_slug
           FROM product_family_members pfm
           JOIN products p ON p.id = pfm.product_id
           JOIN product_families pf ON pf.id = pfm.family_id
          WHERE pfm.family_id = $1 AND coalesce(p.import_metadata->>'catalogDeletedAt', '') = ''
          LIMIT 80`,
        [familyId],
      );
      const seen = new Set(rows.map((r) => String(r.id)));
      for (const fr of famRows.rows as Array<Record<string, unknown>>) {
        if (!seen.has(String(fr.id))) rows.push(fr);
      }
    } else if (picked && picked.model && !normModel) {
      const more = await findModelCatalogCandidates(client, {
        category: String(picked.category ?? category),
        brand: picked.brand ? String(picked.brand) : brand,
        model: String(picked.model),
      });
      const seen = new Set<string>();
      return [...rows.flatMap(rowToCandidates), ...more].filter((c) => {
        const key = `${c.id}:${c.variantIndex ?? -1}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }
  }

  return rows.flatMap(rowToCandidates);
};

export const ensureModelFamilyMembership = async (
  client: TransactionClient,
  input: {
    productId: string;
    category: string;
    brand?: string | null;
    model?: string | null;
    title?: string | null;
    condition: OfferCondition;
    color?: string | null;
    storage?: string | null;
    configuration?: Record<string, string> | null;
    existingFamilyId?: string | null;
  },
): Promise<string | null> => {
  const brand = (input.brand ?? "").trim();
  const model = (input.model || input.title || "").trim();
  if (!brand || !model) return input.existingFamilyId ?? null;

  const modelFamilyKey = modelFamilyKeyFor({
    category: input.category,
    brand,
    model,
    title: input.title,
  });
  const normBrand = normalizeOfferText(brand);
  const normModel = normalizeOfferText(model);
  const normCat = (input.category || "smartphones").trim().toLowerCase();

  let familyRow = input.existingFamilyId
    ? (
        await client.query(
          `SELECT id, option_axes FROM product_families WHERE id = $1::uuid FOR UPDATE`,
          [input.existingFamilyId],
        )
      ).rows[0]
    : undefined;

  if (!familyRow) {
    familyRow = (
      await client.query(
        `SELECT id, option_axes FROM product_families WHERE smartphone_model_key = $1 FOR UPDATE`,
        [modelFamilyKey],
      )
    ).rows[0] as { id: string; option_axes: unknown } | undefined;
  }

  if (!familyRow) {
    familyRow = (
      await client.query(
        `SELECT pf.id, pf.option_axes
           FROM product_families pf
           JOIN product_family_members pfm ON pfm.family_id = pf.id
           JOIN products p ON p.id = pfm.product_id
          WHERE pf.smartphone_model_key IS NOT NULL
            AND coalesce(p.import_metadata->>'catalogDeletedAt', '') = ''
            AND lower(coalesce(p.category, 'smartphones')) = $1
            AND lower(regexp_replace(coalesce(p.brand, ''), '[^a-zA-Z0-9]+', '', 'g')) = $2
            AND lower(regexp_replace(coalesce(p.model, ''), '[^a-zA-Z0-9]+', '', 'g')) = $3
          LIMIT 1
          FOR UPDATE OF pf`,
        [normCat, normBrand, normModel],
      )
    ).rows[0] as { id: string; option_axes: unknown } | undefined;
  }

  const siblingRows = (
    await client.query(
      `SELECT p.id, p.condition, p.variants, p.import_metadata, pfm.family_id, pfm.option_values
         FROM products p
         LEFT JOIN product_family_members pfm ON pfm.product_id = p.id
        WHERE coalesce(p.import_metadata->>'catalogDeletedAt', '') = ''
          AND jsonb_array_length(CASE WHEN jsonb_typeof(p.variants)='array' THEN p.variants ELSE '[]'::jsonb END) <= 1
          AND lower(coalesce(p.category, 'smartphones')) = $1
          AND lower(regexp_replace(coalesce(p.brand, ''), '[^a-zA-Z0-9]+', '', 'g')) = $2
          AND lower(regexp_replace(coalesce(p.model, ''), '[^a-zA-Z0-9]+', '', 'g')) = $3
        ORDER BY (p.id = $4::uuid) DESC, p.is_active DESC, p.created_at ASC`,
      [normCat, normBrand, normModel, input.productId],
    )
  ).rows as Array<Record<string, unknown>>;

  const hasColor =
    Boolean(canonicalOfferColor(input.color)) ||
    siblingRows.some((r) => {
      const vars = Array.isArray(r.variants) ? (r.variants as Array<Record<string, unknown>>) : [];
      return Boolean(canonicalOfferColor(String(vars[0]?.color ?? "")));
    });
  const hasStorage =
    Boolean(canonicalOfferStorage(input.storage)) ||
    siblingRows.some((r) => {
      const vars = Array.isArray(r.variants) ? (r.variants as Array<Record<string, unknown>>) : [];
      return Boolean(canonicalOfferStorage(String(vars[0]?.storage ?? "")));
    });

  if (!familyRow && !hasColor && !hasStorage && siblingRows.length < 2) {
    return null;
  }

  let familyId = familyRow?.id ? String(familyRow.id) : null;
  const anyConfig =
    Boolean(input.configuration && Object.keys(input.configuration).length > 0) ||
    siblingRows.some((r) => {
      const meta = r.import_metadata as Record<string, unknown> | undefined;
      const se = meta?.smartphoneEditor as Record<string, unknown> | undefined;
      const cfg = se?.configuration as Record<string, unknown> | undefined;
      return Boolean(cfg && Object.keys(cfg).length > 0);
    });

  const axes = [
    ...(hasColor ? ["color"] : []),
    ...(hasStorage ? ["storage"] : []),
    "condition",
    ...(anyConfig ? ["configuration"] : []),
  ];

  if (!familyId) {
    const newId = randomUUID();
    const baseFamSlug = buildBaseSlug({
      title: `${brand} ${model}`,
      brand,
      model,
      condition: "new",
    }).replace(/-neu$/, "");
    const takenSlugs = new Set(
      (
        await client.query(`SELECT slug FROM product_families WHERE slug LIKE $1`, [
          `phone-${newId.slice(0, 8)}%`,
        ])
      ).rows.map((r) => String(r.slug)),
    );
    const famSlug = uniquifySlug(
      baseFamSlug ? `${baseFamSlug}-${newId.slice(0, 8)}` : `phone-${newId}`,
      takenSlugs,
    );
    const insertedFamily = await client.query(
      `INSERT INTO product_families(id, name, slug, option_axes, is_active, smartphone_model_key)
       VALUES($1, $2, $3, $4::jsonb, true, $5)
       ON CONFLICT (smartphone_model_key) DO UPDATE SET updated_at = now()
       RETURNING id`,
      [newId, `${brand} ${model}`, famSlug, JSON.stringify(axes), modelFamilyKey],
    );
    familyId = String(insertedFamily.rows[0].id);
  } else {
    const existingAxes = Array.isArray(familyRow?.option_axes)
      ? (familyRow.option_axes as unknown[]).filter((a): a is string => typeof a === "string")
      : [];
    const mergedAxes = [...new Set([...existingAxes, ...axes])];
    if (mergedAxes.length !== existingAxes.length) {
      await client.query(
        `UPDATE product_families SET option_axes = $2::jsonb, updated_at = now() WHERE id = $1`,
        [familyId, JSON.stringify(mergedAxes)],
      );
      if (mergedAxes.includes("color")) {
        await client.query(
          `UPDATE product_family_members
              SET option_values = jsonb_set(option_values, '{color}', to_jsonb('unspecified'::text))
            WHERE family_id = $1 AND NOT (option_values ? 'color')`,
          [familyId],
        );
      }
      if (mergedAxes.includes("storage")) {
        await client.query(
          `UPDATE product_family_members
              SET option_values = jsonb_set(option_values, '{storage}', to_jsonb('unspecified'::text))
            WHERE family_id = $1 AND NOT (option_values ? 'storage')`,
          [familyId],
        );
      }
      if (mergedAxes.includes("configuration")) {
        await client.query(
          `UPDATE product_family_members
              SET option_values = jsonb_set(option_values, '{configuration}', to_jsonb('Standard'::text))
            WHERE family_id = $1 AND NOT (option_values ? 'configuration')`,
          [familyId],
        );
      }
    }
  }

  const familyFinalAxes = (
    await client.query(`SELECT option_axes FROM product_families WHERE id = $1`, [familyId])
  ).rows[0]?.option_axes;
  const effectiveAxes = Array.isArray(familyFinalAxes)
    ? (familyFinalAxes as unknown[]).filter((x): x is string => typeof x === "string")
    : axes;

  const existingMembers = (
    await client.query(
      `SELECT pfm.product_id, pfm.option_values
         FROM product_family_members pfm
        WHERE pfm.family_id = $1`,
      [familyId],
    )
  ).rows as Array<{ product_id: string; option_values: Record<string, string> }>;
  const memberIds = new Set(existingMembers.map((m) => String(m.product_id)));
  const existingNewCombos = new Set<string>();
  for (const m of existingMembers) {
    if ((m.option_values?.condition ?? "new") === "new") {
      existingNewCombos.add(
        `${normalizeOfferColorKey(m.option_values?.color)}|${normalizeOfferStorageKey(m.option_values?.storage)}|${normalizeOfferText(m.option_values?.configuration || "Standard")}`,
      );
    }
  }

  const enrollProduct = async (
    pid: string,
    cond: OfferCondition,
    colorVal: string,
    storageVal: string,
    cfg: Record<string, string> | null | undefined,
  ) => {
    const optionValues: Record<string, string> = {
      ...(effectiveAxes.includes("color") || hasColor ? { color: colorVal || "unspecified" } : {}),
      ...(effectiveAxes.includes("storage") || hasStorage ? { storage: storageVal || "unspecified" } : {}),
      condition: cond,
      device: pid,
      ...(effectiveAxes.includes("configuration") || anyConfig
        ? { configuration: configurationLabel(cfg ?? undefined) }
        : {}),
    };
    const comboKey = `${normalizeOfferColorKey(colorVal)}|${normalizeOfferStorageKey(storageVal)}|${normalizeOfferText(configurationLabel(cfg ?? undefined))}`;
    if (cond === "new" && existingNewCombos.has(comboKey) && !memberIds.has(pid)) {
      return;
    }
    if (cond === "new") existingNewCombos.add(comboKey);

    await client.query(
      `INSERT INTO product_family_members(family_id, product_id, option_values, is_active)
       VALUES($1, $2, $3::jsonb, true)
       ON CONFLICT (product_id) DO UPDATE SET
         family_id = excluded.family_id,
         option_values = excluded.option_values,
         is_active = true
       WHERE product_family_members.family_id = excluded.family_id`,
      [familyId, pid, JSON.stringify(optionValues)],
    );
    await client.query(
      `INSERT INTO product_experience_profiles(product_id, enabled_sections)
       VALUES($1, '{"familyConfigurator":true}'::jsonb)
       ON CONFLICT (product_id) DO UPDATE SET
         enabled_sections = product_experience_profiles.enabled_sections || excluded.enabled_sections`,
      [pid],
    );
    memberIds.add(pid);
  };

  await enrollProduct(
    input.productId,
    input.condition,
    canonicalOfferColor(input.color),
    canonicalOfferStorage(input.storage),
    input.configuration,
  );
  for (const r of siblingRows) {
    const pid = String(r.id);
    if (pid === input.productId || (r.family_id && String(r.family_id) !== familyId)) {
      continue;
    }
    const vars = Array.isArray(r.variants)
      ? (r.variants as Array<Record<string, unknown>>)
      : [];
    const meta = r.import_metadata as Record<string, unknown> | undefined;
    const se = meta?.smartphoneEditor as Record<string, unknown> | undefined;
    const cfg =
      se?.configuration && typeof se.configuration === "object"
        ? (se.configuration as Record<string, string>)
        : undefined;
    await enrollProduct(
      pid,
      normalizeConditionDb(r.condition),
      canonicalOfferColor(String(vars[0]?.color ?? "")),
      canonicalOfferStorage(String(vars[0]?.storage ?? "")),
      cfg,
    );
  }

  return familyId;
};

export const applyExactOfferUpdateInTransaction = async (
  client: TransactionClient,
  params: {
    candidate: CatalogOfferCandidate;
    price: number;
    compareAtPrice?: number | null;
    addedQuantity?: number;
    targetQuantity?: number | null;
    conditionNote?: string | null;
    batteryHealth?: number | null;
    batteryHealthRange?: BatteryHealthRange | null;
    images?: string[];
    hasRealProductPhotos?: boolean;
    actor: string;
    referenceType: string;
    referenceId: string;
  },
): Promise<{
  productId: string;
  previousStock: number;
  newStock: number;
  addedQuantity: number;
  price: number;
  familyId: string | null;
}> => {
  const locked = await client.query(
    `SELECT id, sku, price, compare_at_price, stock, variants, condition, condition_note,
            battery_health, has_real_product_photos, images, is_active, brand, model, title, category, import_metadata
       FROM products WHERE id = $1::uuid FOR UPDATE`,
    [params.candidate.id],
  );
  const row = locked.rows[0] as Record<string, unknown> | undefined;
  if (!row) throw new Error("matched_product_not_found");

  const previousStock = Number(params.candidate.stock ?? row.stock ?? 0);
  const variants = Array.isArray(row.variants)
    ? [...(row.variants as Array<Record<string, unknown>>)]
    : [];
  const variantIdx =
    params.candidate.variantIndex != null &&
    params.candidate.variantIndex >= 0 &&
    params.candidate.variantIndex < variants.length
      ? params.candidate.variantIndex
      : params.candidate.sku
        ? variants.findIndex(
            (v) =>
              String(v.sku ?? "").trim().toLowerCase() ===
              params.candidate.sku!.trim().toLowerCase(),
          )
        : variants.length === 1
          ? 0
          : -1;

  const targetSku =
    (variantIdx >= 0 && variants[variantIdx]?.sku
      ? String(variants[variantIdx].sku)
      : null) ||
    params.candidate.sku ||
    (row.sku ? String(row.sku) : null);

  const addQty = Math.max(0, Math.round(params.addedQuantity ?? 0));
  if (targetSku) {
    const invRes = await client.query(
      `SELECT id, sku, on_hand, reserved, safety_buffer, is_active
         FROM inventory_skus
        WHERE product_id = $1::uuid AND location = 'local' AND sku = $2
        FOR UPDATE`,
      [row.id, targetSku],
    );
    const inv = invRes.rows[0] as Record<string, unknown> | undefined;
    if (inv) {
      const currentOnHand = Number(inv.on_hand);
      const reserved = Number(inv.reserved ?? 0);
      const buffer = Number(inv.safety_buffer ?? 0);
      const currentSellable = Math.max(0, currentOnHand - reserved - buffer);
      const nextSellable =
        params.targetQuantity != null
          ? Math.max(0, Math.round(params.targetQuantity))
          : currentSellable + addQty;
      const desiredOnHand = nextSellable + reserved + buffer;
      const delta = desiredOnHand - currentOnHand;
      if (delta !== 0) {
        if (Boolean(row.is_active) && Boolean(inv.is_active)) {
          await client.query(
            `SELECT * FROM adjust_inventory($1, $2, $3, $4, $5, $6, $7::jsonb)`,
            [
              targetSku,
              delta > 0 ? "restock" : "correction",
              delta,
              params.referenceType,
              params.referenceId,
              params.actor,
              JSON.stringify({ autoMatched: true, addedQuantity: addQty }),
            ],
          );
        } else {
          await client.query(
            `UPDATE inventory_skus SET on_hand = $2, updated_at = now() WHERE id = $1`,
            [inv.id, desiredOnHand],
          );
          await client.query(
            `INSERT INTO inventory_adjustments(inventory_sku_id, event_type, quantity_delta, reference_type, reference_id, actor, metadata)
             VALUES($1, $2, $3, $4, $5, $6, $7::jsonb)`,
            [
              inv.id,
              delta > 0 ? "restock" : "adjustment",
              delta,
              params.referenceType,
              params.referenceId,
              params.actor,
              JSON.stringify({ autoMatched: true }),
            ],
          );
        }
      }
      if (!row.is_active || !inv.is_active) {
        const nextTotalStock =
          variantIdx >= 0 && variants.length > 1
            ? variants.reduce(
                (sum, v, i) =>
                  sum + (i === variantIdx ? nextSellable : Number(v.stock ?? 0)),
                0,
              )
            : nextSellable;
        if (variantIdx >= 0) {
          variants[variantIdx] = { ...variants[variantIdx], stock: nextSellable };
        }
        await client.query(
          `UPDATE products SET stock = $2, variants = $3::jsonb WHERE id = $1::uuid`,
          [row.id, nextTotalStock, JSON.stringify(variants)],
        );
      }
    } else {
      const nextSellable =
        params.targetQuantity != null
          ? Math.max(0, Math.round(params.targetQuantity))
          : previousStock + addQty;
      if (variantIdx >= 0) {
        variants[variantIdx] = { ...variants[variantIdx], stock: nextSellable };
      }
      await client.query(
        `INSERT INTO inventory_skus(product_id, sku, location, on_hand, reserved, safety_buffer, is_active)
         VALUES($1::uuid, $2, 'local', $3, 0, 0, $4)
         ON CONFLICT (sku, location) DO NOTHING`,
        [row.id, targetSku, nextSellable, Boolean(row.is_active)],
      );
      await client.query(
        `UPDATE products SET stock = $2, variants = $3::jsonb WHERE id = $1::uuid`,
        [row.id, nextSellable, JSON.stringify(variants)],
      );
    }
  } else {
    const nextSellable =
      params.targetQuantity != null
        ? Math.max(0, Math.round(params.targetQuantity))
        : previousStock + addQty;
    await client.query(`UPDATE products SET stock = $2 WHERE id = $1::uuid`, [
      row.id,
      nextSellable,
    ]);
  }

  const afterStockRow = (
    await client.query(`SELECT stock, variants FROM products WHERE id = $1::uuid`, [
      row.id,
    ])
  ).rows[0] as { stock: number; variants: Array<Record<string, unknown>> };
  const liveVariants = Array.isArray(afterStockRow.variants)
    ? [...afterStockRow.variants]
    : [];
  const nextVariants =
    variantIdx >= 0 && variantIdx < liveVariants.length
      ? liveVariants.map((v, idx) =>
          idx === variantIdx
            ? {
                ...v,
                price: params.price,
                ...(params.compareAtPrice !== undefined
                  ? { compareAtPrice: params.compareAtPrice }
                  : {}),
              }
            : v,
        )
      : liveVariants;

  const updateBasePrice =
    variantIdx < 0 ||
    nextVariants.length <= 1 ||
    nextVariants[variantIdx]?.isDefault === true;

  const mergedImages =
    params.images && params.images.length > 0
      ? [
          ...new Set([
            ...(Array.isArray(row.images) ? (row.images as string[]) : []),
            ...params.images,
          ]),
        ].slice(0, 8)
      : undefined;

  const batteryRange =
    params.batteryHealthRange && validBatteryHealthRange(params.batteryHealthRange)
      ? params.batteryHealthRange
      : undefined;

  await client.query(
    `UPDATE products
        SET price = CASE WHEN $2 THEN $3 ELSE price END,
            compare_at_price = CASE WHEN $2 AND $4::numeric IS NOT NULL THEN $4::numeric ELSE compare_at_price END,
            variants = $5::jsonb,
            condition_note = CASE WHEN $6::text IS NOT NULL AND btrim($6::text) <> '' THEN $6::text ELSE condition_note END,
            battery_health = CASE
              WHEN $7::jsonb IS NOT NULL THEN NULL
              WHEN $8::smallint IS NOT NULL THEN $8::smallint
              ELSE battery_health
            END,
            has_real_product_photos = has_real_product_photos OR $9::boolean,
            images = COALESCE($10::text[], images),
            import_metadata = CASE
              WHEN $7::jsonb IS NOT NULL THEN jsonb_set(coalesce(import_metadata, '{}'::jsonb), '{batteryHealthRange}', $7::jsonb, true)
              WHEN $8::smallint IS NOT NULL THEN coalesce(import_metadata, '{}'::jsonb) - 'batteryHealthRange'
              ELSE import_metadata
            END,
            updated_at = now()
      WHERE id = $1::uuid`,
    [
      row.id,
      updateBasePrice,
      params.price,
      params.compareAtPrice ?? null,
      JSON.stringify(nextVariants),
      params.conditionNote ?? null,
      batteryRange ? JSON.stringify(batteryRange) : null,
      batteryRange ? null : (params.batteryHealth ?? null),
      Boolean(params.hasRealProductPhotos),
      mergedImages ?? null,
    ],
  );

  await markOpenIntakeRunsStale(
    String(row.id),
    "Catalog offer auto-restock / price update",
    client,
  );

  const familyId = await ensureModelFamilyMembership(client, {
    productId: String(row.id),
    category: String(row.category ?? params.candidate.category),
    brand: row.brand ? String(row.brand) : params.candidate.brand,
    model: row.model ? String(row.model) : params.candidate.model,
    title: row.title ? String(row.title) : params.candidate.title,
    condition: normalizeConditionDb(row.condition),
    color: params.candidate.color,
    storage: params.candidate.storage,
    configuration: params.candidate.configuration,
  });

  const newStock =
    variantIdx >= 0 && nextVariants[variantIdx]?.stock != null
      ? Number(nextVariants[variantIdx].stock)
      : Number(afterStockRow.stock ?? previousStock + addQty);

  return {
    productId: String(row.id),
    previousStock,
    newStock,
    addedQuantity: Math.max(0, newStock - previousStock),
    price: params.price,
    familyId: familyId ?? params.candidate.familyId,
  };
};
