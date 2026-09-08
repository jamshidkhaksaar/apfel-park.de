import { accessoryCollectionSlugs, getAccessoryCollection } from "@/lib/accessory-collections";
import type { Locale } from "@/lib/i18n";
import type { Product } from "@/lib/products";

/** The caller supplies the active catalog. Counts mean listings, not stock units. */
export const accessoryCollectionLinks = (
  products: readonly Pick<Product, "category" | "subcategory">[],
  locale: Locale,
  currentSlug?: string,
) => {
  const counts = new Map<string, number>();
  for (const product of products) {
    if (product.category !== "accessories" || !product.subcategory) continue;
    counts.set(product.subcategory, (counts.get(product.subcategory) ?? 0) + 1);
  }
  return accessoryCollectionSlugs.flatMap(slug => {
    const copy = getAccessoryCollection(slug, locale);
    const count = copy ? counts.get(copy.subcategory) ?? 0 : 0;
    if (!copy || count === 0 || slug === currentSlug) return [];
    return [{ slug, title: copy.title, count, href: `/${locale}/accessories/${slug}` }];
  });
};
