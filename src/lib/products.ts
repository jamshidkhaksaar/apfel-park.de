import { createDbClient, query } from "@/lib/db";
import { deviceModelNeedles } from "@/lib/device-model";
import type { Locale } from "@/lib/i18n";
import { resolveProductConditionNote } from "@/lib/product-condition";
import type {
  BatteryDetails,
  MarketplaceCategoryMappings,
  ProductIdentifierStatus,
} from "@/lib/product-channel-readiness";
import { cache } from "react";
import { normalizeStorageValue, parseStorageFilterValues, productStorages } from '@/lib/product-storage';
import { classifyAccessoryTypes, hasExplicitBluetoothEvidence } from '@/lib/product-accessory-types';
import { selectTrendingProducts } from '@/lib/trending-products';

export type ProductCategory = "smartphones" | "tablets" | "accessories" | "consoles" | "laptops";

export type ProductCondition = "new" | "open_box" | "used";

export type ProductSpec = {
  label: string;
  value: string;
  /** Optional group heading (Display / Akku / Kamera …). Specs without a
   *  group render in one unlabelled block, so existing data is unchanged. */
  group?: string;
};

export type ProductVariant = {
  color: string;
  storage: string;
  price?: number;
  compareAtPrice?: number;
  stock?: number;
  sku?: string;
  mpn?: string;
  gtin?: string;
  identifierStatus?: ProductIdentifierStatus;
  asin?: string;
  ebayEpid?: string;
  imageIndex?: number;
  images?: string[];
  isDefault?: boolean;
};

export type Product = {
  googleFeedEnabled?: boolean;
  id: string;
  title: string;
  subtitle: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  category: ProductCategory;
  subcategory?: string;
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
  mpn?: string;
  gtin?: string;
  identifierStatus: ProductIdentifierStatus;
  asin?: string;
  ebayEpid?: string;
  countryOfOrigin?: string;
  packageWeightKg?: number;
  packageLengthCm?: number;
  packageWidthCm?: number;
  packageHeightCm?: number;
  charging?: {
    chargerIncluded?: boolean;
    minimumPowerW?: number;
    maximumPowerW?: number;
    usbPdSupported?: boolean;
  };
  batteryDetails?: BatteryDetails;
  marketplaceCategoryMappings?: MarketplaceCategoryMappings;
  stock?: number;
  slug: string;
  /** Server-side evidence: stock was resolved against active local ledger rows. */
  inventoryVerified?: boolean;
  /** Shared capability evidence, independent of which translation is displayed. */
  bluetoothEvidence?: boolean;
  featureBullets: string[];
  specs: ProductSpec[];
  faq: ProductFaqEntry[];
  variants: ProductVariant[];
  gpsr?: {
    manufacturer?: GpsrParty;
    euResponsible?: GpsrParty;
    safetyWarnings: string[];
    safetyDocuments: string[];
  };
  eprelId?: string;
  energyLabel?: EnergyLabel;
  isFeatured?: boolean;
  discountPercentage?: number;
  hasDiscount: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type ProductFaqEntry = {
  question: string;
  answer: string;
};

// faq is stored as { de: [{q, a}], en: [{q, a}] }; fall back to German when a
// locale has no entries, mirroring how the *_i18n columns behave.
const toFaq = (value: unknown, locale: Locale): ProductFaqEntry[] => {
  if (!value || typeof value !== "object") return [];
  const record = value as Record<string, unknown>;
  const pick = (key: string): ProductFaqEntry[] => {
    const list = record[key];
    if (!Array.isArray(list)) return [];
    return list
      .map((entry) => {
        if (!entry || typeof entry !== "object") return null;
        const candidate = entry as { q?: unknown; a?: unknown };
        const question = typeof candidate.q === "string" ? candidate.q.trim() : "";
        const answer = typeof candidate.a === "string" ? candidate.a.trim() : "";
        if (!question || !answer) return null;
        return { question, answer };
      })
      .filter((entry): entry is ProductFaqEntry => entry !== null);
  };
  const localized = pick(locale);
  return localized.length > 0 ? localized : pick("de");
};

export type EnergyLabel = {
  efficiencyClass?: string;
  batteryEndurance?: string;
  batteryCycles?: number;
  reliabilityClass?: string;
  repairabilityClass?: string;
  ipRating?: string;
  /** Official label artwork, mirrored from EPREL and served from /public. */
  labelImage?: string;
  /** Product information sheet (Produktdatenblatt), mirrored per locale. */
  ficheDe?: string;
  ficheEn?: string;
};

// EU 2023/1669: smartphones/tablets placed on the market since 2025-06-20 must
// show the energy label online. Values are entered in the admin per model.
const toEnergyLabel = (value: unknown): EnergyLabel | undefined => {
  if (!value || typeof value !== "object") return undefined;
  const candidate = value as Record<string, unknown>;
  const str = (input: unknown) => (typeof input === "string" && input.trim() ? input.trim() : undefined);
  const label: EnergyLabel = {
    efficiencyClass: str(candidate.efficiencyClass)?.toUpperCase(),
    batteryEndurance: str(candidate.batteryEndurance),
    batteryCycles:
      typeof candidate.batteryCycles === "number" && Number.isFinite(candidate.batteryCycles)
        ? Math.round(candidate.batteryCycles)
        : undefined,
    reliabilityClass: str(candidate.reliabilityClass)?.toUpperCase(),
    repairabilityClass: str(candidate.repairabilityClass)?.toUpperCase(),
    ipRating: str(candidate.ipRating),
    labelImage: str(candidate.labelImage),
    ficheDe: str(candidate.ficheDe),
    ficheEn: str(candidate.ficheEn),
  };
  return Object.values(label).some((entry) => entry !== undefined) ? label : undefined;
};

export type GpsrParty = {
  name: string;
  address?: string;
  email?: string;
};

// GPSR (EU 2023/988): manufacturer / EU responsible person / warnings must be
// shown to the buyer before purchase. Columns default to {} and '{}' -- treat
// those as absent so the section only renders once real data is entered.
const toGpsrParty = (value: unknown): GpsrParty | undefined => {
  if (!value || typeof value !== "object") return undefined;
  const candidate = value as { name?: unknown; address?: unknown; email?: unknown };
  const name = typeof candidate.name === "string" ? candidate.name.trim() : "";
  if (!name) return undefined;
  return {
    name,
    address: typeof candidate.address === "string" && candidate.address.trim() ? candidate.address.trim() : undefined,
    email: typeof candidate.email === "string" && candidate.email.trim() ? candidate.email.trim() : undefined,
  };
};

type LocalizedText = {
  de?: string | null;
  en?: string | null;
};

type LocalizedSpec = {
  label?: LocalizedText | string | null;
  value?: LocalizedText | string | null;
  group?: LocalizedText | string | null;
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
  import_metadata?: { smartphoneEditor?: {googleSelected?:boolean}; conditionNoteI18n?: LocalizedText | null } | null;
  brand: string | null;
  model: string | null;
  sku: string | null;
  mpn?: string | null;
  gtin?: string | null;
  identifier_status?: ProductIdentifierStatus | null;
  asin?: string | null;
  ebay_epid?: string | null;
  country_of_origin?: string | null;
  package_weight_kg?: number | string | null;
  package_length_cm?: number | string | null;
  package_width_cm?: number | string | null;
  package_height_cm?: number | string | null;
  marketplace_category_mappings?: unknown;
  charger_included?: boolean | null;
  charging_power_min_w?: number | string | null;
  charging_power_max_w?: number | string | null;
  usb_pd_supported?: boolean | null;
  battery_details?: unknown;
  manufacturer?: unknown;
  eu_responsible_person?: unknown;
  safety_warnings?: string[] | null;
  safety_documents?: string[] | null;
  eprel_id?: string | null;
  energy_label?: unknown;
  subcategory?: string | null;
  faq?: unknown;
  updated_at?: string | null;
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
      const group = localizedSpecValue(candidate.group, locale);
      return { label, value: specValue, ...(group ? { group } : {}) };
    })
    .filter((entry): entry is ProductSpec => entry !== null);

  return specs.length > 0 ? specs : toSpecs(fallback);
};

const toSpecs = (value: unknown): ProductSpec[] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const candidate = entry as { label?: unknown; value?: unknown; group?: unknown };
      if (typeof candidate.label !== "string" || typeof candidate.value !== "string") return null;
      const label = candidate.label.trim();
      const specValue = candidate.value.trim();
      if (!label || !specValue) return null;
      const group = typeof candidate.group === "string" ? candidate.group.trim() : "";
      return { label, value: specValue, ...(group ? { group } : {}) };
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
        mpn?: unknown;
        gtin?: unknown;
        identifierStatus?: unknown;
        asin?: unknown;
        ebayEpid?: unknown;
        imageIndex?: unknown;
        images?: unknown;
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
        mpn: typeof candidate.mpn === "string" && candidate.mpn.trim() ? candidate.mpn.trim() : undefined,
        gtin: typeof candidate.gtin === "string" && candidate.gtin.trim() ? candidate.gtin.trim() : undefined,
        identifierStatus:
          candidate.identifierStatus === "assigned" || candidate.identifierStatus === "not_applicable"
            ? candidate.identifierStatus
            : "unknown",
        asin: typeof candidate.asin === "string" && candidate.asin.trim() ? candidate.asin.trim() : undefined,
        ebayEpid: typeof candidate.ebayEpid === "string" && candidate.ebayEpid.trim() ? candidate.ebayEpid.trim() : undefined,
        imageIndex: imageIndex !== undefined ? Math.max(0, Math.floor(imageIndex)) : undefined,
        images: Array.isArray(candidate.images)
          ? candidate.images.filter((image): image is string => typeof image === "string" && Boolean(image.trim())).slice(0, 4)
          : undefined,
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
    bluetoothEvidence: category === 'accessories' ? hasExplicitBluetoothEvidence([
      row.title ?? '', row.description ?? '', ...(row.feature_bullets ?? []),
      ...(['de','en'] as const).flatMap(language => [
        localizedText(row.title_i18n,language,row.title),
        localizedText(row.description_i18n,language,row.description),
        ...localizedStringArray(row.feature_bullets_i18n,language,row.feature_bullets),
        ...toLocalizedSpecs(row.specs_i18n,language,row.specs).map(spec=>`${spec.label}: ${spec.value}`),
      ]),
    ]) : undefined,
    googleFeedEnabled: row.import_metadata?.smartphoneEditor?.googleSelected !== false,
    conditionNote: resolveProductConditionNote(row.import_metadata?.conditionNoteI18n, locale, row.condition_note) || undefined,
    image,
    images: images.length > 0 ? images : [image],
    brand: row.brand ?? undefined,
    model: row.model ?? undefined,
    sku: row.sku ?? undefined,
    mpn: row.mpn?.trim() || undefined,
    gtin: row.gtin?.trim() || undefined,
    identifierStatus: row.identifier_status === "assigned" || row.identifier_status === "not_applicable"
      ? row.identifier_status
      : "unknown",
    asin: row.asin?.trim() || undefined,
    ebayEpid: row.ebay_epid?.trim() || undefined,
    countryOfOrigin: row.country_of_origin?.trim() || undefined,
    packageWeightKg: toNumber(row.package_weight_kg),
    packageLengthCm: toNumber(row.package_length_cm),
    packageWidthCm: toNumber(row.package_width_cm),
    packageHeightCm: toNumber(row.package_height_cm),
    charging:
      row.charger_included != null || row.charging_power_min_w != null || row.charging_power_max_w != null || row.usb_pd_supported != null
        ? {
            chargerIncluded: row.charger_included ?? undefined,
            minimumPowerW: toNumber(row.charging_power_min_w),
            maximumPowerW: toNumber(row.charging_power_max_w),
            usbPdSupported: row.usb_pd_supported ?? undefined,
          }
        : undefined,
    batteryDetails:
      row.battery_details && typeof row.battery_details === "object" && !Array.isArray(row.battery_details)
        ? row.battery_details as BatteryDetails
        : undefined,
    marketplaceCategoryMappings:
      row.marketplace_category_mappings && typeof row.marketplace_category_mappings === "object" && !Array.isArray(row.marketplace_category_mappings)
        ? row.marketplace_category_mappings as MarketplaceCategoryMappings
        : undefined,
    stock: row.stock ?? undefined,
    slug: row.slug,
    featureBullets: localizedStringArray(row.feature_bullets_i18n, locale, row.feature_bullets),
    specs: toLocalizedSpecs(row.specs_i18n, locale, row.specs),
    variants,
    gpsr: (() => {
      const manufacturer = toGpsrParty(row.manufacturer);
      const euResponsible = toGpsrParty(row.eu_responsible_person);
      const safetyWarnings = (row.safety_warnings ?? []).filter(Boolean);
      const safetyDocuments = (row.safety_documents ?? []).filter(Boolean);
      if (!manufacturer && !euResponsible && safetyWarnings.length === 0 && safetyDocuments.length === 0) return undefined;
      return { manufacturer, euResponsible, safetyWarnings, safetyDocuments };
    })(),
    eprelId: row.eprel_id?.trim() || undefined,
    energyLabel: toEnergyLabel(row.energy_label),
    subcategory: row.subcategory ?? undefined,
    faq: toFaq(row.faq, locale),
    discountPercentage,
    hasDiscount: Boolean(discountPercentage),
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
  };
};

const baseSelect =
  "id,title,title_i18n,subtitle,subtitle_i18n,description,description_i18n,price,compare_at_price,category,condition,battery_health,has_real_product_photos,condition_note,import_metadata,brand,model,sku,mpn,gtin,identifier_status,asin,ebay_epid,country_of_origin,package_weight_kg,package_length_cm,package_width_cm,package_height_cm,charger_included,charging_power_min_w,charging_power_max_w,usb_pd_supported,battery_details,marketplace_category_mappings,stock,slug,images,feature_bullets,feature_bullets_i18n,specs,specs_i18n,variants,created_at,manufacturer,eu_responsible_person,safety_warnings,safety_documents,eprel_id,energy_label,subcategory,faq,updated_at";

type ProductInventoryRow = {
  product_id: string;
  sku: string;
  available: number;
};

/** Overlay compatibility stock fields with the authoritative reservation ledger. */
const hydrateProductsWithInventory = async (products: Product[], failOnError = false): Promise<Product[]> => {
  if (products.length === 0) return products;
  try {
    const result = await query(
      `SELECT product_id, sku,
              available_inventory(on_hand, reserved, safety_buffer)::int AS available
         FROM inventory_skus
        WHERE location = 'local' AND is_active = true AND product_id = ANY($1::uuid[])`,
      [products.map((product) => product.id)],
    );
    const rows = result.rows as ProductInventoryRow[];
    const bySku = new Map(rows.map((row) => [row.sku, Number(row.available)] as const));
    const byProduct = new Map<string, number>();
    for (const row of rows) {
      byProduct.set(row.product_id, (byProduct.get(row.product_id) ?? 0) + Number(row.available));
    }

    return products.map((product) => {
      const variants = product.variants.map((variant) => ({
        ...variant,
        stock: variant.sku && bySku.has(variant.sku) ? bySku.get(variant.sku) : variant.stock,
      }));
      const variantStock = variants.length > 0
        ? variants.reduce((sum, variant) => sum + Math.max(0, variant.stock ?? 0), 0)
        : undefined;
      const directStock = product.sku && bySku.has(product.sku) ? bySku.get(product.sku) : undefined;
      const inventoryVerified = variants.length > 0
        ? variants.every(variant => Boolean(variant.sku && bySku.has(variant.sku)))
        : product.sku ? bySku.has(product.sku) : byProduct.has(product.id);
      return {
        ...product,
        variants,
        inventoryVerified,
        stock: variantStock ?? directStock ?? byProduct.get(product.id) ?? product.stock,
      };
    });
  } catch (error) {
    // Rolling deployments briefly run before the new SQL function exists.
    console.error("hydrateProductsWithInventory failed:", error);
    if (failOnError) throw error;
    return products;
  }
};

/** Fetches and request-memoizes the active catalog plus authoritative inventory. */
const getProductsCached = cache(async (
  category: ProductCategory | null,
  limit: number | null,
  locale: Locale,
  failOnError: boolean,
): Promise<Product[]> => {
  const db = createDbClient();

  let productQuery = db
    .from<DbProduct[]>("products")
    .select(baseSelect)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (category) productQuery = productQuery.or(categoryFilters[category]);
  if (limit) productQuery = productQuery.limit(limit);

  const { data, error } = await productQuery;
  if (error || !data) {
    if (failOnError) throw error ?? new Error("Product catalogue query returned no data");
    return [];
  }

  const products = (data as DbProduct[])
    .map((row) => mapProduct(row, locale))
    .filter((item): item is Product => item !== null);
  const hydrated = await hydrateProductsWithInventory(products, failOnError);
  if (!category) return hydrated;
  return hydrated.filter((product) => product.category === category);
});

export const getProducts = (
  category?: ProductCategory,
  limit?: number,
  locale: Locale = "de",
  options: { failOnError?: boolean } = {},
): Promise<Product[]> => getProductsCached(
  category ?? null,
  limit ?? null,
  locale,
  options.failOnError === true,
);

export type StoreCatalogCategory = "all" | ProductCategory | "open-box-smartphones-tablets";
export type StoreCatalogCollection =
  | "iphone-17"
  | "iphone-16-pro-max"
  | "used-phones"
  | "used-iphones"
  | "samsung-phones"
  | "xiaomi-redmi-phones"
  | "phones-without-contract";
export type StoreCatalogSort = "featured" | "price-asc" | "price-desc" | "newest";

export type StoreCatalogFilters = {
  query: string;
  brands: string[];
  storages: string[];
  conditions: ProductCondition[];
  accessoryTypes: string[];
  inStockOnly: boolean;
  priceMin?: number;
  priceMax?: number;
};

export type FacetOption = { value: string; count: number };

export type StoreCatalogScope = {
  category: StoreCatalogCategory;
  subcategory?: string;
  collection?: StoreCatalogCollection;
};

export type StoreCatalogFacets = {
  scope?: StoreCatalogScope;
  brands: FacetOption[];
  storages: FacetOption[];
  conditions: FacetOption[];
  accessoryTypes: FacetOption[];
  inStock: number;
  priceMin: number;
  priceMax: number;
};

export type StoreCatalogResult = {
  accessoryDiscoveryCounts: AccessoryDiscoveryCounts;
  products: Product[];
  total: number;
  page: number;
  pages: number;
  counts: Record<StoreCatalogCategory, number>;
  facets: StoreCatalogFacets;
};

export type AccessoryDiscoveryCounts = { cases:number; audio:number; charging:number; protection:number };

export const accessoryDiscoveryCounts = (products: readonly Product[]): AccessoryDiscoveryCounts => {
  const counts: AccessoryDiscoveryCounts = {cases:0,audio:0,charging:0,protection:0};
  for (const product of products) {
    if (product.category !== 'accessories' || (product.stock ?? 0) <= 0) continue;
    const isCase = productAccessoryTypes(product).includes('cases');
    if (isCase) counts.cases += 1;
    if (product.subcategory === 'audio') counts.audio += 1;
    if (product.subcategory === 'charging') counts.charging += 1;
    if (product.subcategory === 'screen-protection' && !isCase) counts.protection += 1;
  }
  return counts;
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
  if (/^bmw\s*m$/i.test(value)) return "BMW M";
  if (/^bmw$/i.test(value)) return "BMW";
  if (/^audi\s+sport$/i.test(value)) return "Audi Sport";
  if (/^ccit$/i.test(value)) return "CCIT";
  if (/^kxd$/i.test(value)) return "KXD";
  if (/^trusmi$/i.test(value)) return "TRUSMI";
  const lower = value.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
};

export const isXiaomiRedmiPhone = (product: Product): boolean => {
  const brand = normalizeProductBrand(product.brand);
  return product.category === "smartphones"
    && (brand === "Xiaomi" || brand === "Poco");
};

const BRAND_PRIORITY = ["Apple", "Samsung", "Google", "Xiaomi", "Motorola", "Huawei", "Nokia"];

const compareProductBrands = (left: string, right: string): number => {
  const leftPriority = BRAND_PRIORITY.indexOf(left);
  const rightPriority = BRAND_PRIORITY.indexOf(right);
  if (leftPriority !== -1 || rightPriority !== -1) {
    if (leftPriority === -1) return 1;
    if (rightPriority === -1) return -1;
    return leftPriority - rightPriority;
  }
  return left.localeCompare(right, "de");
};

const bestBrandDisplay = (current: string | undefined, next: string): string => {
  if (!current) return next;
  if (current === current.toUpperCase() && next !== next.toUpperCase()) return next;
  return current;
};


export const normalizeCatalogSearchText = (value: string): string =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ß/g, "ss")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

const catalogSearchText = (product: Product): string => normalizeCatalogSearchText([
  product.title,
  product.subtitle,
  product.brand,
  product.model,
  ...product.featureBullets,
  ...product.specs.flatMap((spec) => [spec.label, spec.value]),
  ...product.variants.flatMap((variant) => [variant.color, variant.storage]),
].filter(Boolean).join(" "));

export const catalogSearchScore = (product: Product, rawQuery: string): number => {
  const query = normalizeCatalogSearchText(rawQuery).slice(0, 80);
  if (!query) return 1;
  const haystack = catalogSearchText(product);
  const tokens = query.split(" ").filter(Boolean);
  if (!tokens.every((token) => haystack.includes(token))) return 0;

  const title = normalizeCatalogSearchText(product.title);
  const model = normalizeCatalogSearchText(product.model ?? "");
  const brand = normalizeCatalogSearchText(product.brand ?? "");
  let score = 100 + tokens.length * 10;
  if (title === query) score += 1_000;
  else if (title.startsWith(query)) score += 600;
  else if (title.includes(query)) score += 350;
  if (model === query) score += 500;
  else if (model.includes(query)) score += 180;
  if (brand === query) score += 120;
  const hasAccessoryIntent = /\b(hulle|case|cover|kabel|cable|ladegerat|charger|powerbank|kopfhorer|headphone|panzerglas|displayschutz)\b/.test(query);
  const hasDeviceIntent = /\b(iphone|galaxy|pixel|xiaomi|redmi|smartphone|handy)\b/.test(query) && !hasAccessoryIntent;
  if (hasDeviceIntent) score += product.category === "smartphones" ? 450 : -120;
  if (hasAccessoryIntent) score += product.category === "accessories" ? 450 : -80;
  return score;
};

export const searchCatalogProducts = (products: Product[], rawQuery: string): Product[] =>
  products
    .map((product) => ({ product, score: catalogSearchScore(product, rawQuery) }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => {
      const stock = Number((right.product.stock ?? 0) > 0) - Number((left.product.stock ?? 0) > 0);
      return stock || right.score - left.score || left.product.title.localeCompare(right.product.title, "de");
    })
    .map((entry) => entry.product);

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
  const nonNegativeNumber = (key: string): number | undefined => {
    const raw = get(key);
    if (raw === "") return undefined;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : undefined;
  };
  const rawPriceMin = nonNegativeNumber("pmin");
  const rawPriceMax = nonNegativeNumber("pmax");
  const pricesAreReversed = rawPriceMin !== undefined
    && rawPriceMax !== undefined
    && rawPriceMin > rawPriceMax;

  return {
    query: get("q").trim().slice(0, 80),
    brands: list("brand"),
    storages: parseStorageFilterValues(get('storage')),
    conditions: list("condition").filter((v): v is ProductCondition =>
      CONDITION_VALUES.includes(v as ProductCondition),
    ),
    accessoryTypes: list("atype").filter((v): v is AccessoryType =>
      (ACCESSORY_TYPES as readonly string[]).includes(v),
    ),
    inStockOnly: get("stock") === "available",
    priceMin: pricesAreReversed ? rawPriceMax : rawPriceMin,
    priceMax: pricesAreReversed ? rawPriceMin : rawPriceMax,
  };
};

const STORE_SORT_SET = new Set<StoreCatalogSort>(["featured", "newest", "price-asc", "price-desc"]);
const valueOfParam = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? value[0] ?? "" : value ?? "";

export const parseStoreSort = (value: string | string[] | undefined): StoreCatalogSort => {
  const str = valueOfParam(value) as StoreCatalogSort;
  return STORE_SORT_SET.has(str) ? str : "featured";
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

export const productAccessoryTypes = (product: Product): AccessoryType[] => classifyAccessoryTypes(product);

/**
 * Counts sellable products in an accessory subcategory.
 *
 * Only 160 of 2,902 products are active (the rest are zero-stock drafts), so a
 * landing page can legitimately end up empty. generateMetadata and the sitemap
 * use this to keep empty pages out of the index rather than publishing thin
 * content. It is a COUNT rather than getStoreCatalog because that loads the
 * whole catalog into memory.
 */
export async function countActiveSubcategoryProducts(
  subcategory: string,
  options: { failOnError?: boolean } = {},
): Promise<number> {
  try {
    const result = await query(
      `SELECT count(*)::int AS total FROM products
       WHERE is_active = true AND category = 'accessories' AND subcategory = $1`,
      [subcategory],
    );
    const total = (result.rows[0] as { total?: number } | undefined)?.total;
    if (options.failOnError && (typeof total !== "number" || !Number.isInteger(total) || total < 0)) {
      throw new Error("Subcategory count returned invalid data");
    }
    return total ?? 0;
  } catch (error) {
    if (options.failOnError) throw error;
    console.error("countActiveSubcategoryProducts failed:", error);
    return 0;
  }
}

const getStorefrontMerchandisingIds = async (): Promise<string[]> => {
  try {
    const db = createDbClient();
    const { data } = await db
      .from<{ value: unknown }>("store_settings")
      .select("value")
      .eq("key", "trending_products")
      .maybeSingle();
    if (!data?.value || typeof data.value !== "object") return [];
    const ids = (data.value as { productIds?: unknown }).productIds;
    return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === "string") : [];
  } catch (error) {
    console.error("getStorefrontMerchandisingIds failed:", error);
    return [];
  }
};

/** Disjunctive facets: each group respects every other active filter group. */
export const filterCatalogWithFacets = (
  scoped: readonly Product[],
  filters?: StoreCatalogFilters,
): { filtered: Product[]; facets: StoreCatalogFacets } => {
  type Group = 'brand' | 'storage' | 'condition' | 'type' | 'stock' | 'price';
  const activeBrands = new Set((filters?.brands ?? []).map(value => value.toLowerCase()));
  const activeStorages = new Set((filters?.storages ?? []).map(value=>normalizeStorageValue(value)?.label).filter((value):value is string=>Boolean(value)));
  const activeConditions = new Set(filters?.conditions ?? []);
  const activeTypes = new Set(filters?.accessoryTypes ?? []);
  const brandCounts = new Map<string, number>();
  const brandDisplay = new Map<string, string>();
  const storageCounts = new Map<string, { count: number; gb: number }>();
  const conditionCounts = new Map<ProductCondition, number>();
  const typeCounts = new Map<AccessoryType, number>();
  const filtered: Product[] = [];
  let inStock = 0;
  let priceMin = Number.POSITIVE_INFINITY;
  let priceMax = 0;

  for (const product of scoped) {
    const brand = normalizeProductBrand(product.brand);
    const key = brand?.toLowerCase();
    if (brand && key) brandDisplay.set(key, bestBrandDisplay(brandDisplay.get(key), brand));
    const storages = productStorages(product);
    const availableStorages = productStorages(product, true);
    const storageAvailable = activeStorages.size
      ? availableStorages.some(value=>activeStorages.has(value))
      : (product.stock ?? 0) > 0;
    const types = productAccessoryTypes(product);
    const failed: Group[] = [];
    if (activeBrands.size && (!key || !activeBrands.has(key))) failed.push('brand');
    if (activeStorages.size && !storages.some(value => activeStorages.has(value))) failed.push('storage');
    if (activeConditions.size && !activeConditions.has(product.condition)) failed.push('condition');
    if (activeTypes.size && !types.some(value => activeTypes.has(value))) failed.push('type');
    if (filters?.inStockOnly && !storageAvailable) failed.push('stock');
    if ((filters?.priceMin !== undefined && product.price < filters.priceMin)
      || (filters?.priceMax !== undefined && product.price > filters.priceMax)) failed.push('price');
    if (!failed.length) filtered.push(product);
    const eligible = (group: Group): boolean => failed.every(value => value === group);

    if (key && eligible('brand')) brandCounts.set(key, (brandCounts.get(key) ?? 0) + 1);
    // When counting storage alternatives, ignore the selected capacity as well
    // as its stock failure; show other capacities that are actually available.
    const storageFacetEligible = failed.every(value=>value==='storage'||value==='stock')
      && (!filters?.inStockOnly || (product.stock ?? 0)>0);
    if (storageFacetEligible) for (const value of filters?.inStockOnly ? availableStorages : storages) {
      const storage = normalizeStorageValue(value);
      if (storage) storageCounts.set(storage.label, {count:(storageCounts.get(storage.label)?.count ?? 0) + 1,gb:storage.gb});
    }
    if (eligible('condition')) conditionCounts.set(product.condition, (conditionCounts.get(product.condition) ?? 0) + 1);
    if (eligible('type')) for (const type of types) typeCounts.set(type, (typeCounts.get(type) ?? 0) + 1);
    if (eligible('stock') && storageAvailable) inStock += 1;
    if (eligible('price')) {
      priceMin = Math.min(priceMin, product.price);
      priceMax = Math.max(priceMax, product.price);
    }
  }

  // A selected zero-match value must stay visible so the customer can remove it.
  for (const value of filters?.brands ?? []) {
    const key = value.toLowerCase();
    if (!brandCounts.has(key)) brandCounts.set(key, 0);
    if (!brandDisplay.has(key)) brandDisplay.set(key, normalizeProductBrand(value) ?? value);
  }
  for (const value of activeStorages) {
    const storage = normalizeStorageValue(value);
    if (storage && !storageCounts.has(storage.label)) storageCounts.set(storage.label,{count:0,gb:storage.gb});
  }
  const facets: StoreCatalogFacets = {
    brands: [...brandCounts].map(([key,count]) => ({value:brandDisplay.get(key) ?? key,count})).sort((a,b) => compareProductBrands(a.value,b.value)),
    storages: [...storageCounts].sort((a,b) => a[1].gb-b[1].gb).map(([value,meta]) => ({value,count:meta.count})),
    conditions: (['new','open_box','used'] as ProductCondition[]).filter(value => conditionCounts.has(value) || activeConditions.has(value)).map(value => ({value,count:conditionCounts.get(value) ?? 0})),
    accessoryTypes: ACCESSORY_TYPES.filter(value => typeCounts.has(value) || activeTypes.has(value)).map(value => ({value,count:typeCounts.get(value) ?? 0})),
    inStock,
    priceMin: Number.isFinite(priceMin) ? priceMin : 0,
    priceMax,
  };
  return {filtered,facets};
};

export async function getStoreCatalog({
  category = "all",
  subcategory,
  collection,
  sort = "featured",
  page = 1,
  pageSize = 24,
  locale = "de",
  filters,
  merchandising = "default",
  failOnError = false,
}: {
  category?: StoreCatalogCategory;
  /** Narrows an accessory category to one subcategory landing page. */
  subcategory?: string;
  collection?: StoreCatalogCollection;
  sort?: StoreCatalogSort;
  page?: number;
  pageSize?: number;
  locale?: Locale;
  filters?: StoreCatalogFilters;
  merchandising?: "default" | "storefront";
  failOnError?: boolean;
} = {}): Promise<StoreCatalogResult> {
  const normalizedPageSize = Math.min(48, Math.max(1, Math.floor(pageSize)));

  // The catalog is small (~100 products), so fetch all active products once
  // and do faceting, filtering, sorting and pagination in JS. This gives
  // accurate facet counts and keeps the logic in one place.
  const [all, merchandisingIds] = await Promise.all([
    getProducts(undefined, undefined, locale, { failOnError }),
    merchandising === "storefront" ? getStorefrontMerchandisingIds() : Promise.resolve([]),
  ]);

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

  const subcategoryScoped = subcategory
    ? categoryScoped.filter((product) => product.subcategory === subcategory)
    : categoryScoped;

  // SEO collection pages are inventory-backed views rather than duplicated
  // product records. Applying the collection scope before building facets
  // keeps counts and filters accurate as products are added or sold.
  const collectionScoped = subcategoryScoped.filter((product) => {
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
    if (collection === "samsung-phones") {
      return product.category === "smartphones"
        && normalizeProductBrand(product.brand) === "Samsung";
    }
    if (collection === "xiaomi-redmi-phones") {
      return isXiaomiRedmiPhone(product);
    }
    if (collection === "phones-without-contract") {
      return product.category === "smartphones";
    }
    if (collection === "iphone-16-pro-max") {
      return product.category === "smartphones"
        && normalizeProductBrand(product.brand) === "Apple"
        && /\biphone\s*16\s*pro\s*max\b/i.test(identity);
    }
    return product.category === "smartphones"
      && normalizeProductBrand(product.brand) === "Apple"
      && /\biphone\s*17\b/i.test(identity);
  });
  const searchQuery = filters?.query ?? "";
  const scoped = searchQuery
    ? collectionScoped.filter((product) => catalogSearchScore(product, searchQuery) > 0)
    : collectionScoped;

  const { filtered, facets } = filterCatalogWithFacets(scoped, filters);
  facets.scope = { category, ...(subcategory ? { subcategory } : {}), ...(collection ? { collection } : {}) };

  // Sort.
  const sorted = [...filtered];
  const stockRank = (product: Product) => (product.stock ?? 0) > 0 ? 0 : 1;
  const stockFirst = (left: Product, right: Product, fallback: () => number) =>
    stockRank(left) - stockRank(right) || fallback();
  if (sort === "price-asc") sorted.sort((a, b) => stockFirst(a, b, () => a.price - b.price));
  else if (sort === "price-desc") sorted.sort((a, b) => stockFirst(a, b, () => b.price - a.price));
  else if (sort === "newest") sorted.sort((a, b) => stockFirst(a, b, () => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? ""))));
  else if (searchQuery) {
    sorted.sort((a, b) => stockFirst(a, b, () => catalogSearchScore(b, searchQuery) - catalogSearchScore(a, searchQuery)));
  }
  else if (merchandising === "storefront") {
    const configuredRank = new Map(merchandisingIds.map((id, index) => [id, index] as const));
    const categoryRank: Record<ProductCategory, number> = {
      smartphones: 0,
      tablets: 1,
      accessories: 2,
      laptops: 3,
      consoles: 4,
    };
    sorted.sort((a, b) => stockFirst(a, b, () => {
      const aConfigured = configuredRank.get(a.id);
      const bConfigured = configuredRank.get(b.id);
      if (aConfigured !== undefined || bConfigured !== undefined) {
        if (aConfigured === undefined) return 1;
        if (bConfigured === undefined) return -1;
        return aConfigured - bConfigured;
      }
      return categoryRank[a.category] - categoryRank[b.category]
        || Number(b.hasDiscount) - Number(a.hasDiscount)
        || String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? ""));
    }));
  }
  else {
    // featured: discounted first, then newest.
    sorted.sort((a, b) => {
      return stockFirst(a, b, () => {
        const discount = Number(b.hasDiscount) - Number(a.hasDiscount);
        if (discount !== 0) return discount;
        return String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? ""));
      });
    });
  }

  // Paginate.
  const total = sorted.length;
  const pages = Math.max(1, Math.ceil(total / normalizedPageSize));
  const normalizedPage = Math.min(pages, Math.max(1, Math.floor(page)));
  const from = (normalizedPage - 1) * normalizedPageSize;
  const products = sorted.slice(from, from + normalizedPageSize);

  return { products, total, page: normalizedPage, pages, counts, facets, accessoryDiscoveryCounts: accessoryDiscoveryCounts(collectionScoped) };
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
  try {
    const db = createDbClient();
    const [{ data: settingRow, error }, products] = await Promise.all([
      db.from<{ value: unknown }>('store_settings').select('value').eq('key', 'trending_products').maybeSingle(),
      getProducts(undefined, undefined, locale, { failOnError: true }),
    ]);
    if (error) throw error;
    const setting = settingRow?.value && typeof settingRow.value === 'object'
      ? settingRow.value as TrendingProductsSetting
      : null;
    return selectTrendingProducts(products.filter(product => product.inventoryVerified), setting?.productIds, limit);
  } catch {
    // Optional merchandising must never advertise guessed stock after a failed
    // ledger/settings read. Keep the persisted last-known-good cache untouched.
    console.warn('[store] Trending selection unavailable; carousel hidden.');
    return [];
  }
}

const getProductBySlugCached = cache(async (slug: string, locale: Locale): Promise<Product | null> => {
  const db = createDbClient();
  const { data, error } = await db
    .from<DbProduct>("products")
    .select(baseSelect)
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  if (!data) {
    throw new Error(`Product query returned no data for slug "${slug}"`);
  }
  const mapped = mapProduct(data as DbProduct, locale);
  if (!mapped) {
    throw new Error(`Product query returned an invalid row for slug "${slug}"`);
  }
  const hydrated = (await hydrateProductsWithInventory([mapped]))[0];
  if (!hydrated) {
    throw new Error(`Product inventory hydration lost slug "${slug}"`);
  }
  return hydrated;
});

/**
 * React's cache is scoped to the current server render, so metadata and page
 * rendering share one live inventory lookup without retaining stock between
 * requests.
 */
export const getProductBySlug = (
  slug: string,
  locale: Locale = "de",
): Promise<Product | null> => getProductBySlugCached(slug, locale);

/**
 * Resolve an old product slug to its current one, if the slug was rewritten
 * and recorded in product_slug_history. Returns null when there is no history
 * entry, so the caller can 404.
 */
export async function getCurrentSlugForOldSlug(oldSlug: string): Promise<string | null> {
  const { rows } = await query(
    `SELECT p.slug
     FROM product_slug_history h
     JOIN products p ON p.id = h.product_id
     WHERE h.old_slug = $1
       AND p.is_active = true
     LIMIT 1`,
    [oldSlug],
  );
  return (rows[0] as { slug?: string } | undefined)?.slug ?? null;
}

export async function getRelatedProducts(product: Product, limit = 4, locale: Locale = "de"): Promise<Product[]> {
  // A phone page should sell its accessories (2,820 of 2,902 products are
  // accessories, subcategorised); an accessory page should offer alternatives
  // for the same device. The old implementation returned the first N products
  // of the same category, which put the same four featured accessories on
  // every page and Samsung phones on Apple pages.
  const isDevice = product.category === "smartphones" || product.category === "tablets";
  const needles = deviceModelNeedles(`${product.brand ?? ""} ${product.model ?? ""} ${product.title}`);
  const collected: Product[] = [];
  const seen = new Set<string>([product.id]);

  const push = (rows: unknown[] | null | undefined, max: number) => {
    for (const row of rows ?? []) {
      if (collected.length >= max) break;
      const mapped = mapProduct(row as DbProduct, locale);
      if (!mapped || seen.has(mapped.id)) continue;
      seen.add(mapped.id);
      collected.push(mapped);
    }
  };

  try {
    if (isDevice) {
      if (needles.length > 0) {
        const likeClauses = needles.map((_, index) => `title ILIKE $${index + 1}`).join(" OR ");
        const params: unknown[] = needles.map((needle) => `%${needle}%`);
        // DISTINCT ON (subcategory) gives one case, one glass, one cable --
        // variety instead of four near-identical cases.
        const accessories = await query(
          `SELECT * FROM (
             SELECT DISTINCT ON (subcategory) ${baseSelect}
             FROM products
             WHERE is_active = true AND category = 'accessories' AND (${likeClauses})
             ORDER BY subcategory, (stock > 0) DESC, created_at DESC
           ) matches`,
          params,
        );
        const priority = ["cases-hard", "cases-silicone", "cases-wallet", "cases-clear", "cases-other", "screen-protection", "charging"];
        const rank = (row: DbProduct) => {
          const index = priority.indexOf(row.subcategory ?? "");
          return index === -1 ? priority.length : index;
        };
        const rows = (accessories.rows as DbProduct[]).slice().sort((a, b) => rank(a) - rank(b));
        push(rows, Math.max(limit - 1, 0));
      }
      if (collected.length < limit && product.brand) {
        const siblings = await query(
          `SELECT ${baseSelect} FROM products
           WHERE is_active = true AND stock > 0 AND category = $1 AND lower(brand) = lower($2) AND id <> $3
           ORDER BY abs(price - $4) ASC
           LIMIT $5`,
          [product.category, product.brand, product.id, product.price, limit - collected.length],
        );
        push(siblings.rows as unknown[], limit);
      }
    } else {
      const params: unknown[] = [product.id];
      const needleClause =
        needles.length > 0
          ? needles
              .map((needle) => {
                params.push(`%${needle}%`);
                return `title ILIKE $${params.length}`;
              })
              .join(" OR ")
          : "false";
      params.push(product.subcategory ?? "");
      const subcategoryParam = `$${params.length}`;
      params.push((product.brand ?? "").toLowerCase());
      const brandParam = `$${params.length}`;
      params.push(limit);
      const alternatives = await query(
        `SELECT ${baseSelect},
                (CASE WHEN (${needleClause}) THEN 3 ELSE 0 END +
                 CASE WHEN subcategory = ${subcategoryParam} THEN 2 ELSE 0 END +
                 CASE WHEN lower(brand) = ${brandParam} THEN 1 ELSE 0 END) AS relevance
         FROM products
         WHERE is_active = true AND id <> $1
           AND (subcategory = ${subcategoryParam} OR (${needleClause}) OR lower(brand) = ${brandParam})
         ORDER BY relevance DESC, (stock > 0) DESC, created_at DESC
         LIMIT $${params.length}`,
        params,
      );
      push(alternatives.rows as unknown[], limit);
    }
  } catch (error) {
    console.error("getRelatedProducts query failed:", error);
  }

  if (collected.length < limit) {
    // Two passes: in-stock products first, then on-request ones. Only ~160 of
    // 2,902 products carry stock, so a hard stock filter would leave most
    // pages with an empty recommendation strip.
    const fallback = await getProducts(product.category, undefined, locale);
    for (const requireStock of [true, false]) {
      for (const item of fallback) {
        if (collected.length >= limit) break;
        if (seen.has(item.id)) continue;
        if (requireStock && (item.stock ?? 0) <= 0) continue;
        seen.add(item.id);
        collected.push(item);
      }
    }
  }

  return hydrateProductsWithInventory(collected.slice(0, limit));
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
