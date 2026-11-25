import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ query: vi.fn(), getRetiredProductBySlug: vi.fn() }));

vi.mock('@/lib/db', () => ({ query: mocks.query }));
vi.mock('@/lib/products', () => ({ getRetiredProductBySlug: mocks.getRetiredProductBySlug }));

import {
  internalMissingProductUrl,
  resolvePublicProductRoute,
} from '@/lib/product-route-resolution';

describe('resolvePublicProductRoute', () => {
  beforeEach(() => {
    mocks.query.mockReset();
    mocks.getRetiredProductBySlug.mockReset().mockResolvedValue(null);
  });

  it('keeps an active product route active', async () => {
    mocks.query.mockResolvedValue({ rows: [{ kind: 'active', slug: 'current-product' }] });
    await expect(resolvePublicProductRoute('current-product')).resolves.toEqual({ kind: 'active' });
  });

  it('returns only the exact active successor from slug history', async () => {
    mocks.query.mockResolvedValue({ rows: [{ kind: 'redirect', slug: 'replacement-product' }] });
    await expect(resolvePublicProductRoute('old-product')).resolves.toEqual({
      kind: 'redirect',
      slug: 'replacement-product',
    });
  });

  it('marks an unknown product route missing', async () => {
    mocks.query.mockResolvedValue({ rows: [] });
    await expect(resolvePublicProductRoute('removed-product')).resolves.toEqual({ kind: 'missing' });
  });

  it('sends a sold product to its model page in both languages, permanently', async () => {
    mocks.query.mockResolvedValue({ rows: [] });
    mocks.getRetiredProductBySlug.mockResolvedValue({
      title: 'Apple iPhone 16 Pro Max 256GB', brand: 'Apple', model: 'iPhone 16 Pro Max', category: 'smartphones', condition: 'used', deleted: true,
    });
    await expect(resolvePublicProductRoute('apple-iphone-16-pro-max-256gb-gebraucht')).resolves.toEqual({
      kind: 'retired',
      targets: { de: '/de/iphone-16-pro-max', en: '/en/iphone-16-pro-max' },
      permanent: true,
    });
  });

  it('only temporarily redirects a switched-off product', async () => {
    mocks.query.mockResolvedValue({ rows: [] });
    mocks.getRetiredProductBySlug.mockResolvedValue({
      title: 'Galaxy A55', brand: 'Samsung', model: null, category: 'smartphones', condition: 'open_box', deleted: false,
    });
    await expect(resolvePublicProductRoute('galaxy-a55')).resolves.toMatchObject({
      kind: 'retired', targets: { en: '/en/samsung-phones' }, permanent: false,
    });
  });

  it('builds missing-page rewrites from the internal HTTP origin', () => {
    expect(internalMissingProductUrl('http://127.0.0.1:3000', 'de')).toBe(
      'http://127.0.0.1:3000/de/__missing-product',
    );
  });
});
