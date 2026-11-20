import { query } from "@/lib/db";

/**
 * Data for the owner dashboard ("Heute im Shop"). Read-only, Berlin time.
 *
 * Sales come from the stock ledger (inventory_adjustments): a "sale" from a
 * checkout order counts as online, every other sale (inventory menu, scanner
 * "Verkaufen") as in-store. Online revenue is money actually captured; in-store
 * revenue is estimated from the current list price, and labelled as such.
 */

export type DashboardDay = { date: string; shop: number; online: number };
export type DashboardProductLine = { productId: string; title: string; image: string | null; units: number; value?: number };
export type DashboardActivityItem = {
  id: string;
  kind: "sale_shop" | "sale_online" | "restock" | "product" | "order" | "repair" | "chat";
  title: string;
  /** Raw value behind the line (units, order total, ticket number or message text); the UI phrases it per language. */
  amount: string;
  at: string;
  href: string;
};

export type DashboardOverview = {
  generatedAt: string;
  today: { unitsShop: number; unitsOnline: number; revenueOnline: number; revenueShopEstimate: number; ordersToday: number };
  week: { units: number; previousUnits: number; revenueOnline: number; revenueShopEstimate: number };
  days: DashboardDay[];
  stock: {
    value: number;
    units: number;
    inStockSkus: number;
    soldOutProducts: number;
    lowStock: DashboardProductLine[];
    lowStockCount: number;
    slowMovers: DashboardProductLine[];
    slowMoverCount: number;
    byCategory: Array<{ category: string; value: number; units: number }>;
  };
  topSellers: DashboardProductLine[];
  todo: { ordersToHandle: number; repairsOpen: number; unreadChats: number; failedSyncs: number };
  activity: DashboardActivityItem[];
};

const num = (value: unknown) => Number(value ?? 0) || 0;
const BERLIN_TODAY = "(now() AT TIME ZONE 'Europe/Berlin')::date";
const LOCAL_DAY = "(a.created_at AT TIME ZONE 'Europe/Berlin')::date";
const SHOP_SALE = `((a.event_type = 'sale' AND coalesce(a.reference_type, '') <> 'checkout_order')
  OR (a.event_type = 'adjustment' AND a.quantity_delta < 0 AND a.metadata->>'note' = 'Scanner: verkauft'))`;
const ONLINE_SALE = `(a.event_type = 'sale' AND a.reference_type = 'checkout_order')`;
/** List price of the SKU: variant price when the SKU is a variant, else the product price. */
const UNIT_PRICE = `coalesce((SELECT nullif(v->>'price', '')::numeric FROM jsonb_array_elements(CASE WHEN jsonb_typeof(p.variants) = 'array' THEN p.variants ELSE '[]'::jsonb END) v
  WHERE v->>'sku' = s.sku LIMIT 1), p.price)`;
const LIVE_PRODUCT = `p.import_metadata->>'catalogDeletedAt' IS NULL`;
const firstImage = (images: unknown): string | null =>
  Array.isArray(images) ? (images.find((image) => typeof image === "string" && image.trim()) as string | undefined) ?? null : null;

export async function loadDashboardOverview(): Promise<DashboardOverview> {
  const [sales, revenue, stock, lowStock, slowMovers, categories, top, todo, activity] = await Promise.all([
    // Units and estimated in-store revenue per Berlin day, last 14 days.
    query(
      `SELECT ${LOCAL_DAY} AS day,
              sum(-a.quantity_delta) FILTER (WHERE ${SHOP_SALE})::int AS shop,
              sum(-a.quantity_delta) FILTER (WHERE ${ONLINE_SALE})::int AS online,
              coalesce(sum(-a.quantity_delta * ${UNIT_PRICE}) FILTER (WHERE ${SHOP_SALE}), 0)::float AS shop_value
         FROM inventory_adjustments a
         JOIN inventory_skus s ON s.id = a.inventory_sku_id
         JOIN products p ON p.id = s.product_id
        WHERE a.created_at >= (${BERLIN_TODAY} - 13)::timestamp AT TIME ZONE 'Europe/Berlin'
          AND (${SHOP_SALE} OR ${ONLINE_SALE})
        GROUP BY 1`,
    ),
    query(
      `SELECT coalesce(sum(total_amount) FILTER (WHERE (paid_at AT TIME ZONE 'Europe/Berlin')::date = ${BERLIN_TODAY}), 0)::float AS today,
              coalesce(sum(total_amount) FILTER (WHERE (paid_at AT TIME ZONE 'Europe/Berlin')::date > ${BERLIN_TODAY} - 7), 0)::float AS week,
              count(*) FILTER (WHERE (created_at AT TIME ZONE 'Europe/Berlin')::date = ${BERLIN_TODAY})::int AS orders_today
         FROM orders WHERE payment_status = 'paid' AND status <> 'cancelled'`,
    ),
    query(
      `SELECT coalesce(sum(available_inventory(s.on_hand, s.reserved, s.safety_buffer) * ${UNIT_PRICE}), 0)::float AS value,
              coalesce(sum(available_inventory(s.on_hand, s.reserved, s.safety_buffer)), 0)::int AS units,
              count(*) FILTER (WHERE available_inventory(s.on_hand, s.reserved, s.safety_buffer) > 0)::int AS in_stock_skus,
              (SELECT count(*) FROM products p2 WHERE p2.is_active AND p2.import_metadata->>'catalogDeletedAt' IS NULL AND p2.stock <= 0)::int AS sold_out
         FROM inventory_skus s JOIN products p ON p.id = s.product_id
        WHERE s.location = 'local' AND s.is_active AND ${LIVE_PRODUCT}`,
    ),
    query(
      `SELECT p.id, p.title, p.images, sum(available_inventory(s.on_hand, s.reserved, s.safety_buffer))::int AS units,
              count(*) OVER ()::int AS total
         FROM inventory_skus s JOIN products p ON p.id = s.product_id
        WHERE s.location = 'local' AND s.is_active AND p.is_active AND ${LIVE_PRODUCT} AND p.condition = 'new'
        GROUP BY p.id
       HAVING sum(available_inventory(s.on_hand, s.reserved, s.safety_buffer)) BETWEEN 1 AND 2
        ORDER BY units, max(p.price) DESC LIMIT 6`,
    ),
    // In stock, older than 60 days, no sale in 60 days: candidates for a deal.
    query(
      `SELECT p.id, p.title, p.images, sum(available_inventory(s.on_hand, s.reserved, s.safety_buffer))::int AS units,
              sum(available_inventory(s.on_hand, s.reserved, s.safety_buffer) * ${UNIT_PRICE})::float AS value,
              count(*) OVER ()::int AS total
         FROM inventory_skus s JOIN products p ON p.id = s.product_id
        WHERE s.location = 'local' AND s.is_active AND p.is_active AND ${LIVE_PRODUCT}
          AND p.created_at < now() - interval '60 days'
          AND NOT EXISTS (SELECT 1 FROM inventory_adjustments a JOIN inventory_skus s2 ON s2.id = a.inventory_sku_id
                           WHERE s2.product_id = p.id AND a.created_at > now() - interval '60 days' AND (${SHOP_SALE} OR ${ONLINE_SALE}))
        GROUP BY p.id
       HAVING sum(available_inventory(s.on_hand, s.reserved, s.safety_buffer)) > 0
        ORDER BY value DESC NULLS LAST LIMIT 5`,
    ),
    query(
      `SELECT p.category, coalesce(sum(available_inventory(s.on_hand, s.reserved, s.safety_buffer) * ${UNIT_PRICE}), 0)::float AS value,
              coalesce(sum(available_inventory(s.on_hand, s.reserved, s.safety_buffer)), 0)::int AS units
         FROM inventory_skus s JOIN products p ON p.id = s.product_id
        WHERE s.location = 'local' AND s.is_active AND ${LIVE_PRODUCT}
        GROUP BY p.category HAVING sum(available_inventory(s.on_hand, s.reserved, s.safety_buffer)) > 0
        ORDER BY value DESC`,
    ),
    query(
      `SELECT p.id, p.title, p.images, sum(-a.quantity_delta)::int AS units
         FROM inventory_adjustments a JOIN inventory_skus s ON s.id = a.inventory_sku_id JOIN products p ON p.id = s.product_id
        WHERE a.created_at > now() - interval '30 days' AND (${SHOP_SALE} OR ${ONLINE_SALE}) AND ${LIVE_PRODUCT}
        GROUP BY p.id ORDER BY units DESC, max(a.created_at) DESC LIMIT 5`,
    ),
    query(
      `SELECT
         (SELECT count(*) FROM orders WHERE payment_status = 'paid' AND status NOT IN ('delivered', 'completed', 'cancelled', 'shipped'))::int AS orders,
         (SELECT count(*) FROM repairs WHERE lower(coalesce(status, 'new')) NOT IN ('completed', 'cancelled', 'abgeschlossen', 'storniert', 'picked_up'))::int AS repairs,
         (SELECT coalesce(sum(admin_unread_count), 0) FROM chat_conversations)::int AS chats,
         (SELECT count(*) FROM marketplace_jobs WHERE status = 'failed' AND updated_at > now() - interval '7 days')::int AS failed_syncs`,
    ),
    query(
      `(SELECT 'sale_' || CASE WHEN ${ONLINE_SALE} THEN 'online' ELSE 'shop' END AS kind, a.id::text AS id, p.id::text AS ref, p.title,
               (-a.quantity_delta)::text AS amount, a.created_at
          FROM inventory_adjustments a JOIN inventory_skus s ON s.id = a.inventory_sku_id JOIN products p ON p.id = s.product_id
         WHERE (${SHOP_SALE} OR ${ONLINE_SALE}) ORDER BY a.created_at DESC LIMIT 8)
       UNION ALL
       (SELECT 'restock', a.id::text, p.id::text, p.title, a.quantity_delta::text, a.created_at
          FROM inventory_adjustments a JOIN inventory_skus s ON s.id = a.inventory_sku_id JOIN products p ON p.id = s.product_id
         WHERE a.event_type = 'adjustment' AND a.quantity_delta > 0 AND a.reference_type = 'admin_inventory_adjustment'
         ORDER BY a.created_at DESC LIMIT 4)
       UNION ALL
       (SELECT 'product', p.id::text, p.id::text, p.title, '', p.created_at FROM products p
         WHERE ${LIVE_PRODUCT} ORDER BY p.created_at DESC LIMIT 4)
       UNION ALL
       (SELECT 'order', o.id::text, o.id::text, coalesce(o.customer_name, 'Bestellung'), o.total_amount::text, o.created_at FROM orders o
         WHERE o.payment_status = 'paid' ORDER BY o.created_at DESC LIMIT 4)
       UNION ALL
       (SELECT 'repair', r.id::text, r.id::text, coalesce(r.device_model, 'Reparatur'), coalesce(r.ticket_number::text, ''), r.created_at FROM repairs r
         ORDER BY r.created_at DESC LIMIT 3)
       UNION ALL
       (SELECT 'chat', c.id::text, c.id::text, coalesce(c.customer_name, 'Kunde'), coalesce(c.last_message_preview, ''), coalesce(c.last_message_at, c.created_at)
          FROM chat_conversations c ORDER BY coalesce(c.last_message_at, c.created_at) DESC LIMIT 3)
       ORDER BY created_at DESC LIMIT 14`,
    ),
  ]);

  // 14 Berlin days, oldest first, zero-filled.
  const byDay = new Map((sales.rows as Array<Record<string, unknown>>).map((row) => [String(row.day instanceof Date ? row.day.toISOString().slice(0, 10) : row.day).slice(0, 10), row]));
  const todayBerlin = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin" }).format(new Date());
  const base = new Date(`${todayBerlin}T12:00:00Z`);
  const days: DashboardDay[] = [];
  let shopValueToday = 0, shopValueWeek = 0;
  for (let offset = 13; offset >= 0; offset -= 1) {
    const date = new Date(base.getTime() - offset * 86_400_000).toISOString().slice(0, 10);
    const row = byDay.get(date);
    days.push({ date, shop: num(row?.shop), online: num(row?.online) });
    if (offset === 0) shopValueToday = num(row?.shop_value);
    if (offset < 7) shopValueWeek += num(row?.shop_value);
  }
  const lastWeek = days.slice(7), weekBefore = days.slice(0, 7);
  const sum = (list: DashboardDay[]) => list.reduce((total, day) => total + day.shop + day.online, 0);
  const revenueRow = (revenue.rows[0] ?? {}) as Record<string, unknown>;
  const stockRow = (stock.rows[0] ?? {}) as Record<string, unknown>;
  const todoRow = (todo.rows[0] ?? {}) as Record<string, unknown>;
  const today = days[days.length - 1];
  const line = (row: Record<string, unknown>): DashboardProductLine => ({
    productId: String(row.id), title: String(row.title ?? ""), image: firstImage(row.images), units: num(row.units),
    ...(row.value !== undefined ? { value: num(row.value) } : {}),
  });
  const href = (kind: string, ref: string) => kind === "order" ? `/admin/orders/${ref}` : kind === "repair" ? `/admin/repairs`
    : kind === "chat" ? `/admin/chat` : `/admin/products/${ref}`;

  return {
    generatedAt: new Date().toISOString(),
    today: {
      unitsShop: today.shop,
      unitsOnline: today.online,
      revenueOnline: num(revenueRow.today),
      revenueShopEstimate: shopValueToday,
      ordersToday: num(revenueRow.orders_today),
    },
    week: { units: sum(lastWeek), previousUnits: sum(weekBefore), revenueOnline: num(revenueRow.week), revenueShopEstimate: shopValueWeek },
    days,
    stock: {
      value: num(stockRow.value),
      units: num(stockRow.units),
      inStockSkus: num(stockRow.in_stock_skus),
      soldOutProducts: num(stockRow.sold_out),
      lowStock: (lowStock.rows as Array<Record<string, unknown>>).map(line),
      lowStockCount: num((lowStock.rows[0] as Record<string, unknown> | undefined)?.total),
      slowMovers: (slowMovers.rows as Array<Record<string, unknown>>).map(line),
      slowMoverCount: num((slowMovers.rows[0] as Record<string, unknown> | undefined)?.total),
      byCategory: (categories.rows as Array<Record<string, unknown>>).map((row) => ({ category: String(row.category), value: num(row.value), units: num(row.units) })),
    },
    topSellers: (top.rows as Array<Record<string, unknown>>).map(line),
    todo: { ordersToHandle: num(todoRow.orders), repairsOpen: num(todoRow.repairs), unreadChats: num(todoRow.chats), failedSyncs: num(todoRow.failed_syncs) },
    activity: (activity.rows as Array<Record<string, unknown>>).map((row) => {
      const kind = String(row.kind) as DashboardActivityItem["kind"];
      const amount = kind === "chat" ? String(row.amount ?? "").slice(0, 60) : String(row.amount ?? "");
      return { id: `${kind}:${row.id}`, kind, title: String(row.title ?? ""), amount, at: new Date(String(row.created_at)).toISOString(), href: href(kind, String(row.ref)) };
    }),
  };
}
