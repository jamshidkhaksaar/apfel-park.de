import { query } from "@/lib/db";
import { inventoryProductDetails } from "@/lib/inventory-product-details";

/**
 * Grouped admin catalog: one card per model, one row per sellable variant.
 *
 * The shop often holds the same model as several products (one per colour,
 * storage or condition, sometimes even duplicates). Staff want to see them
 * together and change stock and price in place. Nothing is merged in the
 * database: products are grouped by their automatic model family, or by brand
 * + model when they have none.
 */

export type QuickEditRow = {
  /** Stable React key */
  key: string;
  productId: string;
  /** SKU the stock ledger and the price endpoint use; null when not set up. */
  sku: string | null;
  color: string;
  storage: string;
  condition: string;
  price: number;
  /** Available units from the stock ledger (falls back to products.stock). */
  stock: number;
  /** True when the row has a ledger SKU, i.e. stock can be adjusted here. */
  ledger: boolean;
  /** Product title, shown when a card holds differently named products. */
  title: string;
  /** The first row of a product carries the product-level controls. */
  firstOfProduct: boolean;
  variantCount: number;
};

export type QuickEditProduct = {
  id: string;
  title: string;
  brand: string | null;
  model: string | null;
  category: string;
  condition: string;
  price: number;
  isActive: boolean;
  /** False when the product was taken out of the shop in the inventory menu. */
  catalogEnabled: boolean;
  image: string | null;
  /** Colour/storage of the product itself (specs, import data or title). */
  color: string;
  storage: string;
};

export type QuickEditGroup = {
  key: string;
  name: string;
  brand: string | null;
  category: string;
  image: string | null;
  images: string[];
  products: QuickEditProduct[];
  rows: QuickEditRow[];
  totalStock: number;
  minPrice: number;
  maxPrice: number;
};

type Row = {
  id: string;
  title: string;
  brand: string | null;
  model: string | null;
  sku: string | null;
  category: string;
  condition: string | null;
  price: string | number;
  stock: number | null;
  is_active: boolean | null;
  catalog_enabled: boolean | null;
  images: string[] | null;
  variants: unknown;
  specs: unknown;
  import_metadata: unknown;
  family_id: string | null;
  family_name: string | null;
  option_values: { color?: unknown; storage?: unknown } | null;
  group_key: string;
};

type LedgerRow = { sku: string; available: number };

const text = (value: unknown): string => (typeof value === "string" ? value.trim() : "");
const num = (value: unknown): number | undefined => {
  const n = typeof value === "string" ? Number(value.replace(",", ".")) : typeof value === "number" ? value : NaN;
  return Number.isFinite(n) ? n : undefined;
};

/**
 * Group key: brand + model name, taken from the automatic model family when
 * the product has one, else the model field (or the title). Case-insensitive
 * and without a leading brand name, so a family member and a stray product of
 * the same model land in one card.
 */
export const GROUP_KEY_SQL = String.raw`'m:' || lower(coalesce(products.brand, '')) || '|' ||
  lower(regexp_replace(btrim(coalesce(family.name, nullif(btrim(products.model), ''), products.title)), '^(apple|samsung|xiaomi|google|huawei)\s+', '', 'i'))`;

const FAMILY_JOIN = `LEFT JOIN LATERAL (
    SELECT f.id, f.name, m.option_values
      FROM product_family_members m JOIN product_families f ON f.id = m.family_id
     WHERE m.product_id = products.id AND m.is_active AND f.is_active AND f.smartphone_model_key IS NOT NULL
     LIMIT 1
  ) family ON true`;

/** Builds the rows for one group from its products and the stock ledger. */
export const buildQuickEditGroup = (key: string, products: Row[], ledger: Map<string, number>): QuickEditGroup => {
  const rows: QuickEditRow[] = [];
  for (const product of products) {
    const condition = product.condition ?? "new";
    const variants = Array.isArray(product.variants)
      ? (product.variants as Array<Record<string, unknown>>).filter((variant) => variant && typeof variant === "object")
      : [];
    // Older products keep colour and storage in their specs ("Farbe",
    // "Speicher"), the import data or the title; the list shows those too.
    const details = inventoryProductDetails({ ...product, variants: [] } as unknown as Record<string, unknown>, "de", "product");
    const familyColor = text(product.option_values?.color) || details.color || "";
    const familyStorage = text(product.option_values?.storage).replace(/^(\d+)$/, "$1 GB") || details.storage || "";
    if (variants.length > 0) {
      variants.forEach((variant, index) => {
        const sku = text(variant.sku) || null;
        const known = sku !== null && ledger.has(sku);
        rows.push({
          key: `${product.id}:${sku ?? index}`,
          productId: product.id,
          sku,
          color: text(variant.color) || familyColor,
          storage: text(variant.storage) || familyStorage,
          condition,
          title: product.title,
          price: num(variant.price) ?? Number(product.price),
          stock: known ? ledger.get(sku!)! : Math.max(0, num(variant.stock) ?? 0),
          ledger: known,
          firstOfProduct: index === 0,
          variantCount: variants.length,
        });
      });
    } else {
      const sku = text(product.sku) || null;
      const known = sku !== null && ledger.has(sku);
      rows.push({
        key: `${product.id}:base`,
        productId: product.id,
        sku,
        color: familyColor,
        storage: familyStorage,
        condition,
        title: product.title,
        price: Number(product.price),
        stock: known ? ledger.get(sku!)! : Math.max(0, Number(product.stock ?? 0)),
        ledger: known,
        firstOfProduct: true,
        variantCount: 1,
      });
    }
  }
  const prices = rows.map((row) => row.price).filter((price) => price > 0);
  const images = [...new Set(products.flatMap((product) => (product.images ?? []).filter(Boolean)))];
  const first = products[0];
  return {
    key,
    name: first.family_name || first.title,
    brand: first.brand,
    category: first.category,
    image: images[0] ?? null,
    images: images.slice(0, 6),
    products: products.map((product) => {
      const details = inventoryProductDetails({ ...product, variants: [] } as unknown as Record<string, unknown>, "de", "product");
      return {
        id: product.id,
        title: product.title,
        brand: product.brand,
        model: product.model,
        category: product.category,
        condition: product.condition ?? "new",
        price: Number(product.price),
        isActive: Boolean(product.is_active),
        catalogEnabled: product.catalog_enabled !== false,
        image: product.images?.[0] ?? null,
        color: text(product.option_values?.color) || details.color || "",
        storage: text(product.option_values?.storage).replace(/^(\d+)$/, "$1 GB") || details.storage || "",
      };
    }),
    rows,
    totalStock: rows.reduce((sum, row) => sum + row.stock, 0),
    minPrice: prices.length ? Math.min(...prices) : 0,
    maxPrice: prices.length ? Math.max(...prices) : 0,
  };
};

/**
 * Loads one page of groups for the admin product list. `where`/`values` are
 * the list's own filter clause (columns of `products`), `orderBy` its sort.
 */
export async function loadGroupedCatalog({
  where,
  values,
  orderBy,
  page,
  pageSize,
}: {
  where: string;
  values: unknown[];
  orderBy: string;
  page: number;
  pageSize: number;
}): Promise<{ groups: QuickEditGroup[]; totalGroups: number; pages: number; page: number }> {
  // 1) Every matching product's group, in list order (light query).
  const keyed = await query(
    `SELECT products.id, ${GROUP_KEY_SQL} AS group_key
       FROM products ${FAMILY_JOIN}
       ${where}
      ORDER BY ${orderBy}`,
    values,
  );
  const order: string[] = [];
  const members = new Map<string, string[]>();
  for (const row of keyed.rows as Array<{ id: string; group_key: string }>) {
    if (!members.has(row.group_key)) {
      members.set(row.group_key, []);
      order.push(row.group_key);
    }
    members.get(row.group_key)!.push(row.id);
  }
  const totalGroups = order.length;
  const pages = Math.max(1, Math.ceil(totalGroups / pageSize));
  const current = Math.min(Math.max(1, page), pages);
  const pageKeys = order.slice((current - 1) * pageSize, current * pageSize);
  const ids = pageKeys.flatMap((key) => members.get(key) ?? []);
  if (ids.length === 0) return { groups: [], totalGroups, pages, page: current };

  // 2) Full rows for this page's products, plus their ledger stock.
  const [rows, ledger] = await Promise.all([
    query(
      `SELECT products.id, products.title, products.brand, products.model, products.sku, products.category,
              products.condition, products.price, products.stock, products.is_active, products.catalog_enabled,
              products.images, products.variants, products.specs, products.import_metadata, family.id AS family_id, family.name AS family_name, family.option_values,
              ${GROUP_KEY_SQL} AS group_key
         FROM products ${FAMILY_JOIN}
        WHERE products.id = ANY($1::uuid[])
        ORDER BY products.condition, products.price, products.title`,
      [ids],
    ),
    query(
      `SELECT sku, available_inventory(on_hand, reserved, safety_buffer)::int AS available
         FROM inventory_skus
        WHERE location = 'local' AND is_active = true AND product_id = ANY($1::uuid[])`,
      [ids],
    ),
  ]);
  const stock = new Map((ledger.rows as LedgerRow[]).map((row) => [row.sku, Number(row.available)] as const));
  const byGroup = new Map<string, Row[]>();
  for (const row of rows.rows as Row[]) {
    const list = byGroup.get(row.group_key) ?? [];
    list.push(row);
    byGroup.set(row.group_key, list);
  }
  const groups = pageKeys
    .map((key) => byGroup.get(key))
    .filter((list): list is Row[] => Boolean(list?.length))
    .map((list) => buildQuickEditGroup(list[0].group_key, list, stock));
  return { groups, totalGroups, pages, page: current };
}
