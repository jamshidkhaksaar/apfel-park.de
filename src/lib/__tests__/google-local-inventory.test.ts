import { describe, expect, it } from 'vitest';

import { buildGoogleLocalInventoryFeedForProducts } from '../google-local-inventory';
import { buildGoogleMerchantFeedForProducts } from '../google-merchant';
import type { Product } from '../products';

const product = {
  id: 'product-1',
  title: 'Apple iPhone 17',
  subtitle: 'Neu & versiegelt',
  description: 'Originalverpacktes Smartphone',
  price: 999,
  category: 'smartphones',
  condition: 'new',
  isOpenBox: false,
  hasRealProductPhotos: false,
  image: '/iphone.webp',
  images: ['/iphone.webp'],
  brand: 'Apple',
  sku: 'IP17',
  identifierStatus: 'unknown',
  stock: 3,
  slug: 'apple-iphone-17',
  featureBullets: [],
  specs: [],
  faq: [],
  variants: [
    { color: 'Schwarz', storage: '128 GB', stock: 2, sku: 'IP17-BLK-128' },
    { color: 'Blau', storage: '256 GB', stock: 0, sku: 'IP17-BLU-256' },
  ],
  hasDiscount: false,
} satisfies Product;

describe('Google local inventory feed', () => {
  it('publishes the required shop, item, quantity and availability columns', () => {
    const feed = buildGoogleLocalInventoryFeedForProducts([product], 'hamburg-store');
    const lines = feed.trim().split('\n');

    expect(lines[0]).toBe('store_code\tid\tquantity\tavailability');
    expect(lines).toHaveLength(3);
    expect(lines[1]).toMatch(/^hamburg-store\tproduct-1-[a-f0-9]{8}\t2\tin_stock$/);
    expect(lines[2]).toMatch(/^hamburg-store\tproduct-1-[a-f0-9]{8}\t0\tout_of_stock$/);
  });

  it('uses exactly the same item IDs as the primary Merchant Center feed', () => {
    const localFeed = buildGoogleLocalInventoryFeedForProducts([product], 'hamburg-store');
    const primaryFeed = buildGoogleMerchantFeedForProducts([product]);
    const localIds = localFeed
      .trim()
      .split('\n')
      .slice(1)
      .map((line) => line.split('\t')[1]);
    const primaryIds = Array.from(primaryFeed.matchAll(/<g:id>([^<]+)<\/g:id>/g), (match) => match[1]);

    expect(localIds).toEqual(primaryIds);
  });

  it('uses the product ID and clamps invalid stock for products without variants', () => {
    const standalone = {
      ...product,
      id: 'standalone-product',
      stock: -3,
      variants: [],
    } satisfies Product;

    const feed = buildGoogleLocalInventoryFeedForProducts([standalone], 'hamburg-store');

    expect(feed).toContain('hamburg-store\tstandalone-product\t0\tout_of_stock');
  });
});
