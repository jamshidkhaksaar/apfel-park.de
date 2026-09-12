import { validatedGtin } from "@/lib/product-identifiers";

type CatalogIdentifiers = { sku?: string; mpn?: string; gtin?: string };

/**
 * A lone variant may use its existing parent identifiers, as the Merchant feed
 * already does. Never copy a parent's identifiers across multiple offers.
 * This only projects saved facts into markup; it does not assign catalog IDs.
 */
export const productVariantIdentifiers = (
  product: CatalogIdentifiers & { variants: readonly CatalogIdentifiers[] },
  variant: CatalogIdentifiers,
): CatalogIdentifiers => {
  const parent = product.variants.length === 1 ? product : undefined;
  return {
    sku: variant.sku || parent?.sku,
    mpn: variant.mpn || parent?.mpn,
    gtin: validatedGtin(variant.gtin || parent?.gtin) ?? undefined,
  };
};
