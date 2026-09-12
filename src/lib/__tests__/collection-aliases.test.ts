import { describe, expect, it } from 'vitest';
import nextConfig from '../../../next.config';
import { getStoreCollectionCopy, storeCollectionIds } from '../store-collections';

describe('unprefixed collection routes', () => {
  it('permanently redirects every current collection and trade-in to its German route', async () => {
    const redirects = await nextConfig.redirects!();
    for (const path of [...storeCollectionIds.map(id => getStoreCollectionCopy(id, 'de').path), '/trade-in']) {
      expect(redirects).toContainEqual({ source: path, destination: `/de${path}`, permanent: true });
      expect(redirects).toContainEqual({ source: `${path}/:path*`, destination: `/de${path}/:path*`, permanent: true });
      expect(redirects.some(route => route.source === `/de${path}` && route.destination === `/de${path}`)).toBe(false);
    }
  });
  it('retains existing image widths while providing smaller intermediate variants', () => {
    expect(nextConfig.images?.imageSizes).toEqual(expect.arrayContaining([16, 32, 48, 64, 96, 128, 160, 192, 256, 320, 384, 512]));
    expect(nextConfig.images?.deviceSizes).toContain(1920);
  });
});
