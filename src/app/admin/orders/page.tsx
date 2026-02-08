import { createClient } from "@/lib/supabase/server";
import AdminShell from "../../../components/admin/AdminShell";

export const dynamic = "force-dynamic";

type OrderRow = {
  id: string;
  order_number: number | null;
  customer_name: string | null;
  status: string | null;
  total_amount: number | string;
};

const formatStatus = (status: string | null): string => {
  if (!status) return "Unbekannt";
  if (status === "pending") return "Ausstehend";
  if (status === "paid") return "Bezahlt";
  if (status === "shipped") return "Versendet";
  if (status === "delivered") return "Abgeschlossen";
  if (status === "cancelled") return "Storniert";
  return status;
};

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("id,order_number,customer_name,status,total_amount")
    .order("created_at", { ascending: false })
    .limit(100);

  const orders = (data ?? []) as OrderRow[];

  return (
    <AdminShell title="Bestellungen">
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
              Online-Bestellungen
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">
              Status & Fulfillment
            </h2>
          </div>
          <button className="rounded-full border border-border/60 px-6 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-muted">
            Exportieren
          </button>
        </div>
        <div className="mt-6 overflow-hidden rounded-xl border border-border/60">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-strong/60 text-xs uppercase tracking-[0.2em] text-muted">
              <tr>
                <th className="px-4 py-3">Bestellung</th>
                <th className="px-4 py-3">Kunde</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Summe</th>
              </tr>
            </thead>
            <tbody>
              {orders.length > 0 ? (
                orders.map((order) => (
                  <tr key={order.id} className="border-t border-border/50">
                    <td className="px-4 py-3 font-semibold text-foreground">
                      {order.order_number ? `#A-${order.order_number}` : `#${order.id.slice(0, 8)}`}
                    </td>
                    <td className="px-4 py-3 text-muted">{order.customer_name ?? "-"}</td>
                    <td className="px-4 py-3 text-muted">{formatStatus(order.status)}</td>
                    <td className="px-4 py-3 text-muted">
                      {new Intl.NumberFormat("de-DE", {
                        style: "currency",
                        currency: "EUR",
                      }).format(Number(order.total_amount))}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted">
                    Noch keine Bestellungen vorhanden.
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
