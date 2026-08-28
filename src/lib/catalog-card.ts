import type { Locale } from "@/lib/i18n";
import type { Product, ProductCategory, ProductCondition } from "@/lib/products";
import type { ProductRatingSummary } from "@/lib/product-reviews";

export type CatalogCardVariant = {
  color: string;
  storage: string;
  price?: number;
  compareAtPrice?: number;
  stock?: number;
  sku?: string;
};

export type CatalogCardModel = {
  id: string;
  title: string;
  slug: string;
  image: string;
  price: number;
  compareAtPrice?: number;
  category: ProductCategory;
  condition: ProductCondition;
  stock: number;
  brand?: string;
  sku?: string;
  energyClass?: string;
  facts: string[];
  colors: string[];
  storages: string[];
  variants: CatalogCardVariant[];
  rating?: ProductRatingSummary;
};

const normalizeFact = (value: string): string => value.replace(/\s+/g, " ").trim();

const uniqueValues = (values: Array<string | undefined>): string[] =>
  Array.from(new Set(values.map((value) => normalizeFact(value ?? "")).filter(Boolean)));

const factLabelPriority = (category: ProductCategory): RegExp[] => category === "accessories"
  ? [
      /leistung|power|watt|kapazit[aä]t|capacity/i,
      /anschluss|connector|usb|kompatibilit[aä]t|compatibility/i,
      /l[aä]nge|length|material/i,
    ]
  : [
      /display|bildschirm|screen/i,
      /kamera|camera/i,
      /prozessor|processor|chip|akku|battery/i,
    ];

export const catalogCardFacts = (product: Product): string[] => {
  const facts: string[] = [];
  const storages = uniqueValues(product.variants.map((variant) => variant.storage));
  if (storages.length > 0) facts.push(storages.slice(0, 3).join(" · "));

  for (const pattern of factLabelPriority(product.category)) {
    const spec = product.specs.find((candidate) => pattern.test(candidate.label));
    if (!spec?.value) continue;
    const value = normalizeFact(spec.value);
    if (value && !facts.some((fact) => fact.toLowerCase() === value.toLowerCase())) facts.push(value);
    if (facts.length === 3) break;
  }

  if (facts.length < 2) {
    for (const bullet of product.featureBullets) {
      const value = normalizeFact(bullet);
      if (!value || value.length > 54 || facts.includes(value)) continue;
      facts.push(value);
      if (facts.length === 3) break;
    }
  }

  return facts.slice(0, 3);
};

export const toCatalogCardModel = (
  product: Product,
  locale: Locale,
  rating?: ProductRatingSummary,
): CatalogCardModel => ({
  id: product.id,
  title: product.title,
  slug: product.slug,
  image: product.image,
  price: product.price,
  compareAtPrice: product.compareAtPrice,
  category: product.category,
  condition: product.condition,
  stock: Math.max(0, product.stock ?? 0),
  brand: product.brand,
  sku: product.sku,
  energyClass: product.energyLabel?.efficiencyClass,
  facts: catalogCardFacts(product),
  colors: uniqueValues(product.variants.map((variant) => variant.color)),
  storages: uniqueValues(product.variants.map((variant) => variant.storage)),
  variants: product.variants.map((variant) => ({
    color: variant.color,
    storage: variant.storage,
    price: variant.price,
    compareAtPrice: variant.compareAtPrice,
    stock: variant.stock,
    sku: variant.sku,
  })),
  rating,
});

export const discountPercentage = (price: number, compareAtPrice?: number): number | null => {
  if (!compareAtPrice || compareAtPrice <= price) return null;
  return Math.max(1, Math.round(((compareAtPrice - price) / compareAtPrice) * 100));
};

export const sellableCatalogVariants = (product: CatalogCardModel): CatalogCardVariant[] => {
  const seen = new Set<string>();
  return product.variants.filter((variant) => {
    if ((variant.stock ?? product.stock) <= 0) return false;
    const key = `${variant.color.trim().toLowerCase()}:${variant.storage.trim().toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};
