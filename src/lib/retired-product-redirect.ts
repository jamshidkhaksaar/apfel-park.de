import type { Locale } from "./i18n";
import { getProductModelCollectionLink } from "./product-model-collection";
import type { ProductCategory, ProductCondition } from "./products";

/**
 * Where a product URL goes once the product is gone.
 *
 * Sold devices leave their URL in Google for months; the used iPhone 16 Pro
 * Max page kept 80,000 impressions after it was sold and every visitor got a
 * 404. Sending the visitor to the closest page that still sells the same
 * thing keeps the search traffic: the model page first, then the brand or
 * condition page, then the category.
 */

export type RetiredProduct = {
  title: string;
  model?: string | null;
  brand?: string | null;
  category: ProductCategory;
  condition: ProductCondition;
};

const LOCALISED: Record<string, Record<Locale, string>> = {
  usedIphones: { de: "/gebrauchte-iphones", en: "/used-iphones" },
  samsung: { de: "/samsung-handys", en: "/samsung-phones" },
  xiaomi: { de: "/xiaomi-redmi-handys", en: "/xiaomi-redmi-phones" },
};

const CATEGORY_PATHS: Record<ProductCategory, string> = {
  smartphones: "/smartphones",
  tablets: "/tablets",
  accessories: "/accessories",
  parts: "/parts",
  laptops: "/laptops",
  consoles: "/gaming",
};

/** Locale-prefixed path of the best page for a product that no longer sells. */
export const retiredProductTarget = (product: RetiredProduct, locale: Locale): string => {
  const name = `${product.brand ?? ""} ${product.model ?? ""} ${product.title}`.trim();
  const model = getProductModelCollectionLink(name, product.category, locale);
  if (model) return `/${locale}${model.href}`;

  if (product.category === "smartphones") {
    const brand = (product.brand ?? "").toLowerCase();
    if (/\biphone\b/i.test(name) && product.condition !== "new") return `/${locale}${LOCALISED.usedIphones[locale]}`;
    if (brand === "samsung" || /\bgalaxy\b/i.test(name)) return `/${locale}${LOCALISED.samsung[locale]}`;
    if (["xiaomi", "redmi", "poco"].includes(brand) || /\b(xiaomi|redmi|poco)\b/i.test(name)) return `/${locale}${LOCALISED.xiaomi[locale]}`;
  }

  return `/${locale}${CATEGORY_PATHS[product.category] ?? "/store"}`;
};
