import Link from "next/link";

import { query } from "@/lib/db";
import { getAdminDictionary, getAdminNumberLocale } from "@/lib/admin-i18n-server";
import type { AdminDictionary } from "@/lib/admin-i18n";
import AdminShell from "../../../components/admin/AdminShell";
import { updateOrderFulfillment } from "./actions";

export const dynamic = "force-dynamic";

type OrderRow = {
  id: string;
  order_number: number | null;
  customer_name: string | null;
  customer_email: string | null;
  status: string | null;
  payment_status: string | null;
  provider: string | null;
  shipping_method: string | null;
  created_at: string | null;
  total_amount: number | string;
  currency: string | null;
  items: unknown;
  tracking_id: string | null;
};

type SalesTotals = {
  paid_orders: string;
  revenue: string;
  units_sold: string;
  pending_orders: string;
};

type TopProduct = {
  title: string | null;
  sku: string | null;
  qty: string;
  revenue: string;
};

const STATUS_OPTIONS = ["pending", "paid", "shipped", "delivered", "cancelled"] as const;

const formatStatus = (status: string | null, dict: AdminDictionary): string => {
  if (!status) return dict.ordersPage.status.unknown;
  const normalized = status.toLowerCase().trim();
  if (normalized === "pending" || normalized === "ausstehend" || normalized === "neu") {
    return dict.ordersPage.status.pending;
  }
  if (normalized === "paid" || normalized === "bezahlt") return dict.ordersPage.status.paid;
  if (normalized === "shipped" || normalized === "versendet") return dict.ordersPage.status.shipped;
  if (normalized === "delivered" || normalized === "abgeschlossen") {
    return dict.ordersPage.status.delivered;
  }
  if (normalized === "cancelled" || normalized === "storniert") {
    return dict.ordersPage.status.cancelled;
  }
  return status;
};

const countItems = (items: unknown): number => {
  if (!Array.isArray(items)) return 0;
  return items.reduce((sum, item) => {
    const quantity = Number((item as { quantity?: unknown })?.quantity);
    return sum + (Number.isFinite(quantity) ? quantity : 0);
  }, 0);
};

async function fetchOrders(search: string): Promise<OrderRow[]> {
  const baseSelect = `
    SELECT id, order_number, customer_name, customer_email, status, payment_status, provider,
           shipping_method, created_at, total_amount, currency, items,
           metadata->>'trackingId' AS tracking_id
    FROM orders`;

  if (!search) {
    const result = await query(`${baseSelect} ORDER BY created_at DESC LIMIT 100`);
    return result.rows as OrderRow[];
  }

  const pattern = `%${search}%`;
  const numeric = /^#?A?-?(\d+)$/i.exec(search.trim());
  const parsedNumber = numeric ? Number(numeric[1]) : null;
  const orderNumber = parsedNumber !== null && parsedNumber <= 2147483647 ? parsedNumber : null;
  const result = await query(
    `${baseSelect}
     WHERE customer_name ILIKE $1
        OR customer_email ILIKE $1
        OR metadata->>'trackingId' ILIKE $1
        OR ($2::int IS NOT NULL AND order_number = $2::int)
     ORDER BY created_at DESC
     LIMIT 100`,
    [pattern, orderNumber],
  );
  return result.rows as OrderRow[];
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; updated?: string; error?: string }>;
}) {
  const params = await searchParams;
  const search = (params.q ?? "").trim().slice(0, 120);
  const dict = await getAdminDictionary();
  const numberLocale = await getAdminNumberLocale();

  const [orders, totalsResult, topProductsResult] = await Promise.all([
    fetchOrders(search),
    query(
      `SELECT
         count(*) FILTER (WHERE payment_status = 'paid') AS paid_orders,
         COALESCE(sum(total_amount) FILTER (WHERE payment_status = 'paid'), 0) AS revenue,
         COALESCE((
           SELECT sum((item->>'quantity')::int)
           FROM orders o, jsonb_array_elements(o.items) item
           WHERE o.payment_status = 'paid'
         ), 0) AS units_sold,
         count(*) FILTER (WHERE payment_status = 'unpaid' AND status = 'pending') AS pending_orders
       FROM orders`,
    ),
    query(
      `SELECT item->>'title' AS title,
              item->>'sku' AS sku,
              sum((item->>'quantity')::int) AS qty,
              sum((item->>'lineAmount')::numeric) AS revenue
       FROM orders o, jsonb_array_elements(o.items) item
       WHERE o.payment_status = 'paid'
       GROUP BY 1, 2
       ORDER BY qty DESC, revenue DESC
       LIMIT 8`,
    ),
  ]);

  const totals = (totalsResult.rows[0] ?? {
    paid_orders: "0",
    revenue: "0",
    units_sold: "0",
    pending_orders: "0",
  }) as SalesTotals;
  const topProducts = topProductsResult.rows as TopProduct[];

  const currencyFormat = new Intl.NumberFormat(numberLocale, { style: "currency", currency: "EUR" });
  const dateFormat = new Intl.DateTimeFormat(numberLocale, { dateStyle: "medium", timeStyle: "short" });

  const statCards = [
    { label: dict.ordersPage.stats.revenue, value: currencyFormat.format(Number(totals.revenue)) },
    { label: dict.ordersPage.stats.paidOrders, value: String(totals.paid_orders) },
    { label: dict.ordersPage.stats.unitsSold, value: String(totals.units_sold) },
    { label: dict.ordersPage.stats.pendingOrders, value: String(totals.pending_orders) },
  ];

  return (
    <AdminShell title={dict.ordersPage.title}>
      {params.updated ? (
        <div className="mb-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600">
          {dict.ordersPage.saved}
        </div>
      ) : null}
      {params.error ? (
        <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-600">
          {dict.ordersPage.saveError}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.label} className="glass-panel rounded-2xl p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 glass-panel rounded-2xl p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          {dict.ordersPage.stats.topProducts}
        </p>
        <div className="mt-4 overflow-hidden rounded-xl border border-border/60">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-strong/60 text-xs uppercase tracking-[0.2em] text-muted">
              <tr>
                <th className="px-4 py-3">{dict.ordersPage.stats.product}</th>
                <th className="px-4 py-3">{dict.ordersPage.detail.sku}</th>
                <th className="px-4 py-3 text-right">{dict.ordersPage.stats.quantity}</th>
                <th className="px-4 py-3 text-right">{dict.ordersPage.stats.sales}</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.length > 0 ? (
                topProducts.map((product, index) => (
                  <tr key={`${product.sku ?? product.title ?? index}`} className="border-t border-border/50">
                    <td className="px-4 py-3 font-medium text-foreground">{product.title ?? "-"}</td>
                    <td className="px-4 py-3 text-muted">{product.sku ?? "-"}</td>
                    <td className="px-4 py-3 text-right text-muted">{product.qty}</td>
                    <td className="px-4 py-3 text-right text-muted">
                      {currencyFormat.format(Number(product.revenue))}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted">
                    {dict.ordersPage.stats.noSales}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 glass-panel rounded-2xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
              {dict.ordersPage.eyebrow}
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">
              {dict.ordersPage.heading}
            </h2>
          </div>
          <Link
            href="/api/admin/orders/export"
            className="rounded-full border border-border/60 px-6 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-muted"
          >
            {dict.ordersPage.export}
          </Link>
        </div>

        <form method="get" className="mt-6 flex flex-wrap items-center gap-3">
          <input
            type="search"
            name="q"
            defaultValue={search}
            placeholder={dict.ordersPage.search.placeholder}
            className="w-full max-w-md rounded-full border border-border/60 bg-surface-strong/40 px-5 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-full bg-foreground px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.25em] text-background"
          >
            {dict.ordersPage.search.button}
          </button>
          {search ? (
            <Link
              href="/admin/orders"
              className="text-xs font-semibold uppercase tracking-[0.25em] text-muted underline-offset-4 hover:underline"
            >
              {dict.ordersPage.search.clear}
            </Link>
          ) : null}
        </form>

        <div className="mt-6 overflow-x-auto rounded-xl border border-border/60">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-strong/60 text-xs uppercase tracking-[0.2em] text-muted">
              <tr>
                <th className="px-4 py-3">{dict.ordersPage.table.order}</th>
                <th className="px-4 py-3">{dict.ordersPage.table.date}</th>
                <th className="px-4 py-3">{dict.ordersPage.table.customer}</th>
                <th className="px-4 py-3">{dict.ordersPage.table.items}</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">{dict.ordersPage.table.tracking}</th>
                <th className="px-4 py-3">{dict.ordersPage.table.total}</th>
                <th className="px-4 py-3">{dict.ordersPage.table.status}</th>
              </tr>
            </thead>
            <tbody>
              {orders.length > 0 ? (
                orders.map((order) => (
                  <tr key={order.id} className="border-t border-border/50 transition hover:bg-surface-strong/40">
                    <td className="px-4 py-3 font-semibold text-foreground">
                      <Link href={`/admin/orders/${order.id}`} className="underline-offset-4 hover:underline">
                        {order.order_number ? `#A-${order.order_number}` : `#${order.id.slice(0, 8)}`}
                      </Link>
                      <div className="text-xs font-normal text-muted">{order.shipping_method ?? "-"}</div>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {order.created_at ? dateFormat.format(new Date(order.created_at)) : "-"}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      <div>{order.customer_name ?? "-"}</div>
                      {order.customer_email ? <div className="text-xs">{order.customer_email}</div> : null}
                    </td>
                    <td className="px-4 py-3 text-muted">{countItems(order.items) || "-"}</td>
                    <td className="px-4 py-3 text-muted">
                      <div>{order.payment_status ?? "-"}</div>
                      <div className="text-xs">{order.provider ?? "-"}</div>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {order.tracking_id ? <span className="break-all text-xs">{order.tracking_id}</span> : "-"}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {(() => {
                        const amount = Number(order.total_amount);
                        if (!Number.isFinite(amount)) {
                          return "-";
                        }

                        return new Intl.NumberFormat(numberLocale, {
                          style: "currency",
                          currency: order.currency || "EUR",
                        }).format(amount);
                      })()}
                    </td>
                    <td className="px-4 py-3">
                      <form action={updateOrderFulfillment} className="flex items-center gap-2">
                        <input type="hidden" name="id" value={order.id} />
                        <select
                          name="status"
                          defaultValue={order.status ?? "pending"}
                          className="rounded-lg border border-border/60 bg-surface-strong/40 px-2 py-1.5 text-xs text-foreground focus:outline-none"
                        >
                          {STATUS_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {formatStatus(option, dict)}
                            </option>
                          ))}
                        </select>
                        <button
                          type="submit"
                          className="rounded-lg border border-border/60 px-2.5 py-1.5 text-xs font-semibold text-foreground"
                          title={dict.ordersPage.detail.save}
                        >
                          &#10003;
                        </button>
                      </form>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted">
                    {dict.ordersPage.empty}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
