import { createDbClient } from "@/lib/db";
import type { Locale } from "@/lib/i18n";

export type ProductCategory = "smartphones" | "tablets" | "accessories" | "consoles" | "laptops";

export type ProductCondition = "new" | "open_box" | "used";

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
  batteryHealth?: number;
  hasRealProductPhotos: boolean;
  conditionNote?: string;
  image: string;
  images: string[];
  brand?: string;
  model?: string;
  sku?: string;
  gtin?: string;
  stock?: number;
  slug: string;
  featureBullets: string[];
  specs: ProductSpec[];
  variants: ProductVariant[];
  isFeatured?: boolean;
  discountPercentage?: number;
  hasDiscount: boolean;
  createdAt?: string;
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
  battery_health?: number | string | null;
  has_real_product_photos?: boolean | null;
  condition_note?: string | null;
  import_metadata?: { conditionNoteI18n?: LocalizedText | null } | null;
  brand: string | null;
  model: string | null;
  sku: string | null;
  gtin?: string | null;
  stock: number | null;
  slug: string | null;
  images: string[] | null;
  feature_bullets: string[] | null;
  feature_bullets_i18n?: { de?: string[] | null; en?: string[] | null } | null;
  specs: unknown;
  specs_i18n?: LocalizedSpec[] | null;
  variants: unknown;
  created_at?: string | null;
};

export type PromoPopupSettings = {
  enabled: boolean;
  title: { de: string; en: string };
  description: { de: string; en: string };
  ctaLabel: { de: string; en: string };
  ctaHref: string;
  pinnedProductIds?: string[];
};

type TrendingProductsSetting = {
  productIds?: string[];
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
  if (value === "tablet" || value === "tablets") return "tablets";
  if (value === "accessory" || value === "accessories") return "accessories";
  if (value === "console" || value === "consoles" || value === "gaming" || value === "game") return "consoles";
  if (value === "laptop" || value === "laptops") return "laptops";
  return null;
};

const normalizeCondition = (condition: string | null | undefined): ProductCondition => {
  const value = (condition ?? "").toLowerCase().trim();
  if (value === "open_box" || value === "open-box" || value === "refurbished") return "open_box";
  if (value === "used") return "used";
  return "new";
};

const fallbackImageByCategory: Record<ProductCategory, string> = {
  smartphones: "/images/slider_images/iphone.png",
  tablets: "/images/ipad.png",
  accessories: "/images/slider_images/accessories.png",
  consoles: "/images/slider_images/ps5.png",
  laptops: "/images/slider_images/laptop.png",
};

const categoryFilters: Record<ProductCategory, string> = {
  smartphones: "category.ilike.*smartphone*,category.ilike.*smartphones*",
  tablets: "category.ilike.*tablet*,category.ilike.*tablets*",
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
  const batteryHealth = toNumber(row.battery_health);
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
    batteryHealth: batteryHealth !== undefined ? Math.max(1, Math.min(100, Math.round(batteryHealth))) : undefined,
    hasRealProductPhotos: Boolean(row.has_real_product_photos),
    conditionNote: localizedText(row.import_metadata?.conditionNoteI18n, locale, row.condition_note) || undefined,
    image,
    images: images.length > 0 ? images : [image],
    brand: row.brand ?? undefined,
    model: row.model ?? undefined,
    sku: row.sku ?? undefined,
    gtin: row.gtin?.trim() || undefined,
    stock: row.stock ?? undefined,
    slug: row.slug,
    featureBullets: localizedStringArray(row.feature_bullets_i18n, locale, row.feature_bullets),
    specs: toLocalizedSpecs(row.specs_i18n, locale, row.specs),
    variants,
    discountPercentage,
    hasDiscount: Boolean(discountPercentage),
    createdAt: row.created_at ?? undefined,
  };
};

const baseSelect =
  "id,title,title_i18n,subtitle,subtitle_i18n,description,description_i18n,price,compare_at_price,category,condition,battery_health,has_real_product_photos,condition_note,import_metadata,brand,model,sku,gtin,stock,slug,images,feature_bullets,feature_bullets_i18n,specs,specs_i18n,variants,created_at";

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

export type StoreCatalogCategory = "all" | ProductCategory | "open-box-smartphones-tablets";
export type StoreCatalogCollection = "iphone-17" | "used-phones" | "used-iphones";
export type StoreCatalogSort = "featured" | "price-asc" | "price-desc" | "newest";

export type StoreCatalogFilters = {
  brands: string[];
  models: string[];
  storages: string[];
  conditions: ProductCondition[];
  accessoryTypes: string[];
  priceMin?: number;
  priceMax?: number;
};

export type FacetOption = { value: string; count: number };

export type StoreCatalogFacets = {
  brands: FacetOption[];
  models: FacetOption[];
  storages: FacetOption[];
  conditions: FacetOption[];
  accessoryTypes: FacetOption[];
  priceMin: number;
  priceMax: number;
};

export type StoreCatalogResult = {
  products: Product[];
  total: number;
  page: number;
  pages: number;
  counts: Record<StoreCatalogCategory, number>;
  facets: StoreCatalogFacets;
};

/**
 * Canonical brand label used for filter facets + matching. Collapses
 * duplicates (Apple/Apple iphone, GUESS/Guess, XBYTE/XByte) to one option.
 */
export const normalizeProductBrand = (brand?: string): string | null => {
  const value = (brand ?? "").trim();
  if (!value) return null;
  if (/^apple(?:\s+iphone)?$/i.test(value)) return "Apple";
  if (/^samsung/i.test(value)) return "Samsung";
  if (/^(xiaomi|redmi)/i.test(value)) return "Xiaomi";
  if (/^google/i.test(value)) return "Google";
  const lower = value.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
};

const bestBrandDisplay = (current: string | undefined, next: string): string => {
  if (!current) return next;
  if (current === current.toUpperCase() && next !== next.toUpperCase()) return next;
  return current;
};

const normalizeStorageValue = (storage?: string): { label: string; gb: number } | null => {
  if (!storage) return null;
  const match = storage.trim().match(/(\d+(?:\.\d+)?)\s*(gb|tb)/i);
  if (!match) return null;
  const num = parseFloat(match[1]);
  if (!Number.isFinite(num) || num <= 0) return null;
  const isTb = /tb/i.test(match[2]);
  const gb = isTb ? num * 1024 : num;
  const clean = num % 1 === 0 ? String(num) : String(num).replace(/0+$/, "").replace(/\.$/, "");
  return { label: `${clean}${isTb ? "TB" : "GB"}`, gb };
};

const productStorages = (product: Product): string[] => {
  const seen = new Set<string>();
  for (const variant of product.variants ?? []) {
    const normalized = normalizeStorageValue(variant.storage);
    if (normalized) seen.add(normalized.label);
  }
  return Array.from(seen);
};

const modelSortKey = (model: string): number => {
  const match = model.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : Number.MAX_SAFE_INTEGER;
};

const CONDITION_VALUES: ProductCondition[] = ["new", "open_box", "used"];

/** Parse URL query params into StoreCatalogFilters (shared by all store pages). */
export const parseStoreCatalogFilters = (
  query: Record<string, string | string[] | undefined>,
): StoreCatalogFilters => {
  const get = (key: string): string => {
    const value = query[key];
    return Array.isArray(value) ? value[0] ?? "" : value ?? "";
  };
  const list = (key: string): string[] =>
    get(key).split(",").map((v) => v.trim()).filter(Boolean);
  const num = (key: string): number | undefined => {
    const raw = get(key);
    if (raw === "") return undefined;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : undefined;
  };
  return {
    brands: list("brand"),
    models: list("model"),
    storages: list("storage"),
    conditions: list("condition").filter((v): v is ProductCondition =>
      CONDITION_VALUES.includes(v as ProductCondition),
    ),
    accessoryTypes: list("atype").filter((v): v is AccessoryType =>
      (ACCESSORY_TYPES as readonly string[]).includes(v),
    ),
    priceMin: num("pmin"),
    priceMax: num("pmax"),
  };
};

const STORE_SORT_SET = new Set<StoreCatalogSort>(["featured", "newest", "price-asc", "price-desc"]);
const valueOfParam = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? value[0] ?? "" : value ?? "";

export const parseStoreSort = (value: string | string[] | undefined): StoreCatalogSort => {
  const str = valueOfParam(value) as StoreCatalogSort;
  return STORE_SORT_SET.has(str) ? str : "featured";
};

export const parseStorePage = (value: string | string[] | undefined): number => {
  return Math.max(1, Number.parseInt(valueOfParam(value) || "1", 10) || 1);
};

export const ACCESSORY_TYPES = [
  "cases",
  "screen-protectors",
  "chargers",
  "cables",
  "headphones",
  "bluetooth",
  "power-banks",
  "sd-cards",
  "smart-home",
] as const;
export type AccessoryType = (typeof ACCESSORY_TYPES)[number];

const accessorySearchText = (product: Product): string =>
  [product.title, product.subtitle, product.description, product.brand, product.model, ...product.featureBullets]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

/** All accessory-type buckets a product matches (a product can match several). */
export const productAccessoryTypes = (product: Product): AccessoryType[] => {
  if (product.category !== "accessories") return [];
  const text = accessorySearchText(product);
  const types: AccessoryType[] = [];
  if (/\bcase\b|cover|hülle|schutzhülle|handytasche|crossbody/.test(text)) types.push("cases");
  if (/screen protector|displayschutz|panzerglas|schutzfolie|tempered glass/.test(text)) types.push("screen-protectors");
  if (/charger|ladegerät|netzteil|charging adapter|wall adapter/.test(text)) types.push("chargers");
  if (/\bcable\b|\bkabel\b|usb-c kabel|lightning kabel/.test(text)) types.push("cables");
  if (/headphone|kopfhörer|earbud|headset|airpods|over-ear|in-ear/.test(text)) types.push("headphones");
  if (/bluetooth|true wireless|\btws\b/.test(text)) types.push("bluetooth");
  else if (/wireless|kabellos|kabellose/.test(text) && /headphone|kopfhörer|earbud|headset|airpods|speaker|lautsprecher|over-ear|in-ear/.test(text)) types.push("bluetooth");
  if (/powerbank|power bank|externer akku|external battery/.test(text)) types.push("power-banks");
  if (/sd card|sd-karte|microsd|memory card|speicherkarte/.test(text)) types.push("sd-cards");
  if (/smart home|smarthome|homekit|smart plug|smart light|wifi camera/.test(text)) types.push("smart-home");
  return types;
};

export async function getStoreCatalog({
  category = "all",
  collection,
  sort = "featured",
  page = 1,
  pageSize = 24,
  locale = "de",
  filters,
}: {
  category?: StoreCatalogCategory;
  collection?: StoreCatalogCollection;
  sort?: StoreCatalogSort;
  page?: number;
  pageSize?: number;
  locale?: Locale;
  filters?: StoreCatalogFilters;
} = {}): Promise<StoreCatalogResult> {
  const normalizedPageSize = Math.min(48, Math.max(1, Math.floor(pageSize)));

  // The catalog is small (~100 products), so fetch all active products once
  // and do faceting, filtering, sorting and pagination in JS. This gives
  // accurate facet counts and keeps the logic in one place.
  const all = await getProducts(undefined, undefined, locale);

  // Category tab counts (across the whole catalog).
  const counts: Record<StoreCatalogCategory, number> = {
    all: 0,
    smartphones: 0,
    tablets: 0,
    accessories: 0,
    consoles: 0,
    laptops: 0,
    "open-box-smartphones-tablets": 0,
  };
  for (const product of all) {
    counts.all += 1;
    counts[product.category] += 1;
    if ((product.category === "smartphones" || product.category === "tablets") && product.isOpenBox) {
      counts["open-box-smartphones-tablets"] += 1;
    }
  }

  // Scope to the requested category.
  const categoryScoped = category === "all"
    ? all
    : category === "open-box-smartphones-tablets"
      ? all.filter((p) => (p.category === "smartphones" || p.category === "tablets") && p.isOpenBox)
      : all.filter((p) => p.category === category);

  // SEO collection pages are inventory-backed views rather than duplicated
  // product records. Applying the collection scope before building facets
  // keeps counts and filters accurate as products are added or sold.
  const scoped = categoryScoped.filter((product) => {
    if (!collection) return true;
    if (collection === "used-phones") {
      return product.category === "smartphones" && product.condition !== "new";
    }
    if (collection === "used-iphones") {
      return product.category === "smartphones"
        && product.condition !== "new"
        && normalizeProductBrand(product.brand) === "Apple";
    }
    const identity = [product.brand, product.model, product.title]
      .filter(Boolean)
      .join(" ");
    return product.category === "smartphones"
      && normalizeProductBrand(product.brand) === "Apple"
      && /\biphone\s*17\b/i.test(identity);
  });

  // Build facets from the scoped set (before user filters) so the sidebar
  // always shows every available option for the current category.
  const brandCounts = new Map<string, number>();
  const brandDisplay = new Map<string, string>();
  const modelCounts = new Map<string, number>();
  const modelDisplay = new Map<string, string>();
  const storageCounts = new Map<string, { count: number; gb: number }>();
  const conditionCounts = new Map<ProductCondition, number>();
  const accessoryTypeCounts = new Map<AccessoryType, number>();
  let priceMin = Number.POSITIVE_INFINITY;
  let priceMax = 0;

  for (const product of scoped) {
    const brand = normalizeProductBrand(product.brand);
    if (brand) {
      const key = brand.toLowerCase();
      brandCounts.set(key, (brandCounts.get(key) ?? 0) + 1);
      brandDisplay.set(key, bestBrandDisplay(brandDisplay.get(key), brand));
    }
    const model = product.model?.trim();
    if (model) {
      const key = model.toLowerCase();
      modelCounts.set(key, (modelCounts.get(key) ?? 0) + 1);
      if (!modelDisplay.has(key)) modelDisplay.set(key, model);
    }
    for (const storage of productStorages(product)) {
      const normalized = normalizeStorageValue(storage);
      if (!normalized) continue;
      const existing = storageCounts.get(normalized.label);
      storageCounts.set(normalized.label, { count: (existing?.count ?? 0) + 1, gb: normalized.gb });
    }
    conditionCounts.set(product.condition, (conditionCounts.get(product.condition) ?? 0) + 1);
    for (const type of productAccessoryTypes(product)) {
      accessoryTypeCounts.set(type, (accessoryTypeCounts.get(type) ?? 0) + 1);
    }
    priceMin = Math.min(priceMin, product.price);
    priceMax = Math.max(priceMax, product.price);
  }

  if (!Number.isFinite(priceMin)) priceMin = 0;

  const toOptions = (countsMap: Map<string, number>, display: Map<string, string>, sorter: (a: string, b: string) => number): FacetOption[] =>
    Array.from(countsMap.entries())
      .map(([key, count]) => ({ value: display.get(key) ?? key, count }))
      .sort((a, b) => sorter(a.value, b.value));

  const facets: StoreCatalogFacets = {
    brands: toOptions(brandCounts, brandDisplay, (a, b) => a.localeCompare(b, "de")),
    models: toOptions(modelCounts, modelDisplay, (a, b) => modelSortKey(a) - modelSortKey(b) || a.localeCompare(b, "de")),
    storages: Array.from(storageCounts.entries())
      .map(([label, meta]) => ({ value: label, count: meta.count, gb: meta.gb }))
      .sort((a, b) => a.gb - b.gb)
      .map(({ value, count }) => ({ value, count })),
    conditions: (["new", "open_box", "used"] as ProductCondition[])
      .filter((condition) => (conditionCounts.get(condition) ?? 0) > 0)
      .map((condition) => ({ value: condition, count: conditionCounts.get(condition) ?? 0 })),
    accessoryTypes: ACCESSORY_TYPES
      .filter((type) => (accessoryTypeCounts.get(type) ?? 0) > 0)
      .map((type) => ({ value: type, count: accessoryTypeCounts.get(type) ?? 0 })),
    priceMin,
    priceMax,
  };

  // Apply user filters.
  const activeBrands = new Set((filters?.brands ?? []).map((b) => b.toLowerCase()));
  const activeModels = new Set((filters?.models ?? []).map((m) => m.toLowerCase()));
  const activeStorages = new Set(filters?.storages ?? []);
  const activeConditions = new Set(filters?.conditions ?? []);
  const activeAccessoryTypes = new Set(filters?.accessoryTypes ?? []);
  const minPrice = typeof filters?.priceMin === "number" ? filters.priceMin : undefined;
  const maxPrice = typeof filters?.priceMax === "number" ? filters.priceMax : undefined;

  const filtered = scoped.filter((product) => {
    if (activeBrands.size > 0) {
      const brand = normalizeProductBrand(product.brand);
      if (!brand || !activeBrands.has(brand.toLowerCase())) return false;
    }
    if (activeModels.size > 0) {
      const model = product.model?.trim();
      if (!model || !activeModels.has(model.toLowerCase())) return false;
    }
    if (activeStorages.size > 0) {
      const storages = productStorages(product);
      if (!storages.some((s) => activeStorages.has(s))) return false;
    }
    if (activeConditions.size > 0 && !activeConditions.has(product.condition)) return false;
    if (activeAccessoryTypes.size > 0) {
      const types = productAccessoryTypes(product);
      if (!types.some((t) => activeAccessoryTypes.has(t))) return false;
    }
    if (minPrice !== undefined && product.price < minPrice) return false;
    if (maxPrice !== undefined && product.price > maxPrice) return false;
    return true;
  });

  // Sort.
  const sorted = [...filtered];
  if (sort === "price-asc") sorted.sort((a, b) => a.price - b.price);
  else if (sort === "price-desc") sorted.sort((a, b) => b.price - a.price);
  else if (sort === "newest") sorted.sort((a, b) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")));
  else {
    // featured: discounted first, then newest.
    sorted.sort((a, b) => {
      const discount = Number(b.hasDiscount) - Number(a.hasDiscount);
      if (discount !== 0) return discount;
      return String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? ""));
    });
  }

  // Paginate.
  const total = sorted.length;
  const pages = Math.max(1, Math.ceil(total / normalizedPageSize));
  const normalizedPage = Math.min(pages, Math.max(1, Math.floor(page)));
  const from = (normalizedPage - 1) * normalizedPageSize;
  const products = sorted.slice(from, from + normalizedPageSize);

  return { products, total, page: normalizedPage, pages, counts, facets };
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
    .filter((product): product is Product => Boolean(product && (product.stock ?? 0) > 0))
    .map((product) => ({ ...product, isFeatured: true }));
}

export async function getTrendingProducts(locale: Locale = "de", limit = 8): Promise<Product[]> {
  const db = createDbClient();
  const [{ data: settingRow }, products] = await Promise.all([
    db
      .from<{ value: unknown }>("store_settings")
      .select("value")
      .eq("key", "trending_products")
      .maybeSingle(),
    getProducts(undefined, undefined, locale),
  ]);

  const available = products.filter((product) => (product.stock ?? 0) > 0);
  const setting = settingRow?.value && typeof settingRow.value === "object"
    ? settingRow.value as TrendingProductsSetting
    : null;
  const configuredIds = Array.isArray(setting?.productIds)
    ? setting.productIds.filter((id): id is string => typeof id === "string")
    : [];
  const byId = new Map(available.map((product) => [product.id, product] as const));
  const configured = configuredIds
    .map((id) => byId.get(id))
    .filter((product): product is Product => Boolean(product));

  const score = (product: Product) => {
    const text = `${product.title} ${product.model ?? ""}`.toLowerCase();
    let value = 0;
    if (/iphone\s*17/.test(text)) value += 1_000;
    else if (/iphone\s*16/.test(text)) value += 700;
    else if (/iphone\s*15/.test(text)) value += 500;
    if (/pro\s*max/.test(text)) value += 120;
    else if (/\bpro\b/.test(text)) value += 90;
    if (/\bair\b/.test(text)) value += 60;
    if (product.hasDiscount) value += 40;
    value += Math.min(product.stock ?? 0, 10);
    return value;
  };
  const configuredSet = new Set(configured.map((product) => product.id));
  const fallback = available
    .filter((product) => !configuredSet.has(product.id))
    .sort((a, b) => score(b) - score(a) || String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")));

  return [...configured, ...fallback].slice(0, Math.max(1, limit));
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
