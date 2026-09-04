import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ query: vi.fn() }));

vi.mock('@/lib/db', () => ({ query: mocks.query }));

import {
  internalMissingProductUrl,
  resolvePublicProductRoute,
} from '@/lib/product-route-resolution';

describe('resolvePublicProductRoute', () => {
  beforeEach(() => mocks.query.mockReset());

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

  it('builds missing-page rewrites from the internal HTTP origin', () => {
    expect(internalMissingProductUrl('http://127.0.0.1:3000', 'de')).toBe(
      'http://127.0.0.1:3000/de/__missing-product',
    );
  });
});
