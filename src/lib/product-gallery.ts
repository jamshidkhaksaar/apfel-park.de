import type { Product, ProductVariant } from './products';

/** Variant photos belong to that configuration; the standard gallery is a fallback. */
export const productGalleryImages = (
  product: Pick<Product, 'images' | 'image'>,
  variant?: Pick<ProductVariant, 'images' | 'imageIndex'> | null,
): string[] => {
  const own = variant?.images?.filter((image) => image.trim()) ?? [];
  if (own.length) return [...new Set(own)];
  const indexed = variant?.imageIndex === undefined ? undefined : product.images[variant.imageIndex];
  if (indexed) return [indexed];
  const standard = product.images.filter((image) => image.trim());
  return [...new Set(standard.length ? standard : product.image ? [product.image] : [])];
};
