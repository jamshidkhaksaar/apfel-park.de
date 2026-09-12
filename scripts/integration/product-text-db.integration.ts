import pg from 'pg';
import { randomUUID } from 'node:crypto';
import { beforeAll, beforeEach, afterAll, afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import type { TransactionClient } from '../../src/lib/db';

const safeUrl = new URL(process.env.DATABASE_URL || 'postgresql://invalid/invalid');
if (process.env.APFEL_AUDIT_DISPOSABLE !== 'apfel_text_write_test' || safeUrl.hostname !== '127.0.0.1'
    || safeUrl.pathname !== '/apfel_text_write_test' || safeUrl.username !== 'apfel_text_write_test') {
  throw new Error('Only the runner-owned disposable product-text database is allowed');
}
const auth = vi.hoisted(() => ({ allowed: true }));
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
const externalFetch = vi.fn(() => { throw new Error('External network forbidden'); });

// Execute the actual product writer SQL in PostgreSQL. Inventory and marketing
// are explicitly out of scope here and never contact production or providers.
const execute = async (sql: string, params?: unknown[]) => {
  if (/inventory_skus/i.test(sql)) return { rows: [], rowCount: /^\s*SELECT/i.test(sql) ? 0 : 1 };
  if (/\bproducts\b/i.test(sql) || /^\s*(BEGIN|COMMIT|ROLLBACK)\b/.test(sql)) return client.query(sql, params);
  throw new Error(`Unexpected SQL in scoped fixture: ${sql.slice(0, 90)}`);
};
vi.mock('../../src/lib/db', () => ({ query: (sql: string, params?: unknown[]) => execute(sql, params), withTransaction: vi.fn() }));
vi.mock('../../src/lib/admin-auth-server', () => ({ createAdminServerClient: async () => ({ auth: { getUser: async () => ({ data: { user: auth.allowed ? { id: 'synthetic-admin' } : null } }) } }) }));
vi.mock('../../src/lib/admin-auth', () => ({ canManageProducts: () => auth.allowed }));
vi.mock('../../src/lib/product-intake/stale-runs', () => ({ markOpenIntakeRunsStale: vi.fn() }));
vi.mock('../../src/lib/marketing', () => ({ autoPublishProductPromotion: () => { throw new Error('Marketing publication forbidden'); } }));
vi.mock('../../src/lib/admin-db', () => ({
  createAdminDbClient: () => ({
    from: (table: string) => {
      let id: string;
      const chain = {
        select: () => chain,
        eq: (_key: string, value: string) => { id = value; return chain; },
        maybeSingle: async () => table === 'products'
          ? { data: (await client.query('SELECT * FROM products WHERE id=$1', [id])).rows[0] ?? null, error: null }
          : { data: { value: [] }, error: null },
        upsert: async () => ({ error: null }),
      };
      return chain;
    },
  }),
}));

const { POST, PATCH } = await import('../../src/app/api/admin/products/route');
const { writeProduct } = await import('../../src/lib/smartphone-editor/repository');
const { merchantDescriptionHash, knownAiTextFields } = await import('../../src/lib/product-text-provenance');
const { mapAdminProduct } = await import('../../src/lib/admin-product-data');
const { productToForm } = await import('../../src/lib/admin-product-form');
const { buildGoogleMerchantFeedForProducts } = await import('../../src/lib/google-merchant');

const body = (extra: Record<string, unknown> = {}) => ({
  title: 'Synthetic USB accessory', description: 'Synthetic product description for review.',
  subtitle: 'Synthetic subtitle', category: 'accessories', condition: 'new', brand: 'Test', model: 'Fixture',
  sku: `TEST-${randomUUID()}`, price: 25, stock: 3, images: ['/synthetic.webp'],
  variants: [], featureBullets: ['Synthetic feature'], specs: [{ label: 'Type', value: 'Fixture' }],
  mpn: 'TEST-MPN', identifierStatus: 'assigned' as const, isActive: false, ...extra,
});
const request = (method: string, value: unknown, origin = 'https://apfel-park.de') => new NextRequest('https://apfel-park.de/api/admin/products', {
  method, headers: { 'Content-Type': 'application/json', Origin: origin }, body: JSON.stringify(value),
});
const row = async (id: string) => (await client.query('SELECT * FROM products WHERE id=$1', [id])).rows[0];
const create = async (value: ReturnType<typeof body>) => {
  const response = await POST(request('POST', value));
  const result = await response.json();
  expect(response.status, JSON.stringify(result)).toBe(200);
  return String(result.id);
};

beforeAll(async () => {
  await client.connect();
  expect((await client.query('SELECT current_database() AS db,current_user AS role')).rows[0]).toEqual({ db: 'apfel_text_write_test', role: 'apfel_text_write_test' });
  const groups: [string[], string][] = [
    [['title','subtitle','description','category','brand','model','sku','slug','condition','condition_note','subcategory','mpn','gtin','eprel_id','asin','ebay_epid','identifier_status','country_of_origin'], 'text'],
    [['price','compare_at_price','package_weight_kg','package_length_cm','package_width_cm','package_height_cm','charging_power_min_w','charging_power_max_w'], 'numeric'],
    [['stock','battery_health'], 'integer'],
    [['is_active','has_real_product_photos','charger_included','usb_pd_supported','amazon_gtin_exemption','amazon_renewed_approved','catalog_enabled'], 'boolean'],
    [['images','feature_bullets','safety_warnings','safety_documents'], 'text[]'],
    [['variants','specs','manufacturer','eu_responsible_person','energy_label','faq','battery_details','marketplace_category_mappings','marketplace_attributes','import_metadata','title_i18n','subtitle_i18n','description_i18n','feature_bullets_i18n','specs_i18n'], "jsonb DEFAULT '{}'::jsonb"],
  ];
  await client.query(`CREATE TABLE products(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),created_at timestamptz DEFAULT now(),updated_at timestamptz DEFAULT now(),${groups.flatMap(([names,type]) => names.map(name => `${name} ${type}`)).join(',')})`);
  vi.stubGlobal('fetch', externalFetch);
});
beforeEach(async () => { auth.allowed = true; externalFetch.mockClear(); await client.query('TRUNCATE products'); });
afterEach(() => { expect(externalFetch).not.toHaveBeenCalled(); });
afterAll(async () => { vi.unstubAllGlobals(); await client.end(); });

describe('actual product SQL and reviewed AI text', () => {
  it('creates an inactive product with final reviewed text, source markers and a valid feed representation', async () => {
    const input = body({ aiGeneratedFields: ['title','description'] });
    const id = await create(input);
    const saved = await row(id);
    expect(saved.is_active).toBe(false);
    expect(knownAiTextFields(saved.import_metadata, saved)).toEqual(['title','description']);
    const admin = mapAdminProduct(saved);
    expect(productToForm(admin).aiGeneratedFields).toEqual(['title','description']);
    const xml = buildGoogleMerchantFeedForProducts([{
      id, title: admin.title, subtitle: admin.subtitle, description: admin.description,
      category: 'accessories', condition: 'new', isOpenBox: false, hasRealProductPhotos: false,
      image: input.images[0], images: admin.images, hasDiscount: false, identifierStatus: 'assigned',
      sku: admin.sku, mpn: admin.mpn, price: admin.price, stock: admin.stock, brand: admin.brand,
      slug: admin.slug, variants: [], specs: [], featureBullets: admin.featureBullets, faq: [],
      descriptionAiHashes: saved.import_metadata.contentProvenance.descriptionAiHashes,
      titleAiHashes: saved.import_metadata.contentProvenance.titleAiHashes,
    }]);
    expect(xml).toContain('<g:structured_title>');
    expect(xml).toContain('<g:structured_description>');
    expect(xml).not.toContain('<g:description>');
  });
  it('keeps translations on an unrelated save and invalidates only changed fields with AI lineage retained', async () => {
    const input = body({ aiGeneratedFields: ['description'] });
    const id = await create(input);
    await client.query(`UPDATE products SET title_i18n=$2,description_i18n=$3,subtitle_i18n=$4,
      import_metadata=import_metadata || '{"smartphoneEditor":{"googleSelected":false},"conditionNoteI18n":{"de":"Keep"},"other":"preserved"}'::jsonb WHERE id=$1`,
      [id, { de: input.title, en: 'Translated title' }, { de: input.description, en: 'Translated description' }, { en: 'Translated subtitle' }]);
    const before = await row(id);
    expect((await PATCH(request('PATCH', { ...input, id, aiGeneratedFields: undefined }))).status).toBe(200);
    expect((await row(id)).description_i18n).toEqual(before.description_i18n);
    const edited = { ...input, id, description: 'Staff edited the AI-assisted description.', aiGeneratedFields: undefined };
    expect((await PATCH(request('PATCH', edited))).status).toBe(200);
    const after = await row(id);
    expect(after.description_i18n).toEqual({});
    expect(after.title_i18n).toEqual(before.title_i18n);
    expect(after.subtitle_i18n).toEqual(before.subtitle_i18n);
    expect(after.import_metadata).toMatchObject({ smartphoneEditor: { googleSelected: false }, other: 'preserved', conditionNoteI18n: { de: 'Keep' } });
    expect(knownAiTextFields(after.import_metadata, after)).toEqual(['description']);
    expect(after.import_metadata.contentProvenance.descriptionAiHashes).toContain(merchantDescriptionHash(input.description));
    expect(after.slug).toBe(before.slug);
  });
  it('does not label manual titles or descriptions as AI merely because metadata exists', async () => {
    const input = body();
    const id = await create(input);
    expect((await PATCH(request('PATCH', { ...input, id, title: 'Manual replacement' }))).status).toBe(200);
    const saved = await row(id);
    expect(knownAiTextFields(saved.import_metadata, saved)).toEqual([]);
  });
  it('uses the same provenance contract for smartphone insert and update SQL', async () => {
    const id = randomUUID();
    const input = body({ category: 'smartphones', aiGeneratedFields: ['title','description'] });
    const facade = { query: execute } as TransactionClient;
    await writeProduct(facade, id, input, false);
    const before = await row(id);
    expect(knownAiTextFields(before.import_metadata, before)).toEqual(['title','description']);
    await client.query(`UPDATE products SET description_i18n='{"en":"Old translation"}', import_metadata=import_metadata || '{"smartphoneEditor":{"googleSelected":false},"other":"preserved"}'::jsonb WHERE id=$1`, [id]);
    await writeProduct(facade, id, { ...input, description: 'Reviewed smartphone copy edited again.', aiGeneratedFields: undefined }, true);
    const after = await row(id);
    expect(after.description_i18n).toEqual({});
    expect(after.import_metadata.other).toBe('preserved');
    expect(after.import_metadata.smartphoneEditor.googleSelected).toBe(false);
    expect(knownAiTextFields(after.import_metadata, after)).toEqual(['title','description']);
    expect(after.slug).toBe(before.slug);
  });
  it('does not let provenance flags bypass authorization or CSRF', async () => {
    auth.allowed = false;
    expect((await POST(request('POST', body({ aiGeneratedFields: ['title','description'] })))).status).toBe(401);
    auth.allowed = true;
    expect((await POST(request('POST', body(), 'https://untrusted.example'))).status).toBe(403);
    expect((await client.query('SELECT count(*)::int AS count FROM products')).rows[0].count).toBe(0);
  });
});
