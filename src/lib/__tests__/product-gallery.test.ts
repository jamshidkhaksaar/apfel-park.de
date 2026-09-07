import { describe, expect, it } from 'vitest';
import { productGalleryImages } from '../product-gallery';

const product = { image: 'blue-front.webp', images: ['blue-front.webp', 'blue-back.webp'] };
describe('selected configuration gallery', () => {
  it('never appends blue standard photos to an orange variant gallery', () => {
    expect(productGalleryImages(product, { images: ['orange-front.webp', 'orange-back.webp'] }))
      .toEqual(['orange-front.webp', 'orange-back.webp']);
  });
  it('retains only the selected legacy image index', () => {
    expect(productGalleryImages(product, { imageIndex: 1 })).toEqual(['blue-back.webp']);
  });
  it('uses standard photos when the variant has no usable photos', () => {
    expect(productGalleryImages(product, { images: ['', ' '] })).toEqual(product.images);
    expect(productGalleryImages(product, { imageIndex: 99 })).toEqual(product.images);
  });
  it('preserves galleries for products without variants and the single-image fallback', () => {
    expect(productGalleryImages(product)).toEqual(product.images);
    expect(productGalleryImages({ images: [], image: 'front.webp' })).toEqual(['front.webp']);
  });
});
