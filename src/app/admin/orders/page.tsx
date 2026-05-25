import { createAdminServerClient } from "@/lib/admin-auth-server";
import Link from "next/link";
import { getAdminDictionary, getAdminNumberLocale } from "@/lib/admin-i18n-server";
import type { AdminDictionary } from "@/lib/admin-i18n";
import AdminShell from "../../../components/admin/AdminShell";

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
  paid_at: string | null;
  total_amount: number | string;
  currency: string | null;
};

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

export default async function OrdersPage() {
  const adminClient = await createAdminServerClient();
  const dict = await getAdminDictionary();
  const numberLocale = await getAdminNumberLocale();
  const { data } = await adminClient
    .from("orders")
    .select("id,order_number,customer_name,customer_email,status,payment_status,provider,shipping_method,paid_at,total_amount,currency")
    .order("created_at", { ascending: false })
    .limit(100);

  const orders = (data ?? []) as OrderRow[];

  return (
    <AdminShell title={dict.ordersPage.title}>
      <div className="glass-panel rounded-2xl p-6">
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
        <div className="mt-6 overflow-hidden rounded-xl border border-border/60">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-strong/60 text-xs uppercase tracking-[0.2em] text-muted">
              <tr>
                <th className="px-4 py-3">{dict.ordersPage.table.order}</th>
                <th className="px-4 py-3">{dict.ordersPage.table.customer}</th>
                <th className="px-4 py-3">{dict.ordersPage.table.status}</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Fulfillment</th>
                <th className="px-4 py-3">{dict.ordersPage.table.total}</th>
              </tr>
            </thead>
            <tbody>
              {orders.length > 0 ? (
                orders.map((order) => (
                  <tr key={order.id} className="border-t border-border/50">
                    <td className="px-4 py-3 font-semibold text-foreground">
                      {order.order_number ? `#A-${order.order_number}` : `#${order.id.slice(0, 8)}`}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      <div>{order.customer_name ?? "-"}</div>
                      {order.customer_email ? <div className="text-xs">{order.customer_email}</div> : null}
                    </td>
                    <td className="px-4 py-3 text-muted">{formatStatus(order.status, dict)}</td>
                    <td className="px-4 py-3 text-muted">
                      <div>{order.payment_status ?? "-"}</div>
                      <div className="text-xs">{order.provider ?? "-"}</div>
                    </td>
                    <td className="px-4 py-3 text-muted">{order.shipping_method ?? "-"}</td>
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
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted">
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
