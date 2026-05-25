import { createDbClient } from "@/lib/db";

export type ProductCategory = "smartphones" | "accessories" | "consoles" | "laptops";

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

type DbProduct = {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  price: number | string;
  compare_at_price: number | string | null;
  category: string;
  brand: string | null;
  model: string | null;
  sku: string | null;
  stock: number | null;
  slug: string | null;
  images: string[] | null;
  feature_bullets: string[] | null;
  specs: unknown;
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

const toVariants = (value: unknown): ProductVariant[] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const candidate = entry as {
        color?: unknown;
        storage?: unknown;
        price?: unknown;
        compareAtPrice?: unknown;
        stock?: unknown;
        sku?: unknown;
        imageIndex?: unknown;
        isDefault?: unknown;
      };

      const color = typeof candidate.color === "string" ? candidate.color.trim() : "";
      const storage = typeof candidate.storage === "string" ? candidate.storage.trim() : "";
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

const mapProduct = (row: DbProduct): Product | null => {
  const category = normalizeCategory(row.category);
  if (!category || !row.slug) return null;

  const price = toNumber(row.price) ?? 0;
  const compareAtPrice = toNumber(row.compare_at_price);
  const discountPercentage = computeDiscountPercentage(price, compareAtPrice);
  const images = row.images?.filter(Boolean) ?? [];
  const image = images[0] ?? fallbackImageByCategory[category];
  const variants = toVariants(row.variants);

  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle ?? "",
    description: row.description ?? "",
    price,
    compareAtPrice,
    category,
    image,
    images: images.length > 0 ? images : [image],
    brand: row.brand ?? undefined,
    model: row.model ?? undefined,
    sku: row.sku ?? undefined,
    stock: row.stock ?? undefined,
    slug: row.slug,
    featureBullets: row.feature_bullets?.filter(Boolean) ?? [],
    specs: toSpecs(row.specs),
    variants,
    discountPercentage,
    hasDiscount: Boolean(discountPercentage),
  };
};

const baseSelect =
  "id,title,subtitle,description,price,compare_at_price,category,brand,model,sku,stock,slug,images,feature_bullets,specs,variants";

/**
 * Fetches products from the database.
 */
export async function getProducts(category?: ProductCategory, limit?: number): Promise<Product[]> {
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
    .map(mapProduct)
    .filter((item): item is Product => item !== null);

  if (!category) return products;
  return products.filter((product) => product.category === category);
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const db = createDbClient();
  const [{ data: featuredRow }, products] = await Promise.all([
    db
      .from<{ value: unknown }>("store_settings")
      .select("value")
      .eq("key", "featured_product_ids")
      .maybeSingle(),
    getProducts(),
  ]);

  const featuredIds = Array.isArray(featuredRow?.value)
    ? featuredRow.value.filter((item): item is string => typeof item === "string")
    : [];

  if (featuredIds.length === 0) {
    return products.slice(0, 4).map((product) => ({ ...product, isFeatured: true }));
  }

  const byId = new Map(products.map((product) => [product.id, product] as const));
  return featuredIds
    .map((id) => byId.get(id))
    .filter((product): product is Product => Boolean(product))
    .map((product) => ({ ...product, isFeatured: true }));
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const db = createDbClient();
  const { data, error } = await db
    .from<DbProduct>("products")
    .select(baseSelect)
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error || !data) return null;
  return mapProduct(data as DbProduct);
}

export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  const products = await getProducts(product.category);
  return products.filter((candidate) => candidate.id !== product.id).slice(0, limit);
}

export async function getDiscountedProducts(limit = 6): Promise<Product[]> {
  const products = await getProducts();
  return products.filter((product) => product.hasDiscount).slice(0, limit);
}

export async function getPromoProducts(pinnedIds?: string[]): Promise<Product[]> {
  const products = await getProducts();
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
