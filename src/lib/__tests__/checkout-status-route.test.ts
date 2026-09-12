import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock('@/lib/db', () => mocks);
import { GET } from '@/app/api/checkout/status/route';
import { createCheckoutReturnToken } from '../checkout-return-token';
import { createCheckoutReturnSession } from '../checkout-return-session';

const secret = 'checkout-status-test-secret-with-more-than-32-characters';
const orderId = '11111111-1111-4111-8111-111111111111';
const otherOrder = '22222222-2222-4222-8222-222222222222';
const cookie = (id = orderId, issuedAt?: number) => createCheckoutReturnSession(id,
  createCheckoutReturnToken(id, { secret, nowSeconds: issuedAt, ttlSeconds: 600 }));
const request = (session: string | null = cookie(), expected: string | null = orderId) => {
  const headers: Record<string, string> = {};
  if (session !== null) headers.Cookie = `apfel-checkout-return=${session}`;
  if (expected !== null) headers['X-Checkout-Order'] = expected;
  return new NextRequest('https://apfel-park.de/api/checkout/status', { headers });
};

beforeEach(() => {
  vi.stubEnv('CHECKOUT_RETURN_SECRET', secret);
  mocks.query.mockReset().mockResolvedValue({ rows: [{ payment_status: 'unpaid', status: 'pending' }] });
});
afterEach(() => vi.unstubAllEnvs());

describe('session-bound read-only checkout status', () => {
  it.each([
    ['missing cookie', null, orderId],
    ['malformed cookie', 'bad', orderId],
    ['missing expected order', 'valid', null],
    ['a newer checkout in another tab', 'valid', otherOrder],
  ])('rejects %s before any database access', async (_name, session, expected) => {
    const response = await GET(request(session === 'valid' ? cookie() : session, expected));
    expect(response.status).toBe(401);
    expect(response.headers.get('cache-control')).toContain('no-store');
    expect(mocks.query).not.toHaveBeenCalled();
  });
  it('rejects an expired or order-tampered signed capability', async () => {
    const expired = cookie(orderId, Math.floor(Date.now() / 1000) - 1000);
    expect((await GET(request(expired))).status).toBe(401);
    const token = createCheckoutReturnToken(orderId, { secret });
    expect((await GET(request(createCheckoutReturnSession(otherOrder, token), otherOrder))).status).toBe(401);
    expect(mocks.query).not.toHaveBeenCalled();
  });
  it.each([
    ['unpaid', 'pending', 'pending'],
    ['paid', 'paid', 'paid'],
    ['paid', 'shipped', 'paid'],
    ['paid', 'cancelled', 'cancelled'],
    ['failed', 'pending', 'failed'],
    ['refunded', 'paid', 'refunded'],
    ['partially_refunded', 'paid', 'refunded'],
    ['unknown', 'pending', 'pending'],
  ])('maps %s/%s to %s without exposing order data', async (payment_status, status, state) => {
    mocks.query.mockResolvedValueOnce({ rows: [{ payment_status, status, customer_email: 'private@example.test', token: 'private' }] });
    const response = await GET(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, state });
    expect(response.headers.get('cache-control')).toBe('private, no-store, max-age=0');
    expect(response.headers.get('vary')).toContain('Cookie');
    expect(mocks.query).toHaveBeenCalledExactlyOnceWith('SELECT payment_status, status FROM orders WHERE id = $1 LIMIT 1', [orderId]);
  });
  it('returns a non-cacheable 404 for a removed order', async () => {
    mocks.query.mockResolvedValueOnce({ rows: [] });
    expect((await GET(request())).status).toBe(404);
  });
  it('returns a retryable failure without leaking database errors', async () => {
    mocks.query.mockRejectedValueOnce(new Error('private database details'));
    const response = await GET(request());
    expect(response.status).toBe(503);
    expect(response.headers.get('retry-after')).toBe('3');
    expect(response.headers.get('cache-control')).toContain('no-store');
    expect(JSON.stringify(await response.json())).not.toContain('private database');
  });
});
