import AdminShell from "../../../components/admin/AdminShell";

const products = [
  {
    name: "iPhone 15 Pro",
    status: "Aktiv",
    stock: "12",
    price: "1.099 €",
  },
  {
    name: "Samsung Galaxy S24",
    status: "Aktiv",
    stock: "8",
    price: "899 €",
  },
  {
    name: "AirPods Pro (2. Gen)",
    status: "Entwurf",
    stock: "20",
    price: "279 €",
  },
];

export default function ProductsPage() {
  return (
    <AdminShell title="Produkte">
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
              Produktkatalog
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">
              Produkte verwalten
            </h2>
          </div>
          <button className="rounded-full bg-brand-gold px-6 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-black">
            Neues Produkt
          </button>
        </div>
        <div className="mt-6 overflow-hidden rounded-xl border border-border/60">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-strong/60 text-xs uppercase tracking-[0.2em] text-muted">
              <tr>
                <th className="px-4 py-3">Produkt</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Lager</th>
                <th className="px-4 py-3">Preis</th>
              </tr>
            </thead>
            <tbody>
              {products.map((item) => (
                <tr key={item.name} className="border-t border-border/50">
                  <td className="px-4 py-3 font-semibold text-foreground">
                    {item.name}
                  </td>
                  <td className="px-4 py-3 text-muted">{item.status}</td>
                  <td className="px-4 py-3 text-muted">{item.stock}</td>
                  <td className="px-4 py-3 text-muted">{item.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
