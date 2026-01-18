import AdminShell from "../../../components/admin/AdminShell";

const orders = [
  { id: "#A-1023", customer: "Lena S.", status: "Neu", total: "289 €" },
  { id: "#A-1022", customer: "Tim B.", status: "In Bearbeitung", total: "99 €" },
  { id: "#A-1021", customer: "Maya K.", status: "Abgeschlossen", total: "149 €" },
];

export default function OrdersPage() {
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
              {orders.map((order) => (
                <tr key={order.id} className="border-t border-border/50">
                  <td className="px-4 py-3 font-semibold text-foreground">
                    {order.id}
                  </td>
                  <td className="px-4 py-3 text-muted">{order.customer}</td>
                  <td className="px-4 py-3 text-muted">{order.status}</td>
                  <td className="px-4 py-3 text-muted">{order.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
