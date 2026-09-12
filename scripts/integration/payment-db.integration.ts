import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { beforeAll, beforeEach, afterEach, afterAll, describe, expect, it, vi } from 'vitest';

// Catalog fetching is out of scope: validated carts below are synthetic.
// Neither the DB adapter, checkout transitions nor inventory adapter is mocked.
vi.mock('../../src/lib/products', () => ({ getProducts: vi.fn(() => { throw new Error('Catalog access forbidden'); }) }));

const safeUrl = new URL(process.env.DATABASE_URL || 'postgresql://invalid/invalid');
if (process.env.APFEL_AUDIT_DISPOSABLE !== 'apfel_audit_wave2' ||
    safeUrl.hostname !== '127.0.0.1' || safeUrl.pathname !== '/apfel_audit_wave2' ||
    safeUrl.username !== 'apfel_audit_wave2') {
  throw new Error('Only the disposable audit database is allowed');
}

const { query } = await import('../../src/lib/db');
const { createPendingOrder, markOrderCancelled, markOrderPaid } = await import('../../src/lib/checkout');
const { expireStripeCheckoutSessionForAdmin } = await import('../../src/lib/stripe-checkout-admin');
const forbiddenFetch = vi.fn(() => { throw new Error('External network forbidden'); });

const migration = readFileSync('supabase/migrations/20260818_live_omnichannel_inventory.sql', 'utf8');
const foundation = readFileSync('supabase/migrations/20260712_marketplace_foundation.sql', 'utf8');
const sourceFunction = (name: string) => {
  const match = migration.match(new RegExp(`create or replace function public\\.${name}\\([\\s\\S]*?\\$\\$;`, 'i'));
  if (!match) throw new Error(`Missing production SQL function ${name}`);
  return match[0];
};
const sourceTable = (name: string) => {
  const match = foundation.match(new RegExp(`create table if not exists public\\.${name} \\([\\s\\S]*?\\n\\);`, 'i'));
  if (!match) throw new Error(`Missing production SQL table ${name}`);
  return match[0].replaceAll('uuid_generate_v4()', 'gen_random_uuid()');
};
const fixture = (sku = 'AUDIT-ONLY', quantity = 1, idempotencyKey = randomUUID()) => ({
  provider: 'stripe' as const, locale: 'de' as const, idempotencyKey,
  customer: { name: 'Synthetic Audit', email: 'audit@example.invalid' },
  cart: {
    items: [{ key: sku, productId: '00000000-0000-4000-8000-000000000001', slug: 'audit-only',
      title: 'Synthetic only', image: '', sku, category: 'test', quantity,
      unitAmount: 10, unitAmountCents: 1000, lineAmount: quantity * 10,
      lineAmountCents: quantity * 1000, condition: 'new' }],
    currency: 'EUR', subtotalAmount: quantity * 10, subtotalAmountCents: quantity * 1000,
    shippingAmount: 0, shippingAmountCents: 0, totalAmount: quantity * 10,
    totalAmountCents: quantity * 1000, vatRate: 0.19, vatAmount: 1.6, vatAmountCents: 160,
    shippingMethod: 'pickup' as const,
  },
});
const state = async () => (await query('SELECT on_hand,reserved FROM inventory_skus ORDER BY sku')).rows;
const events = async () => (await query('SELECT event_type,count(*)::int AS count FROM inventory_adjustments GROUP BY event_type ORDER BY event_type')).rows;
const snapshot = async (id: string) => (await query('SELECT *,updated_at::text AS token FROM orders WHERE id=$1', [id])).rows[0];
const cancelInput = (row: Awaited<ReturnType<typeof snapshot>>) => ({
  orderId: row.id, provider: 'stripe' as const, providerStatus: 'expired',
  expectedStatus: row.status, expectedPaymentStatus: row.payment_status,
  expectedProviderStatus: row.provider_status, expectedProviderOrderId: row.provider_order_id,
  expectedProviderSessionId: row.provider_session_id, expectedUpdatedAt: row.token,
});

beforeAll(async () => {
  vi.stubGlobal('fetch', forbiddenFetch);
  expect((await query('SELECT current_database() AS db,current_user AS role')).rows[0]).toEqual({ db: 'apfel_audit_wave2', role: 'apfel_audit_wave2' });
  await query(`
    CREATE TABLE products(id uuid PRIMARY KEY,sku text,stock integer,variants jsonb DEFAULT '[]',created_at timestamptz DEFAULT now());
    CREATE TABLE orders(
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),order_number serial,customer_email text,customer_name text,customer_phone text,
      total_amount numeric,subtotal_amount numeric,shipping_amount numeric,vat_rate numeric,vat_amount numeric,currency text,
      coupon_code text,discount_amount numeric,status text,payment_status text,shipping_method text,customer_address jsonb,
      items jsonb,provider text,idempotency_key text UNIQUE,checkout_locale text,consent_mode text,metadata jsonb,
      provider_order_id text,provider_session_id text,provider_payment_id text,provider_status text,
      created_at timestamptz,updated_at timestamptz,paid_at timestamptz,cancelled_at timestamptz);
    CREATE TABLE campaign_redemptions(id uuid DEFAULT gen_random_uuid(),campaign_id uuid,order_id uuid,released_at timestamptz);
    CREATE TABLE store_campaigns(id uuid PRIMARY KEY,redemption_count integer,updated_at timestamptz);
  `);
  await query(sourceTable('inventory_skus'));
  await query(sourceTable('inventory_adjustments'));
  await query('ALTER TABLE inventory_skus ADD COLUMN version bigint NOT NULL DEFAULT 1, ADD COLUMN is_active boolean NOT NULL DEFAULT true');
  for (const name of ['inventory_adjustments_reservation_once_idx', 'inventory_adjustments_terminal_once_idx']) {
    const match = migration.match(new RegExp(`create unique index if not exists ${name}[\\s\\S]*?;`, 'i'));
    if (!match) throw new Error(`Missing production index ${name}`);
    await query(match[0]);
  }
  for (const name of ['available_inventory', 'reserve_inventory_batch', 'release_inventory_reservation']) await query(sourceFunction(name));
});
beforeEach(async () => {
  await query('TRUNCATE inventory_adjustments,inventory_skus,products,orders,campaign_redemptions,store_campaigns CASCADE');
  await query("INSERT INTO products(id,sku,stock) VALUES('00000000-0000-4000-8000-000000000001','AUDIT-ONLY',1)");
  forbiddenFetch.mockClear();
});
afterEach(() => { expect(forbiddenFetch).not.toHaveBeenCalled(); });
afterAll(() => { vi.unstubAllGlobals(); });

describe('real checkout / PostgreSQL with synthetic fixtures and mocked provider transport', () => {
  it('concurrent duplicate cancellation releases exactly once after mocked remote expiry', async () => {
    const order = await createPendingOrder(fixture());
    expect(await state()).toEqual([{ on_hand: 1, reserved: 1 }]);
    const row = await snapshot(order.id);
    const transport = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json({ status: 'open', payment_status: 'unpaid' }))
      .mockResolvedValueOnce(Response.json({ status: 'expired', payment_status: 'unpaid' }));
    const remote = await expireStripeCheckoutSessionForAdmin({ sessionId: 'cs_audit_mock', orderId: order.id, secretKey: 'synthetic-not-a-credential', fetchImpl: transport });
    expect(remote.outcome).toBe('expired');
    expect(transport).toHaveBeenCalledTimes(2);
    const results = await Promise.all([markOrderCancelled(cancelInput(row)), markOrderCancelled(cancelInput(row))]);
    expect(results.filter(Boolean)).toEqual([order.id]);
    expect(await markOrderCancelled(cancelInput(row))).toBeNull();
    expect(await state()).toEqual([{ on_hand: 1, reserved: 0 }]);
    expect(await events()).toEqual([{ event_type: 'release', count: 1 }, { event_type: 'reservation', count: 1 }]);
    expect(await snapshot(order.id)).toMatchObject({ status: 'cancelled', payment_status: 'failed' });
  });

  it('rejects stale microsecond timestamp without releasing stock; exact fresh token succeeds', async () => {
    const order = await createPendingOrder(fixture());
    await query("UPDATE orders SET updated_at='2026-09-04 12:00:00.123456+00' WHERE id=$1", [order.id]);
    const row = await snapshot(order.id);
    expect(row.token).toContain('.123456');
    expect(await markOrderCancelled({ ...cancelInput(row), expectedUpdatedAt: '2026-09-04T12:00:00.123Z' })).toBeNull();
    expect(await state()).toEqual([{ on_hand: 1, reserved: 1 }]);
    expect(await markOrderCancelled(cancelInput(row))).toBe(order.id);
    expect(await state()).toEqual([{ on_hand: 1, reserved: 0 }]);
  });

  it('paid state wins over stale cancellation; duplicate payment settles stock once', async () => {
    const order = await createPendingOrder(fixture());
    const old = await snapshot(order.id);
    const paid = { orderId: order.id, provider: 'stripe' as const, providerPaymentId: 'pi_audit_mock' };
    const results = await Promise.all([markOrderPaid(paid), markOrderPaid(paid)]);
    expect(results.filter(Boolean)).toHaveLength(1);
    expect(await markOrderCancelled(cancelInput(old))).toBeNull();
    expect(await markOrderCancelled({ orderId: order.id, provider: 'stripe' })).toBeNull();
    expect(await snapshot(order.id)).toMatchObject({ status: 'paid', payment_status: 'paid' });
    expect(await state()).toEqual([{ on_hand: 0, reserved: 0 }]);
    expect(await events()).toEqual([{ event_type: 'reservation', count: 1 }, { event_type: 'sale', count: 1 }]);
  });

  it('mocked provider completion protects reservation instead of expiring remote payment', async () => {
    const order = await createPendingOrder(fixture());
    const transport = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ status: 'complete', payment_status: 'paid' }));
    const remote = await expireStripeCheckoutSessionForAdmin({ sessionId: 'cs_audit_mock', orderId: order.id, secretKey: 'synthetic-not-a-credential', fetchImpl: transport });
    expect(remote.outcome).toBe('protected');
    expect(transport).toHaveBeenCalledTimes(1);
    expect(await state()).toEqual([{ on_hand: 1, reserved: 1 }]);
    expect(await snapshot(order.id)).toMatchObject({ status: 'pending', payment_status: 'unpaid' });
  });

  it('concurrent last-unit buyers cannot both reserve; failed order rolls back', async () => {
    const results = await Promise.allSettled([createPendingOrder(fixture()), createPendingOrder(fixture())]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((r) => r.status === 'rejected')).toHaveLength(1);
    expect((await query('SELECT count(*)::int AS count FROM orders')).rows[0].count).toBe(1);
    expect(await state()).toEqual([{ on_hand: 1, reserved: 1 }]);
    expect(await events()).toEqual([{ event_type: 'reservation', count: 1 }]);
  });

  it('same validated request retries against its own last-unit reservation exactly once', async () => {
    const request = fixture();
    const first = await createPendingOrder(request);
    const second = await createPendingOrder(request);
    expect(second.id).toBe(first.id);
    expect(await events()).toEqual([{ event_type: 'reservation', count: 1 }]);
    expect(await state()).toEqual([{ on_hand: 1, reserved: 1 }]);
  });

  it('missing second SKU rolls back order and first-SKU inventory initialization', async () => {
    const request = fixture();
    request.cart.items.push({ ...request.cart.items[0], key: 'MISSING', sku: 'MISSING' });
    await expect(createPendingOrder(request)).rejects.toThrow('Insufficient available stock');
    expect((await query('SELECT count(*)::int AS count FROM orders')).rows[0].count).toBe(0);
    expect(await state()).toEqual([]);
    expect(await events()).toEqual([]);
  });
});
