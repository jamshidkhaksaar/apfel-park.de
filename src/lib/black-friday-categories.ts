import type { Locale } from "./i18n";
import type { Product } from "./products";

/**
 * Black Friday category entry points: tiles on the campaign page, the home
 * page and the shop, plus the matching website banners.
 */
export type BlackFridayCategoryId = "samsung" | "apple" | "xiaomi" | "tablets" | "accessories";

/**
 * One slide of the animated category showcase. `scene` is a dark, full-bleed
 * product photo (slow zoom); `cutout` is a transparent product image that
 * floats on the brand glow. White-background shop photos are cut out once
 * into public/images/black-friday/cutouts so they sit on the dark tiles.
 */
export type ShowcaseSlide = { kind: "scene" | "cutout"; src: string };

export type BlackFridayCategory = {
  id: BlackFridayCategoryId;
  /** Store link with the deals filter switched on. */
  query: string;
  brandLogo?: string;
  matches: (product: Pick<Product, "brand" | "category">) => boolean;
  /** Three slides, shown in a 9-second crossfade loop. */
  showcase: ShowcaseSlide[];
  /** Brand glow behind floating products. */
  glow: string;
  title: Record<Locale, string>;
  kicker: Record<Locale, string>;
};

const brandIs = (pattern: RegExp) => (product: Pick<Product, "brand">) => pattern.test((product.brand ?? "").trim());

export const blackFridayCategories: readonly BlackFridayCategory[] = [
  {
    id: "samsung",
    showcase: [{ kind: "scene", src: "/images/billboards/samsung-z-fold-product.jpg" }, { kind: "cutout", src: "/images/black-friday/cutouts/samsung-1.webp" }, { kind: "cutout", src: "/images/black-friday/cutouts/samsung-2.webp" }],
    glow: "rgba(56,120,255,0.55)",
    query: "brand=samsung&deals=1",
    brandLogo: "/images/brands/samsung.svg",
    matches: brandIs(/^samsung/i),
    title: { de: "Samsung Black Friday Deals", en: "Samsung Black Friday Deals" },
    kicker: { de: "Galaxy S, A & Z", en: "Galaxy S, A & Z" },
  },
  {
    id: "apple",
    showcase: [{ kind: "scene", src: "/images/billboards/iphone-18-pro-max-product.jpg" }, { kind: "scene", src: "/images/apple/pro-lineup.webp" }, { kind: "cutout", src: "/images/black-friday/cutouts/apple-1.webp" }],
    glow: "rgba(212,167,44,0.55)",
    query: "brand=apple&deals=1",
    brandLogo: "/images/brands/apple.svg",
    matches: brandIs(/^apple/i),
    title: { de: "Apple Black Friday Deals", en: "Apple Black Friday Deals" },
    kicker: { de: "iPhone & iPad", en: "iPhone & iPad" },
  },
  {
    id: "xiaomi",
    showcase: [{ kind: "cutout", src: "/images/black-friday/cutouts/xiaomi-1.webp" }, { kind: "cutout", src: "/images/black-friday/cutouts/xiaomi-2.webp" }, { kind: "cutout", src: "/images/black-friday/cutouts/xiaomi-3.webp" }],
    glow: "rgba(255,105,0,0.55)",
    query: "brand=xiaomi&deals=1",
    brandLogo: "/images/brands/xiaomi.svg",
    matches: brandIs(/^(xiaomi|redmi|poco)/i),
    title: { de: "Xiaomi Black Friday Deals", en: "Xiaomi Black Friday Deals" },
    kicker: { de: "Xiaomi, Redmi & Poco", en: "Xiaomi, Redmi & Poco" },
  },
  {
    id: "tablets",
    showcase: [{ kind: "cutout", src: "/images/black-friday/cutouts/tablets-1.webp" }, { kind: "cutout", src: "/images/black-friday/cutouts/tablets-2.webp" }, { kind: "cutout", src: "/images/black-friday/cutouts/tablets-3.webp" }],
    glow: "rgba(120,170,255,0.5)",
    query: "category=tablets&deals=1",
    matches: (product) => product.category === "tablets",
    title: { de: "Tablet Black Friday Deals", en: "Tablet Black Friday Deals" },
    kicker: { de: "iPad, Galaxy Tab & mehr", en: "iPad, Galaxy Tab & more" },
  },
  {
    id: "accessories",
    showcase: [{ kind: "cutout", src: "/images/black-friday/cutouts/accessories-1.webp" }, { kind: "scene", src: "/images/categories/audio-lifestyle-v1.webp" }, { kind: "cutout", src: "/images/black-friday/cutouts/accessories-2.webp" }],
    glow: "rgba(232,23,44,0.55)",
    query: "category=accessories&deals=1",
    matches: (product) => product.category === "accessories",
    title: { de: "Zubehör Black Friday Deals", en: "Accessories Black Friday Deals" },
    kicker: { de: "Hüllen, Laden & Audio", en: "Cases, charging & audio" },
  },
];

/** Mixed showcase for the general Black Friday banner. */
export const blackFridayAllShowcase: ShowcaseSlide[] = [
  { kind: "scene", src: "/images/billboards/iphone-18-pro-max-product.jpg" },
  { kind: "scene", src: "/images/billboards/samsung-z-fold-product.jpg" },
  { kind: "scene", src: "/images/apple/pro-lineup.webp" },
];

export type BlackFridayCategoryStat = {
  category: BlackFridayCategory;
  count: number;
  /** Highest real saving in this category; null before the sale or without deals. */
  maxPercent: number | null;
  /** Up to three product photos, biggest saving first. */
  images: string[];
};

const savingOf = (product: Product): number => product.campaignDeal?.percent ?? product.discountPercentage ?? 0;

export const blackFridayCategoryStats = (deals: readonly Product[]): BlackFridayCategoryStat[] =>
  blackFridayCategories.map((category) => {
    const matching = deals
      .filter((product) => category.matches(product))
      .sort((left, right) => savingOf(right) - savingOf(left));
    const best = matching.reduce((max, product) => Math.max(max, product.campaignDeal?.percent ?? 0), 0);
    return {
      category,
      count: matching.length,
      maxPercent: best > 0 ? best : null,
      images: [...new Set(matching.map((product) => product.image).filter(Boolean))].slice(0, 3),
    };
  });
