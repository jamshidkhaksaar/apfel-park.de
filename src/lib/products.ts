import { createDbClient } from "@/lib/db";
import type { Locale } from "@/lib/i18n";

export type ProductCategory = "smartphones" | "accessories" | "consoles" | "laptops";

export type ProductCondition = "new" | "refurbished" | "used";

export type ProductSpec = {
  label: string;
  value: string;
};

export type ProductVariant = {
  color: string;
  storage: string;
  price?: number;
  compareAtPrice?: number;
  stock?: number;
  sku?: string;
  imageIndex?: number;
  images?: string[];
  isDefault?: boolean;
};

export type Product = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  category: ProductCategory;
  condition: ProductCondition;
  isOpenBox: boolean;
  image: string;
  images: string[];
  brand?: string;
  model?: string;
  sku?: string;
  stock?: number;
  slug: string;
  featureBullets: string[];
  specs: ProductSpec[];
  variants: ProductVariant[];
  isFeatured?: boolean;
  discountPercentage?: number;
  hasDiscount: boolean;
};

type LocalizedText = {
  de?: string | null;
  en?: string | null;
};

type LocalizedSpec = {
  label?: LocalizedText | string | null;
  value?: LocalizedText | string | null;
};

type DbProduct = {
  id: string;
  title: string;
  title_i18n?: LocalizedText | null;
  subtitle: string | null;
  subtitle_i18n?: LocalizedText | null;
  description: string | null;
  description_i18n?: LocalizedText | null;
  price: number | string;
  compare_at_price: number | string | null;
  category: string;
  condition?: string | null;
  brand: string | null;
  model: string | null;
  sku: string | null;
  stock: number | null;
  slug: string | null;
  images: string[] | null;
  feature_bullets: string[] | null;
  feature_bullets_i18n?: { de?: string[] | null; en?: string[] | null } | null;
  specs: unknown;
  specs_i18n?: LocalizedSpec[] | null;
  variants: unknown;
};

export type PromoPopupSettings = {
  enabled: boolean;
  title: { de: string; en: string };
  description: { de: string; en: string };
  ctaLabel: { de: string; en: string };
  ctaHref: string;
  pinnedProductIds?: string[];
};

const DEFAULT_PROMO_POPUP: PromoPopupSettings = {
  enabled: false,
  title: {
    de: "Angebote entdecken",
    en: "Discover current deals",
  },
  description: {
    de: "Aktuelle Rabatte und Aktionen aus unserem Shop.",
    en: "Current discounts and special offers from our store.",
  },
  ctaLabel: {
    de: "Zum Shop",
    en: "Open store",
  },
  ctaHref: "/de/store",
};

const normalizeCategory = (category: string): ProductCategory | null => {
  const value = category.toLowerCase().trim();
  if (value === "smartphone" || value === "smartphones") return "smartphones";
  if (value === "accessory" || value === "accessories") return "accessories";
  if (value === "console" || value === "consoles" || value === "gaming" || value === "game") return "consoles";
  if (value === "laptop" || value === "laptops") return "laptops";
  return null;
};

const normalizeCondition = (condition: string | null | undefined): ProductCondition => {
  const value = (condition ?? "").toLowerCase().trim();
  if (value === "refurbished") return "refurbished";
  if (value === "used") return "used";
  return "new";
};

const fallbackImageByCategory: Record<ProductCategory, string> = {
  smartphones: "/images/slider_images/iphone.png",
  accessories: "/images/slider_images/accessories.png",
  consoles: "/images/slider_images/ps5.png",
  laptops: "/images/slider_images/laptop.png",
};

const categoryFilters: Record<ProductCategory, string> = {
  smartphones: "category.ilike.*smartphone*,category.ilike.*smartphones*",
  accessories: "category.ilike.*accessory*,category.ilike.*accessories*",
  consoles: "category.ilike.*console*,category.ilike.*consoles*,category.ilike.*gaming*,category.ilike.*game*",
  laptops: "category.ilike.*laptop*,category.ilike.*laptops*",
};

const toNumber = (value: number | string | null | undefined): number | undefined => {
  if (value === null || value === undefined || value === "") return undefined;
  const parsed = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(parsed) ? parsed : undefined;
};

const localizedText = (value: LocalizedText | null | undefined, locale: Locale, fallback: string | null | undefined): string => {
  const preferred = value?.[locale]?.trim();
  if (preferred) return preferred;
  const fallbackLocale = locale === "de" ? value?.en?.trim() : value?.de?.trim();
  return fallbackLocale || fallback || "";
};

const localizedStringArray = (
  value: { de?: string[] | null; en?: string[] | null } | null | undefined,
  locale: Locale,
  fallback: string[] | null | undefined,
): string[] => {
  const preferred = value?.[locale]?.filter(Boolean) ?? [];
  if (preferred.length > 0) return preferred;
  const fallbackLocale = locale === "de" ? value?.en?.filter(Boolean) : value?.de?.filter(Boolean);
  return fallbackLocale && fallbackLocale.length > 0 ? fallbackLocale : (fallback?.filter(Boolean) ?? []);
};

const localizedSpecValue = (value: LocalizedText | string | null | undefined, locale: Locale): string => {
  if (typeof value === "string") return value.trim();
  return localizedText(value, locale, "");
};

const toLocalizedSpecs = (value: unknown, locale: Locale, fallback: unknown): ProductSpec[] => {
  if (!Array.isArray(value)) return toSpecs(fallback);

  const specs = value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const candidate = entry as LocalizedSpec;
      const label = localizedSpecValue(candidate.label, locale);
      const specValue = localizedSpecValue(candidate.value, locale);
      if (!label || !specValue) return null;
      return { label, value: specValue };
    })
    .filter((entry): entry is ProductSpec => entry !== null);

  return specs.length > 0 ? specs : toSpecs(fallback);
};

const toSpecs = (value: unknown): ProductSpec[] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const candidate = entry as { label?: unknown; value?: unknown };
      if (typeof candidate.label !== "string" || typeof candidate.value !== "string") return null;
      const label = candidate.label.trim();
      const specValue = candidate.value.trim();
      if (!label || !specValue) return null;
      return { label, value: specValue };
    })
    .filter((entry): entry is ProductSpec => entry !== null);
};

const toVariants = (value: unknown, locale: Locale = "de"): ProductVariant[] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const candidate = entry as {
        color?: unknown;
        colorI18n?: unknown;
        color_i18n?: unknown;
        storage?: unknown;
        storageI18n?: unknown;
        storage_i18n?: unknown;
        price?: unknown;
        compareAtPrice?: unknown;
        stock?: unknown;
        sku?: unknown;
        imageIndex?: unknown;
        isDefault?: unknown;
      };

      const colorI18n = (candidate.colorI18n || candidate.color_i18n) as LocalizedText | null | undefined;
      const storageI18n = (candidate.storageI18n || candidate.storage_i18n) as LocalizedText | null | undefined;
      const color = localizedText(colorI18n, locale, typeof candidate.color === "string" ? candidate.color.trim() : "");
      const storage = localizedText(storageI18n, locale, typeof candidate.storage === "string" ? candidate.storage.trim() : "");
      if (!color || !storage) return null;

      const price = toNumber(candidate.price as number | string | null | undefined);
      const compareAtPrice = toNumber(candidate.compareAtPrice as number | string | null | undefined);
      const stock = toNumber(candidate.stock as number | string | null | undefined);
      const imageIndex = toNumber(candidate.imageIndex as number | string | null | undefined);

      return {
        color,
        storage,
        price,
        compareAtPrice,
        stock,
        sku: typeof candidate.sku === "string" && candidate.sku.trim() ? candidate.sku.trim() : undefined,
        imageIndex: imageIndex !== undefined ? Math.max(0, Math.floor(imageIndex)) : undefined,
        isDefault: Boolean(candidate.isDefault),
      };
    })
    .filter((entry) => entry !== null) as ProductVariant[];
};

const computeDiscountPercentage = (price: number, compareAtPrice?: number) => {
  if (!compareAtPrice || compareAtPrice <= price || compareAtPrice <= 0) return undefined;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
};

const mapProduct = (row: DbProduct, locale: Locale = "de"): Product | null => {
  const category = normalizeCategory(row.category);
  if (!category || !row.slug) return null;

  const price = toNumber(row.price) ?? 0;
  const compareAtPrice = toNumber(row.compare_at_price);
  const condition = normalizeCondition(row.condition);
  const discountPercentage = computeDiscountPercentage(price, compareAtPrice);
  const images = row.images?.filter(Boolean) ?? [];
  const image = images[0] ?? fallbackImageByCategory[category];
  const variants = toVariants(row.variants, locale);

  return {
    id: row.id,
    title: localizedText(row.title_i18n, locale, row.title),
    subtitle: localizedText(row.subtitle_i18n, locale, row.subtitle),
    description: localizedText(row.description_i18n, locale, row.description),
    price,
    compareAtPrice,
    category,
    condition,
    isOpenBox: condition !== "new",
    image,
    images: images.length > 0 ? images : [image],
    brand: row.brand ?? undefined,
    model: row.model ?? undefined,
    sku: row.sku ?? undefined,
    stock: row.stock ?? undefined,
    slug: row.slug,
    featureBullets: localizedStringArray(row.feature_bullets_i18n, locale, row.feature_bullets),
    specs: toLocalizedSpecs(row.specs_i18n, locale, row.specs),
    variants,
    discountPercentage,
    hasDiscount: Boolean(discountPercentage),
  };
};

const baseSelect =
  "id,title,title_i18n,subtitle,subtitle_i18n,description,description_i18n,price,compare_at_price,category,condition,brand,model,sku,stock,slug,images,feature_bullets,feature_bullets_i18n,specs,specs_i18n,variants";

/**
 * Fetches products from the database.
 */
export async function getProducts(category?: ProductCategory, limit?: number, locale: Locale = "de"): Promise<Product[]> {
  const db = createDbClient();

  let query = db
    .from<DbProduct[]>("products")
    .select(baseSelect)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (category) {
    query = query.or(categoryFilters[category]);
  }

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error || !data) return [];

  const products = (data as DbProduct[])
    .map((row) => mapProduct(row, locale))
    .filter((item): item is Product => item !== null);

  if (!category) return products;
  return products.filter((product) => product.category === category);
}

export async function getFeaturedProducts(locale: Locale = "de"): Promise<Product[]> {
  const db = createDbClient();
  const [{ data: featuredRow }, products] = await Promise.all([
    db
      .from<{ value: unknown }>("store_settings")
      .select("value")
      .eq("key", "featured_product_ids")
      .maybeSingle(),
    getProducts(undefined, undefined, locale),
  ]);

  const featuredIds = Array.isArray(featuredRow?.value)
    ? featuredRow.value.filter((item): item is string => typeof item === "string")
    : [];

  if (featuredIds.length === 0) {
    return [];
  }

  const byId = new Map(products.map((product) => [product.id, product] as const));
  return featuredIds
    .map((id) => byId.get(id))
    .filter((product): product is Product => Boolean(product))
    .map((product) => ({ ...product, isFeatured: true }));
}

export async function getProductBySlug(slug: string, locale: Locale = "de"): Promise<Product | null> {
  const db = createDbClient();
  const { data, error } = await db
    .from<DbProduct>("products")
    .select(baseSelect)
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error || !data) return null;
  return mapProduct(data as DbProduct, locale);
}

export async function getRelatedProducts(product: Product, limit = 4, locale: Locale = "de"): Promise<Product[]> {
  const products = await getProducts(product.category, undefined, locale);
  return products.filter((candidate) => candidate.id !== product.id).slice(0, limit);
}

export async function getDiscountedProducts(limit = 6, locale: Locale = "de"): Promise<Product[]> {
  const products = await getProducts(undefined, undefined, locale);
  return products.filter((product) => product.hasDiscount).slice(0, limit);
}

export async function getOpenBoxProducts(limit?: number, locale: Locale = "de"): Promise<Product[]> {
  const products = await getProducts(undefined, undefined, locale);
  const openBox = products.filter((product) => product.isOpenBox);
  return limit ? openBox.slice(0, limit) : openBox;
}

export async function getPromoProducts(pinnedIds?: string[], locale: Locale = "de"): Promise<Product[]> {
  const products = await getProducts(undefined, undefined, locale);
  if (pinnedIds?.length) {
    const byId = new Map(products.map((p) => [p.id, p]));
    return pinnedIds.map((id) => byId.get(id)).filter((p): p is Product => Boolean(p)).slice(0, 3);
  }
  return products.filter((p) => p.hasDiscount).slice(0, 3);
}

export async function getPromoPopupSettings(): Promise<PromoPopupSettings> {
  try {
    const db = createDbClient();
    const { data } = await db
      .from<{ value: unknown }>("store_settings")
      .select("value")
      .eq("key", "product_promo_popup")
      .maybeSingle();

    const value = data?.value;
    if (!value || typeof value !== "object") {
      return DEFAULT_PROMO_POPUP;
    }

    const promo = value as Partial<PromoPopupSettings>;
    const pinnedProductIds = Array.isArray(promo.pinnedProductIds)
      ? promo.pinnedProductIds.filter((item): item is string => typeof item === "string")
      : undefined;
    return {
      enabled: Boolean(promo.enabled),
      title: {
        de: promo.title?.de || DEFAULT_PROMO_POPUP.title.de,
        en: promo.title?.en || DEFAULT_PROMO_POPUP.title.en,
      },
      description: {
        de: promo.description?.de || DEFAULT_PROMO_POPUP.description.de,
        en: promo.description?.en || DEFAULT_PROMO_POPUP.description.en,
      },
      ctaLabel: {
        de: promo.ctaLabel?.de || DEFAULT_PROMO_POPUP.ctaLabel.de,
        en: promo.ctaLabel?.en || DEFAULT_PROMO_POPUP.ctaLabel.en,
      },
      ctaHref: typeof promo.ctaHref === "string" && promo.ctaHref ? promo.ctaHref : DEFAULT_PROMO_POPUP.ctaHref,
      pinnedProductIds: pinnedProductIds?.length ? pinnedProductIds : undefined,
    };
  } catch {
    return DEFAULT_PROMO_POPUP;
  }
}
