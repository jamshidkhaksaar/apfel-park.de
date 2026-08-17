import { googleMerchantItemId } from '@/lib/google-merchant';
import { getProducts, type Product } from '@/lib/products';
import { siteInfo } from '@/lib/site';

const inventoryQuantity = (value: number | undefined): number =>
  Math.max(0, Math.floor(value ?? 0));

const inventoryRowsForProduct = (product: Product, storeCode: string): string[] => {
  const variants = product.variants.length > 0 ? product.variants : [undefined];

  return variants.map((variant, index) => {
    const quantity = inventoryQuantity(variant?.stock ?? product.stock);
    const availability = quantity > 0 ? 'in_stock' : 'out_of_stock';
    const itemId = googleMerchantItemId(product.id, variant, index);

    return [storeCode, itemId, quantity, availability].join('\t');
  });
};

export const buildGoogleLocalInventoryFeedForProducts = (
  products: Product[],
  storeCode = siteInfo.googleBusinessProfile.storeCode,
): string => [
  'store_code\tid\tquantity\tavailability',
  ...products.flatMap((product) => inventoryRowsForProduct(product, storeCode)),
  '',
].join('\n');

export const buildGoogleLocalInventoryFeed = async (): Promise<string> => {
  const products = await getProducts(undefined, undefined, 'de');
  if (products.length === 0) {
    throw new Error('Local inventory feed aborted because no active products were returned.');
  }
  return buildGoogleLocalInventoryFeedForProducts(products);
};
