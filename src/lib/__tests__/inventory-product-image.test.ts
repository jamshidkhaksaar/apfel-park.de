import { describe, expect, it } from 'vitest';
import { inventoryProductImage } from '@/lib/inventory-product-details';

describe('inventory variant image', () => {
  it('prefers the exact SKU photo even when stock is zero', () => {
    expect(
      inventoryProductImage({
        sku: 'APF-IP15-256-BLK',
        images: ['/fallback.jpg', '/black.jpg'],
        variants: [{ sku: 'APF-IP15-256-BLK', imageIndex: 1, stock: 0 }],
      }),
    ).toBe('/black.jpg');
  });

  it('uses variant-owned images before the product gallery', () => {
    expect(
      inventoryProductImage({
        sku: 'APF-IP15-256-BLK',
        images: ['/fallback.jpg'],
        variants: [{ sku: 'APF-IP15-256-BLK', images: ['/owned.jpg'], imageIndex: 0 }],
      }),
    ).toBe('/owned.jpg');
  });

  it('falls back to the first product image for accessories', () => {
    expect(inventoryProductImage({ sku: 'CASE-1', images: ['/case.jpg'], variants: [] })).toBe('/case.jpg');
    expect(inventoryProductImage({ sku: 'CASE-1', images: null, variants: [] })).toBeNull();
  });
});
