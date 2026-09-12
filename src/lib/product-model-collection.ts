import type { Locale } from "@/lib/i18n";
import type { ProductCategory } from "@/lib/products";

export type ProductModelCollectionLink = {
  href: string;
  label: string;
};

export const getProductModelCollectionLink = (
  productName: string,
  category: ProductCategory,
  locale: Locale,
): ProductModelCollectionLink | null => {
  if (category !== "smartphones") return null;

  const normalized = productName.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();

  if (/\biPhone\s*16\s*Pro\s*Max\b/i.test(normalized)) {
    return {
      href: "/iphone-16-pro-max",
      label: locale === "de" ? "Alle iPhone-16-Pro-Max-Angebote" : "All iPhone 16 Pro Max offers",
    };
  }

  if (/\biPhone\s*17(?:\s|\b)/i.test(normalized)) {
    return {
      href: "/iphone-17",
      label: locale === "de" ? "Alle iPhone-17-Modelle" : "All iPhone 17 models",
    };
  }

  return null;
};
