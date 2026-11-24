import { getBlackFridaySelection } from "@/lib/black-friday-selection";
import { applyCampaignDiscount, type CampaignDiscount } from "@/lib/campaign-pricing";
import { query } from "@/lib/db";
import type { ProductCategory, ProductCondition } from "@/lib/products";
import { getEffectiveCampaign } from "@/lib/seasonal-theme-server";

/**
 * Stock report for the admin ("Berichte"): every product, or a filtered part of
 * the catalogue, as one printable list grouped by brand. Staff use it to count
 * the store and match it against what the online shop offers, so the shop never
 * sells a device that is not physically there.
 *
 * One row per sellable unit type: a product with variants gets one row per
 * colour/storage variant with that variant's stock, price and photo.
 */

export type StockReportStatus = "active" | "draft" | "all";
export type StockReportStock = "all" | "in_stock" | "sold_out";

export type StockReportFilters = {
  status: StockReportStatus;
  category: ProductCategory | "";
  brands: string[];
  condition: ProductCondition | "";
  stock: StockReportStock;
  search: string;
  images: boolean;
  checkColumn: boolean;
};

export type StockReportRow = {
  productId: string;
  ref: string;
  title: string;
  brand: string;
  model: string;
  category: ProductCategory;
  condition: ProductCondition;
  color: string;
  storage: string;
  price: number;
  salePrice: number | null;
  stock: number;
  image: string | null;
  active: boolean;
};

export type StockReportGroup = {
  brand: string;
  rows: StockReportRow[];
  products: number;
  units: number;
  soldOut: number;
};

export type StockReport = {
  generatedAt: string;
  filters: StockReportFilters;
  groups: StockReportGroup[];
  totals: { products: number; rows: number; units: number; soldOut: number };
  campaignLive: boolean;
};

const CATEGORIES: ProductCategory[] = ["smartphones", "tablets", "accessories", "parts", "consoles", "laptops"];
const CONDITIONS: ProductCondition[] = ["new", "open_box", "used"];
/** Phone brands first, in the order staff count the shelves; the rest alphabetically. */
export const STOCK_REPORT_BRAND_ORDER = ["Apple", "Samsung", "Xiaomi", "POCO", "Google", "OnePlus", "Motorola", "Nothing", "Honor", "KXD"];
export const STOCK_REPORT_MAX_ROWS = 5000;

const first = (value: string | string[] | undefined): string => (Array.isArray(value) ? value[0] ?? "" : value ?? "").trim();
const all = (value: string | string[] | undefined): string[] =>
  (Array.isArray(value) ? value : value ? [value] : []).flatMap((item) => item.split(",")).map((item) => item.trim()).filter(Boolean);

/**
 * On/off options default to on. The form sends a hidden "0" plus the checkbox's
 * "1", so a ticked box arrives as both values: any "1" means on.
 */
const flag = (value: string | string[] | undefined): boolean => {
  const values = all(value);
  return values.length === 0 || values.includes("1");
};

/** Normalises the report's query string; anything unknown falls back to the default. */
export const parseStockReportFilters = (params: Record<string, string | string[] | undefined>): StockReportFilters => {
  const status = first(params.status);
  const category = first(params.category);
  const condition = first(params.condition);
  const stock = first(params.stock);
  return {
    status: status === "draft" || status === "all" ? status : "active",
    category: (CATEGORIES as string[]).includes(category) ? (category as ProductCategory) : "",
    brands: [...new Set(all(params.brand).map((brand) => brand.slice(0, 60)))].slice(0, 60),
    condition: (CONDITIONS as string[]).includes(condition) ? (condition as ProductCondition) : "",
    stock: stock === "in_stock" || stock === "sold_out" ? stock : "all",
    search: first(params.q).slice(0, 80),
    images: flag(params.images),
    checkColumn: flag(params.check),
  };
};

export const stockReportQueryString = (filters: StockReportFilters): string => {
  const params = new URLSearchParams();
  if (filters.status !== "active") params.set("status", filters.status);
  if (filters.category) params.set("category", filters.category);
  for (const brand of filters.brands) params.append("brand", brand);
  if (filters.condition) params.set("condition", filters.condition);
  if (filters.stock !== "all") params.set("stock", filters.stock);
  if (filters.search) params.set("q", filters.search);
  if (!filters.images) params.set("images", "0");
  if (!filters.checkColumn) params.set("check", "0");
  return params.toString();
};

type ProductRecord = {
  id: string;
  title: string | null;
  brand: string | null;
  model: string | null;
  category: string;
  condition: string;
  price: number | string | null;
  stock: number | null;
  is_active: boolean;
  image: string | null;
  variants: unknown;
};

type VariantRecord = { color?: unknown; storage?: unknown; price?: unknown; stock?: unknown; images?: unknown };

const text = (value: unknown): string => (typeof value === "string" ? value.trim() : "");
const number = (value: unknown): number | null => {
  const parsed = typeof value === "number" ? value : typeof value === "string" && value.trim() ? Number(value) : NaN;
  return Number.isFinite(parsed) ? parsed : null;
};
const capitalise = (value: string): string => (value ? value[0].toUpperCase() + value.slice(1) : value);

/** "128GB", "128" and "128 GB" all print as "128 GB"; 1–2 without a unit are terabytes. */
export const formatStorage = (value: string): string => {
  const digits = value.match(/\d+/)?.[0];
  if (!digits) return value;
  const amount = Number(digits);
  const unit = /tb/i.test(value) || (!/gb/i.test(value) && amount <= 2) ? "TB" : "GB";
  return `${amount} ${unit}`;
};

/** Expands products into report rows; pure so the variant and price rules are tested. */
export const buildStockReportRows = (
  products: ProductRecord[],
  discounts: Record<string, CampaignDiscount>,
  campaignLive: boolean,
): StockReportRow[] =>
  products.flatMap((product) => {
    const basePrice = number(product.price) ?? 0;
    const baseStock = Math.max(0, Math.trunc(number(product.stock) ?? 0));
    const discount = campaignLive ? discounts[product.id] : undefined;
    const common = {
      productId: product.id,
      ref: product.id.slice(0, 6).toUpperCase(),
      title: text(product.title),
      brand: text(product.brand) || "Ohne Marke",
      model: text(product.model) || text(product.title),
      category: product.category as ProductCategory,
      condition: product.condition as ProductCondition,
      active: product.is_active,
    };
    const variants = Array.isArray(product.variants) ? (product.variants as VariantRecord[]) : [];
    if (variants.length === 0) {
      return [{
        ...common,
        color: "",
        storage: "",
        price: basePrice,
        salePrice: discount ? applyCampaignDiscount(basePrice, discount) : null,
        stock: baseStock,
        image: product.image,
      }];
    }
    return variants.map((variant) => {
      const price = number(variant.price) ?? basePrice;
      const stock = number(variant.stock);
      const images = Array.isArray(variant.images) ? variant.images.filter((item): item is string => typeof item === "string") : [];
      return {
        ...common,
        color: capitalise(text(variant.color)),
        storage: formatStorage(text(variant.storage)),
        price,
        salePrice: discount ? applyCampaignDiscount(price, discount, basePrice) : null,
        stock: stock === null ? baseStock : Math.max(0, Math.trunc(stock)),
        image: images[0] ?? product.image,
      };
    });
  });

const brandRank = (brand: string): number => {
  const index = STOCK_REPORT_BRAND_ORDER.findIndex((item) => item.toLowerCase() === brand.toLowerCase());
  return index < 0 ? STOCK_REPORT_BRAND_ORDER.length : index;
};

const storageSize = (storage: string): number => {
  const amount = Number(storage.match(/\d+/)?.[0] ?? 0);
  return /tb/i.test(storage) ? amount * 1024 : amount;
};

/** Brand groups (phone brands first), rows sorted by model, storage and colour. */
export const groupStockReport = (rows: StockReportRow[], stockFilter: StockReportStock = "all"): StockReportGroup[] => {
  const visible = rows.filter((row) =>
    stockFilter === "in_stock" ? row.stock > 0 : stockFilter === "sold_out" ? row.stock <= 0 : true);
  const byBrand = new Map<string, StockReportRow[]>();
  for (const row of visible) byBrand.set(row.brand, [...(byBrand.get(row.brand) ?? []), row]);
  return [...byBrand.entries()]
    .sort(([a], [b]) => brandRank(a) - brandRank(b) || a.localeCompare(b, "de"))
    .map(([brand, items]) => {
      const sorted = [...items].sort((a, b) =>
        a.model.localeCompare(b.model, "de", { numeric: true })
        || storageSize(a.storage) - storageSize(b.storage)
        || a.color.localeCompare(b.color, "de"));
      return {
        brand,
        rows: sorted,
        products: new Set(sorted.map((row) => row.productId)).size,
        units: sorted.reduce((sum, row) => sum + row.stock, 0),
        soldOut: sorted.filter((row) => row.stock <= 0).length,
      };
    });
};

const LIVE = "p.import_metadata->>'catalogDeletedAt' IS NULL";

export async function loadStockReport(filters: StockReportFilters): Promise<StockReport> {
  const where = [LIVE];
  const values: unknown[] = [];
  const add = (sql: string, value: unknown) => {
    values.push(value);
    where.push(sql.replace("$?", `$${values.length}`));
  };
  if (filters.status === "active") where.push("p.is_active = true");
  if (filters.status === "draft") where.push("p.is_active = false");
  if (filters.category) add("p.category = $?", filters.category);
  if (filters.condition) add("p.condition = $?", filters.condition);
  if (filters.brands.length > 0) add("lower(coalesce(nullif(trim(p.brand), ''), 'Ohne Marke')) = ANY($?::text[])", filters.brands.map((brand) => brand.toLowerCase()));
  if (filters.search) {
    values.push(`%${filters.search}%`);
    const index = values.length;
    where.push(`(p.title ILIKE $${index} OR p.model ILIKE $${index} OR p.sku ILIKE $${index})`);
  }

  const [result, campaign, selection] = await Promise.all([
    query(
      `SELECT p.id::text AS id, p.title, p.brand, p.model, p.category, p.condition, p.price, p.stock, p.is_active,
              p.images[1] AS image, p.variants
         FROM products p
        WHERE ${where.join(" AND ")}
        ORDER BY p.brand, p.title
        LIMIT ${STOCK_REPORT_MAX_ROWS}`,
      values,
    ),
    getEffectiveCampaign(),
    getBlackFridaySelection(),
  ]);
  const campaignLive = Boolean(campaign.theme) && campaign.phase === "live";
  const rows = buildStockReportRows(result.rows as ProductRecord[], selection.discounts, campaignLive);
  const groups = groupStockReport(rows, filters.stock);
  return {
    generatedAt: new Date().toISOString(),
    filters,
    groups,
    campaignLive,
    totals: {
      products: groups.reduce((sum, group) => sum + group.products, 0),
      rows: groups.reduce((sum, group) => sum + group.rows.length, 0),
      units: groups.reduce((sum, group) => sum + group.units, 0),
      soldOut: groups.reduce((sum, group) => sum + group.soldOut, 0),
    },
  };
}

export type StockReportBrandOption = { brand: string; active: number; drafts: number };

/** Brands with their active and draft counts, for the filter form. */
export async function loadStockReportBrands(): Promise<StockReportBrandOption[]> {
  const result = await query(
    `SELECT coalesce(nullif(trim(p.brand), ''), 'Ohne Marke') AS brand,
            count(*) FILTER (WHERE p.is_active)::int AS active,
            count(*) FILTER (WHERE NOT p.is_active)::int AS drafts
       FROM products p
      WHERE ${LIVE}
      GROUP BY 1`,
  );
  return (result.rows as StockReportBrandOption[])
    .sort((a, b) => brandRank(a.brand) - brandRank(b.brand) || (b.active + b.drafts) - (a.active + a.drafts));
}
