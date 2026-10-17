import { beforeAll, afterAll, describe, expect, it, vi } from 'vitest';
import { readFile, mkdtemp, rm, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { randomUUID } from 'node:crypto';

const target = new URL(
  process.env.DATABASE_URL ?? 'postgresql://invalid/invalid',
);
if (
  process.env.APFEL_AUDIT_DISPOSABLE !== 'apfel_telegram_test' ||
  target.hostname !== '127.0.0.1' ||
  target.pathname !== '/apfel_telegram_test' ||
  target.username !== 'apfel_telegram_test'
)
  throw new Error('Runner-owned disposable Telegram DB required');
vi.mock('server-only', () => ({}));
vi.mock('@/lib/marketing', () => ({
  autoPublishProductPromotion: vi.fn().mockResolvedValue([]),
}));
vi.mock('@/lib/product-intake/stale-runs', () => ({
  markOpenIntakeRunsStale: vi.fn(),
}));
const provider = vi.hoisted(() => ({
  research: vi.fn(),
  privacy: vi.fn(),
  studio: vi.fn(),
}));
vi.mock('@/lib/product-research-service', () => ({
  researchProductFromOfficialPages: provider.research,
}));
vi.mock('@/lib/telegram-products/photos', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('../../src/lib/telegram-products/photos')
  >()),
  prepareTelegramPhoto: provider.privacy,
  studioPhoto: provider.studio,
}));
const fileRoot = await mkdtemp(path.join(tmpdir(), 'apfel-telegram-db-'));
process.env.UPLOADS_DIR = path.join(fileRoot, 'uploads');
process.env.TELEGRAM_PRODUCT_PRIVATE_DIR = path.join(fileRoot, 'private');
const { query } = await import('../../src/lib/db');
const { createInvite, enroll, handleBotAction, readSession } = await import(
  '../../src/lib/telegram-products/repository'
);
const { savePhoneDraft, publishPhoneDraft, deletePhoneDraft, deletePhoneDrafts, loadPhoneDraft, listPhoneDrafts } = await import(
  '../../src/lib/smartphone-editor/repository'
);
const { newConversation } = await import(
  '../../src/lib/telegram-products/model'
);
const { withTransaction } = await import('../../src/lib/db');
const { runTelegramProductWorkerPass } = await import(
  '../../src/lib/telegram-products/worker'
);
const { ingestPhoto } = await import('../../src/lib/telegram-products/photos');

beforeAll(async () => {
  expect((await query('SELECT current_database() AS db')).rows[0].db).toBe(
    'apfel_telegram_test',
  );
  process.env.TELEGRAM_PRODUCTS_ENABLED = 'true';
  process.env.TELEGRAM_PRODUCTS_PUBLISH_ENABLED = 'true';
  const groups: [string[], string][] = [
    [
      [
        'title',
        'subtitle',
        'description',
        'category',
        'brand',
        'model',
        'sku',
        'slug',
        'condition',
        'condition_note',
        'subcategory',
        'mpn',
        'gtin',
        'eprel_id',
        'asin',
        'ebay_epid',
        'identifier_status',
        'country_of_origin',
      ],
      'text',
    ],
    [
      [
        'price',
        'compare_at_price',
        'package_weight_kg',
        'package_length_cm',
        'package_width_cm',
        'package_height_cm',
        'charging_power_min_w',
        'charging_power_max_w',
      ],
      'numeric',
    ],
    [['stock', 'battery_health'], 'integer'],
    [
      [
        'is_active',
        'has_real_product_photos',
        'charger_included',
        'usb_pd_supported',
        'amazon_gtin_exemption',
        'amazon_renewed_approved',
        'catalog_enabled',
      ],
      'boolean',
    ],
    [
      ['images', 'feature_bullets', 'safety_warnings', 'safety_documents'],
      'text[]',
    ],
    [
      [
        'specs',
        'manufacturer',
        'eu_responsible_person',
        'energy_label',
        'faq',
        'battery_details',
        'marketplace_category_mappings',
        'marketplace_attributes',
        'import_metadata',
        'title_i18n',
        'subtitle_i18n',
        'description_i18n',
        'feature_bullets_i18n',
        'specs_i18n',
      ],
      "jsonb DEFAULT '{}'::jsonb",
    ],
  ];
  await query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";CREATE EXTENSION IF NOT EXISTS pgcrypto;
    CREATE TABLE products(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),created_at timestamptz DEFAULT now(),updated_at timestamptz DEFAULT now(),variants jsonb DEFAULT '[]',${groups.flatMap(([names, type]) => names.map((name) => `${name} ${type}`)).join(',')});
    CREATE TABLE orders(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),items jsonb DEFAULT '[]');
    CREATE TABLE product_reviews(id uuid PRIMARY KEY DEFAULT gen_random_uuid());
    CREATE TABLE store_settings(key text PRIMARY KEY,value jsonb,updated_at timestamptz DEFAULT now());`);
  for (const migration of [
    '20260712_marketplace_foundation.sql',
    '20260818_live_omnichannel_inventory.sql',
    '20260827_professional_product_platform.sql',
    '20260907_smartphone_editor_drafts.sql',
    '20261008_smartphone_draft_deletion.sql',
    '20261016_telegram_product_entry.sql',
  ])
    await query(await readFile(`supabase/migrations/${migration}`, 'utf8'));
});
afterAll(async () => {
  await rm(fileRoot, { recursive: true, force: true });
});

let sequence = 1;
const request = (
  id: string,
  action: string,
  extra: Record<string, unknown> = {},
) =>
  handleBotAction({
    telegramId: id,
    chatId: id,
    updateId: sequence++,
    action,
    ...extra,
  });
const member = async (id: string) => {
  const token = await createInvite('Synthetic staff', 'owner');
  await enroll(id, token, 'Synthetic staff', 'en');
  await query(
    "UPDATE telegram_product_members SET status='active' WHERE telegram_id=$1",
    [id],
  );
};

describe('Telegram intake PostgreSQL lifecycle', () => {
  it('keeps enrollment pending, consumes invites once, and denies revoked members', async () => {
    const token = await createInvite('Staff', 'owner');
    await enroll('1001', token, 'Staff', 'en');
    await expect(request('1001', 'new')).rejects.toThrow('membership_required');
    await expect(enroll('1002', token, 'Other', 'en')).rejects.toThrow(
      'invalid_invite',
    );
    await query(
      "UPDATE telegram_product_members SET status='active' WHERE telegram_id=1001",
    );
    const view = await request('1001', 'new');
    expect(view.sessionId).toBeTruthy();
    await query(
      "UPDATE telegram_product_members SET status='revoked' WHERE telegram_id=1001",
    );
    await expect(
      request('1001', 'status', { sessionId: view.sessionId }),
    ).rejects.toThrow('membership_required');
    expect(
      (await query('SELECT count(*)::int AS n FROM products')).rows[0].n,
    ).toBe(0);
  });
  it('serializes concurrent starts, rejects cross-member reads and detects stale callbacks', async () => {
    await member('2001');
    await member('2002');
    const [a, b] = await Promise.all([
      request('2001', 'new'),
      request('2001', 'new'),
    ]);
    expect(a.sessionId).toBe(b.sessionId);
    await expect(
      request('2002', 'status', { sessionId: a.sessionId }),
    ).rejects.toThrow('forbidden');
    const changed = await request('2001', 'choose:smartphones', {
      sessionId: a.sessionId,
      revision: a.revision,
    });
    await expect(
      request('2001', 'choose:Apple', {
        sessionId: a.sessionId,
        revision: a.revision,
      }),
    ).rejects.toThrow('stale_action');
    expect(changed.revision).toBe(a.revision + 1);
  });
  it('deduplicates Telegram update IDs and survives a fresh status request', async () => {
    await member('3001');
    const view = await request('3001', 'new');
    const payload = {
      telegramId: '3001',
      chatId: '3001',
      updateId: 50000,
      action: 'choose:tablets',
      sessionId: view.sessionId,
      revision: view.revision,
    };
    const first = await handleBotAction(payload),
      replay = await handleBotAction(payload);
    expect(replay.revision).toBe(first.revision);
    expect(replay.text).toBe(first.text);
    await expect(
      handleBotAction({ ...payload, action: 'choose:laptops' }),
    ).rejects.toThrow('update_conflict');
    expect((await request('3001', 'status')).revision).toBe(first.revision);
  });
  it('creates only drafts, locks submitted sessions and prevents removing their provenance', async () => {
    await member('4001');
    const view = await request('4001', 'new');
    const row = await withTransaction((client) =>
      readSession(client, view.sessionId!),
    );
    row.state.stage = 'review';
    await query('UPDATE telegram_product_sessions SET state=$2 WHERE id=$1', [
      row.id,
      JSON.stringify(row.state),
    ]);
    const submitted = await request('4001', 'submit', {
      sessionId: row.id,
      revision: view.revision,
    });
    expect(submitted.text).toContain('submitted');
    await expect(
      request('4001', 'edit:model', {
        sessionId: row.id,
        revision: submitted.revision,
      }),
    ).rejects.toThrow('submission_locked');
    const saved = await withTransaction((client) =>
      readSession(client, row.id),
    );
    const copy = structuredClone(saved.document);
    delete copy.telegramSessionId;
    await expect(
      savePhoneDraft(saved.draft_id, saved.draft_revision, copy, 'admin'),
    ).rejects.toThrow('conflict');
    expect(
      (await query('SELECT count(*)::int AS n FROM products')).rows[0].n,
    ).toBe(0);
  });
  it('requires the owner and actual-device confirmation; publishes once through the real inventory ledger', async () => {
    await member('5001');
    const view = await request('5001', 'new');
    const row = await withTransaction((client) =>
      readSession(client, view.sessionId!),
    );
    const doc = newConversation('en').document;
    doc.telegramSessionId = row.id;
    doc.shared = {
      title: 'Synthetic accessory',
      brand: 'Fixture',
      model: `Fixture ${randomUUID()}`,
      category: 'accessories',
      description: 'A factual synthetic product description.',
    };
    Object.assign(doc.entries[0], {
      price: 25,
      stock: 3,
      color: 'Black',
      storage: '',
      hasRealProductPhotos: false,
    });
    doc.entries[0].details.identifierStatus = 'not_applicable';
    doc.entries[0].photos[0].url =
      'https://example.invalid/synthetic-device.webp';
    await query('UPDATE smartphone_editor_drafts SET document=$2 WHERE id=$1', [
      row.draft_id,
      JSON.stringify(doc),
    ]);
    await query(
      "UPDATE telegram_product_sessions SET status='submitted' WHERE id=$1",
      [row.id],
    );
    const publish = {
      revision: 1,
      requestId: randomUUID(),
      entryIds: [doc.entries[0].id],
    };
    await expect(
      publishPhoneDraft(row.draft_id, publish, 'staff', false, false),
    ).rejects.toThrow('owner_approval_required');
    await expect(
      publishPhoneDraft(row.draft_id, publish, 'owner', true, true),
    ).rejects.toThrow('actual_device_photo_required');
    doc.entries[0].hasRealProductPhotos = true;
    await query('UPDATE smartphone_editor_drafts SET document=$2 WHERE id=$1', [
      row.draft_id,
      JSON.stringify(doc),
    ]);
    const published = await publishPhoneDraft(
      row.draft_id,
      publish,
      'owner',
      true,
      true,
    );
    const replay = await publishPhoneDraft(
      row.draft_id,
      publish,
      'owner',
      true,
      true,
    );
    expect(replay).toEqual(published);
    const inventory = (
      await query(
        'SELECT on_hand,reserved FROM inventory_skus WHERE product_id=$1',
        [published.results[0].productId],
      )
    ).rows[0];
    expect(inventory).toMatchObject({ on_hand: 3, reserved: 0 });
    expect(
      (
        await query(
          "SELECT count(*)::int AS n FROM inventory_adjustments WHERE reference_type='telegram_product'",
        )
      ).rows[0].n,
    ).toBe(1);
    expect(
      (
        await query(
          'SELECT status FROM telegram_product_sessions WHERE id=$1',
          [row.id],
        )
      ).rows[0].status,
    ).toBe('published');
  });
  it('archives active and cancelled Telegram drafts atomically, cancels jobs and preserves evidence', async () => {
    await member('5901'); await member('5902');
    const first = await request('5901', 'new');
    const second = await request('5902', 'new');
    const a = await withTransaction(client => readSession(client, first.sessionId!));
    const b = await withTransaction(client => readSession(client, second.sessionId!));
    expect((await loadPhoneDraft(a.draft_id)).telegramStatus).toBe('collecting');
    await query("UPDATE telegram_product_sessions SET status='cancelled' WHERE id=$1", [b.id]);
    await query("INSERT INTO telegram_product_jobs(session_id,kind,payload) VALUES($1,'research','{}')", [a.id]);
    await expect(deletePhoneDraft(a.draft_id, 'other-admin', a.draft_revision)).rejects.toMatchObject({status:403});
    await expect(deletePhoneDrafts([{id:a.draft_id,revision:a.draft_revision},{id:b.draft_id,revision:b.draft_revision+1}], 'owner', true)).rejects.toMatchObject({message:'conflict'});
    expect((await loadPhoneDraft(a.draft_id)).revision).toBe(a.draft_revision);
    await deletePhoneDrafts([{id:a.draft_id,revision:a.draft_revision},{id:b.draft_id,revision:b.draft_revision}], 'owner', true);
    expect((await query('SELECT status FROM telegram_product_sessions WHERE id=$1',[a.id])).rows[0].status).toBe('cancelled');
    expect((await query('SELECT status FROM telegram_product_jobs WHERE session_id=$1',[a.id])).rows[0].status).toBe('cancelled');
    expect((await query("SELECT count(*)::int AS n FROM telegram_product_events WHERE session_id IN ($1,$2) AND event_type='admin_draft_deleted'",[a.id,b.id])).rows[0].n).toBe(2);
    await expect(loadPhoneDraft(a.draft_id)).rejects.toMatchObject({status:404});
    expect((await listPhoneDrafts()).some(draft => draft.id===a.draft_id)).toBe(false);
    await expect(request('5901', 'status', {sessionId:a.id})).rejects.toThrow('session_not_found');
    expect((await request('5901', 'new')).sessionId).not.toBe(a.id);
  });
  it('discards an in-flight research result when the owner deletes its draft', async () => {
    await member('5903');
    const view = await request('5903', 'new');
    const row = await withTransaction(client => readSession(client, view.sessionId!));
    row.document.shared.brand='Apple'; row.document.shared.model='Deletion fixture'; row.state.stage='researching';
    await query('UPDATE smartphone_editor_drafts SET document=$2 WHERE id=$1',[row.draft_id,JSON.stringify(row.document)]);
    await query('UPDATE telegram_product_sessions SET state=$2 WHERE id=$1',[row.id,JSON.stringify(row.state)]);
    await query("INSERT INTO telegram_product_jobs(session_id,kind,payload) VALUES($1,'research',$2)",[row.id,JSON.stringify({query:'Apple Deletion fixture',condition:'new',category:'smartphones'})]);
    let finish: (value: unknown) => void = () => {};
    let started: () => void = () => {};
    const began = new Promise<void>(resolve => {started=resolve});
    provider.research.mockImplementationOnce(() => {started();return new Promise(resolve => {finish=resolve})});
    const work = runTelegramProductWorkerPass();await began;
    await deletePhoneDraft(row.draft_id, 'owner', row.draft_revision, true);
    finish({title:'Must not resurrect deleted draft',brand:'Apple',model:'Deletion fixture',description:'Discarded result'});
    await work;
    const stored=(await query('SELECT document,deleted_at FROM smartphone_editor_drafts WHERE id=$1',[row.draft_id])).rows[0];
    expect(stored.deleted_at).not.toBeNull();expect(stored.document.shared.title).not.toBe('Must not resurrect deleted draft');
    expect((await query('SELECT status FROM telegram_product_jobs WHERE session_id=$1',[row.id])).rows[0].status).toBe('cancelled');
  });
  it('makes audit events immutable', async () => {
    await expect(
      query("UPDATE telegram_product_events SET actor='changed'"),
    ).rejects.toThrow('immutable');
  });
  it('runs research durably and exposes quota failures without losing staff input', async () => {
    await member('6001');
    let view = await request('6001', 'new');
    for (const action of ['choose:smartphones', 'choose:Apple'])
      view = await request('6001', action, {
        sessionId: view.sessionId,
        revision: view.revision,
      });
    view = await request('6001', 'text', {
      text: 'iPhone Fixture',
      sessionId: view.sessionId,
      revision: view.revision,
    });
    view = await request('6001', 'choose:new', {
      sessionId: view.sessionId,
      revision: view.revision,
    });
    expect(view.pending).toBe(true);
    provider.research.mockRejectedValueOnce(new Error('research_rate_limited'));
    await runTelegramProductWorkerPass();
    let current = await request('6001', 'status', {
      sessionId: view.sessionId,
    });
    expect(current.text).toContain('research_rate_limited');
    provider.research.mockResolvedValueOnce({
      title: 'Apple iPhone Fixture',
      brand: 'Apple',
      model: 'iPhone Fixture',
      category: 'smartphones',
      description: 'Synthetic description',
      variantSuggestions: [{ color: 'Black', storage: '256 GB' }],
      researchSources: [
        {
          url: 'https://www.apple.com/fixture',
          title: 'Official fixture',
          retrievedAt: '2026-10-16',
        },
      ],
    });
    await request('6001', 'retry', {
      sessionId: current.sessionId,
      revision: current.revision,
    });
    await runTelegramProductWorkerPass();
    current = await request('6001', 'status', { sessionId: view.sessionId });
    expect(current.buttons.flat().some(button=>button.action==='variant:0')).toBe(true);
    const row = await withTransaction((client) =>
      readSession(client, current.sessionId!),
    );
    expect(row.document.entries[0].price).toBe(0);
    expect(row.state.sources).toHaveLength(1);
    expect(
      (await query('SELECT count(*)::int AS n FROM products')).rows[0].n,
    ).toBe(1);
  });
  it('keeps raw photos private, allows originals after image-provider failure, and rejects box-only evidence', async () => {
    await member('7001');
    let view = await request('7001', 'new');
    let row = await withTransaction((client) =>
      readSession(client, view.sessionId!),
    );
    row.state.stage = 'photos';
    row.state.photoKind = 'box';
    await query('UPDATE telegram_product_sessions SET state=$2 WHERE id=$1', [
      row.id,
      JSON.stringify(row.state),
    ]);
    const bytes = await sharp({
      create: { width: 80, height: 100, channels: 3, background: '#998877' },
    })
      .png()
      .toBuffer();
    provider.privacy.mockImplementation(async (input: Buffer) => ({
      bytes: await sharp(input).webp().toBuffer(),
      hints: {},
    }));
    provider.studio.mockRejectedValueOnce(new Error('research_rate_limited'));
    await ingestPhoto({
      telegramId: '7001',
      sessionId: row.id,
      revision: row.revision,
      updateId: 70000,
      data: bytes.toString('base64'),
    });
    expect(await readdir(process.env.UPLOADS_DIR!).catch(() => [])).toEqual([]);
    await runTelegramProductWorkerPass();
    view = await request('7001', 'status', { sessionId: row.id });
    const asset = (
      await query(
        'SELECT id FROM telegram_product_assets WHERE session_id=$1',
        [row.id],
      )
    ).rows[0];
    expect(
      view.buttons.flat().some((b) => b.action === `assetOriginal:${asset.id}`),
    ).toBe(true);
    expect(
      view.buttons.flat().some((b) => b.action === `assetUse:${asset.id}`),
    ).toBe(false);
    await request('7001', `assetOriginal:${asset.id}`, {
      sessionId: row.id,
      revision: view.revision,
    });
    row = await withTransaction((client) => readSession(client, row.id));
    expect(
      row.document.entries[0].photos.some((p) => p.url.startsWith('/uploads/')),
    ).toBe(true);
    expect(row.document.entries[0].hasRealProductPhotos).toBe(false);
    expect(
      (
        await query(
          'SELECT private_path FROM telegram_product_assets WHERE id=$1',
          [asset.id],
        )
      ).rows[0].private_path,
    ).toContain(fileRoot);
  });
  it('updates an explicitly chosen existing offer without replacing its content or images', async () => {
    const product = (
      await query('SELECT * FROM products ORDER BY created_at LIMIT 1')
    ).rows[0];
    await member('8001');
    let view = await request('8001', 'new_update');
    let row = await withTransaction((client) =>
      readSession(client, view.sessionId!),
    );
    row.document.shared = {
      brand: product.brand,
      model: product.model,
      category: product.category,
      title: product.title,
    };
    row.state.stage = 'versions';
    await query('UPDATE smartphone_editor_drafts SET document=$2 WHERE id=$1', [
      row.draft_id,
      JSON.stringify(row.document),
    ]);
    await query('UPDATE telegram_product_sessions SET state=$2 WHERE id=$1', [
      row.id,
      JSON.stringify(row.state),
    ]);
    view = await request('8001', 'status', { sessionId: row.id });
    expect(
      view.buttons.flat().some((b) => b.action === `existing:${product.id}`),
    ).toBe(true);
    view = await request('8001', `existing:${product.id}`, {
      sessionId: row.id,
      revision: view.revision,
    });
    for (const text of ['26', '2'])
      view = await request('8001', 'text', {
        text,
        sessionId: row.id,
        revision: view.revision,
      });
    view = await request('8001', 'submit', {
      sessionId: row.id,
      revision: view.revision,
    });
    row = await withTransaction((client) => readSession(client, row.id));
    await publishPhoneDraft(
      row.draft_id,
      {
        revision: row.draft_revision,
        requestId: randomUUID(),
        entryIds: [row.document.entries[0].id],
      },
      'owner',
      true,
      true,
    );
    const after = (
      await query(
        'SELECT title,description,images,price,stock FROM products WHERE id=$1',
        [product.id],
      )
    ).rows[0];
    expect(after.title).toBe(product.title);
    expect(after.description).toBe(product.description);
    expect(after.images).toEqual(product.images);
    expect(Number(after.price)).toBe(26);
    expect(after.stock).toBe(2);
  });
  it('keeps Wi-Fi and Cellular versions distinct in matching and storefront configuration', async () => {
    await member('9001');
    const view = await request('9001', 'new');
    const row = await withTransaction((client) =>
      readSession(client, view.sessionId!),
    );
    row.document.shared = {
      title: 'Tablet fixture',
      brand: 'Apple',
      model: `Tablet ${randomUUID()}`,
      category: 'tablets',
      description: 'Synthetic tablet for configuration testing.',
    };
    const first = row.document.entries[0];
    Object.assign(first, {
      color: 'Black',
      storage: '256 GB',
      price: 599,
      stock: 1,
      configuration: { connectivity: 'Wi-Fi' },
      hasRealProductPhotos: true,
    });
    first.details.identifierStatus = 'not_applicable';
    first.photos[0].url = 'https://example.invalid/tablet-wifi.webp';
    const second = structuredClone(first);
    second.id = randomUUID();
    second.sku = `AP-${randomUUID()}`;
    second.configuration = { connectivity: 'Cellular' };
    second.photos = second.photos.map((p) => ({ ...p, id: randomUUID() }));
    second.coverId = second.photos[0].id;
    row.document.entries.push(second);
    await query('UPDATE smartphone_editor_drafts SET document=$2 WHERE id=$1', [
      row.draft_id,
      JSON.stringify(row.document),
    ]);
    await query(
      "UPDATE telegram_product_sessions SET status='submitted' WHERE id=$1",
      [row.id],
    );
    const published = await publishPhoneDraft(
      row.draft_id,
      {
        revision: 1,
        requestId: randomUUID(),
        entryIds: row.document.entries.map((e) => e.id),
      },
      'owner',
      true,
      true,
    );
    expect(published.results).toHaveLength(2);
    const family = (
      await query(
        'SELECT f.option_axes,m.option_values FROM product_families f JOIN product_family_members m ON m.family_id=f.id WHERE m.product_id=ANY($1::uuid[])',
        [published.results.map((r) => r.productId)],
      )
    ).rows;
    expect(family[0].option_axes).toContain('configuration');
    expect(new Set(family.map((f) => f.option_values.configuration)).size).toBe(
      2,
    );
  });
  it('drops an in-flight AI result after membership revocation', async () => {
    await member('10001');
    let view = await request('10001', 'new');
    for (const action of ['choose:smartphones', 'choose:Apple'])
      view = await request('10001', action, {
        sessionId: view.sessionId,
        revision: view.revision,
      });
    view = await request('10001', 'text', {
      text: 'Uncached revoked fixture',
      sessionId: view.sessionId,
      revision: view.revision,
    });
    view = await request('10001', 'choose:new', {
      sessionId: view.sessionId,
      revision: view.revision,
    });
    let finish: (value: unknown) => void = () => {};
    let started: () => void = () => {};
    const began = new Promise<void>((resolve) => {
      started = resolve;
    });
    provider.research.mockImplementationOnce(() => {
      started();
      return new Promise((resolve) => {
        finish = resolve;
      });
    });
    const work = runTelegramProductWorkerPass();
    await began;
    await query(
      "UPDATE telegram_product_members SET status='revoked' WHERE telegram_id=10001",
    );
    finish({
      title: 'Must not apply',
      brand: 'Apple',
      model: 'Uncached revoked fixture',
      description: 'Blocked result',
    });
    await work;
    const row = await withTransaction((client) =>
      readSession(client, view.sessionId!),
    );
    expect(row.document.shared.title).not.toBe('Must not apply');
    await expect(
      request('10001', 'status', { sessionId: row.id }),
    ).rejects.toThrow('membership_required');
  });  it('completes guided iPhone intake with six individually approved sides, preview and targeted edits', async () => {
    await member('12001');
    let view=await request('12001','new');
    const act=async(action:string,text?:string)=>{view=await request('12001',action,{text,sessionId:view.sessionId,revision:view.revision});return view};
    await act('choose:smartphones');await act('choose:Apple');await act('text','iPhone Guided Fixture');await act('choose:used');
    expect(view.pending).toBe(true);expect(view.text).toContain('⏳');
    provider.research.mockResolvedValueOnce({title:'Apple iPhone Guided Fixture',brand:'Apple',model:'iPhone Guided Fixture',category:'smartphones',description:'Verified synthetic description',variantSuggestions:[{color:'Black',storage:'256 GB'}],researchSources:[]});
    await runTelegramProductWorkerPass();view=await request('12001','status',{sessionId:view.sessionId});
    expect(view.buttons.flat().some(button=>button.action.startsWith('existing:'))).toBe(false);
    await act('variant:0');expect(view.text).toContain('quantity');
    expect(view.buttons.flat().some(button=>button.action.startsWith('setCondition:'))).toBe(false);
    await act('choose:1');await act('text','599');await act('text','93');await act('defectNone');await act('accessory:usb_c');await act('accessoryDone');
    provider.privacy.mockImplementation(async(input:Buffer)=>({bytes:await sharp(input).webp().toBuffer(),hints:{}}));provider.studio.mockImplementation(async(input:Buffer)=>input);
    for(let side=0;side<6;side++){
      expect(view.text).toContain(`${side+1}/6`);
      const bytes=await sharp({create:{width:120,height:160,channels:3,background:{r:80+side*10,g:120,b:150}}}).png().toBuffer();
      await ingestPhoto({telegramId:'12001',sessionId:view.sessionId!,revision:view.revision,updateId:120000+side*2,data:bytes.toString('base64')});
      const pending=await request('12001','status',{sessionId:view.sessionId});
      await expect(ingestPhoto({telegramId:'12001',sessionId:view.sessionId!,revision:pending.revision,updateId:120001+side*2,data:bytes.toString('base64')})).rejects.toThrow('photo_wait_for_review');
      await runTelegramProductWorkerPass();view=await request('12001','status',{sessionId:view.sessionId});
      expect(view.photos).toHaveLength(1);await act('assetOriginal:'+view.photos![0].id);
    }
    expect(view.text).toContain('Draft preview');expect(view.text).toContain('93%');expect(view.text).toContain('USB-C cable');expect(view.gallery).toHaveLength(6);
    let row=await withTransaction(client=>readSession(client,view.sessionId!));
    expect(row.state.stage).toBe('review');expect(row.state.photoAngles?.[row.state.entryId]).toHaveLength(6);expect(row.document.entries[0].photos.filter(photo=>photo.url)).toHaveLength(6);
    await act('editMenu');expect(view.buttons.flat().some(button=>button.text==='4. Product photos')).toBe(true);
    await act('edit:versions');await act('entry:'+row.state.entryId);await act('field:price');await act('text','579');
    expect(view.text).toContain('€579.00');expect(view.text).toContain('Draft preview');
    await act('submit');row=await withTransaction(client=>readSession(client,view.sessionId!));expect(row.status).toBe('submitted');
  });

});
