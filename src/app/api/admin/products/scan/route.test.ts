import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  lookupScannedProduct: vi.fn(),
  recordScannedProductSale: vi.fn(),
}));

vi.mock('@/lib/session', () => ({ readSessionUserFromRequest: mocks.session }));
vi.mock('@/lib/admin-csrf', () => ({ rejectCrossSiteAdminMutation: () => null }));
vi.mock('@/lib/product-scan-sale', () => ({
  lookupScannedProduct: mocks.lookupScannedProduct,
  recordScannedProductSale: mocks.recordScannedProductSale,
}));

import { POST } from './route';

beforeEach(() => {
  vi.resetAllMocks();
});

describe('POST /api/admin/products/scan', () => {
  it('rejects unauthenticated or cashier calls', async () => {
    mocks.session.mockResolvedValueOnce(null);
    const anon = await POST(
      new NextRequest('https://apfel-park.de/api/admin/products/scan', {
        method: 'POST',
        body: JSON.stringify({ sku: 'AP-1', idempotencyKey: 'k1' }),
      }),
    );
    expect(anon.status).toBe(401);

    mocks.session.mockResolvedValueOnce({
      id: 'c1',
      email: 'cashier@example.com',
      app_metadata: { role: 'cashier' },
    });
    const cashier = await POST(
      new NextRequest('https://apfel-park.de/api/admin/products/scan', {
        method: 'POST',
        body: JSON.stringify({ sku: 'AP-1', idempotencyKey: 'k2' }),
      }),
    );
    expect(cashier.status).toBe(401);
  });

  it('records -1 unit sale and returns updated stock and Telegram broadcast status', async () => {
    mocks.session.mockResolvedValueOnce({
      id: 'a1',
      email: 'owner@example.com',
      app_metadata: { role: 'admin' },
    });
    mocks.recordScannedProductSale.mockResolvedValueOnce({
      product: { productId: 'p1', title: 'iPhone 15', stock: 2, price: 699, sku: 'AP-1' },
      salePrice: 699,
      originalPrice: 699,
      snapshot: { sku: 'AP-1', onHand: 2, reserved: 0, available: 2, version: 5 },
      telegram: { recipients: 3, sent: 3, failed: 0 },
    });

    const response = await POST(
      new NextRequest('https://apfel-park.de/api/admin/products/scan', {
        method: 'POST',
        body: JSON.stringify({ sku: 'AP-1', idempotencyKey: 'k-ok', notifyTelegram: true }),
      }),
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.available).toBe(2);
    expect(body.telegram).toEqual({ recipients: 3, sent: 3, failed: 0 });
  });
});
