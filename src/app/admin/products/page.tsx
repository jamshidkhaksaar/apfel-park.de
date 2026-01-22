import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import AdminShell from "../../../components/admin/AdminShell";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

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
          <Link 
            href="/admin/products/new"
            className="rounded-full bg-gold px-6 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-black hover:bg-gold-deep transition"
          >
            Neues Produkt
          </Link>
        </div>
        <div className="mt-6 overflow-hidden rounded-xl border border-border/60">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-strong/60 text-xs uppercase tracking-[0.2em] text-muted">
              <tr>
                <th className="px-4 py-3">Produkt</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Kategorie</th>
                <th className="px-4 py-3">Lager</th>
                <th className="px-4 py-3">Preis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {products && products.length > 0 ? (
                products.map((item) => (
                  <tr key={item.id} className="hover:bg-white/5 transition">
                    <td className="px-4 py-3 font-medium text-foreground">
                      {item.title}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {item.is_active ? (
                        <span className="inline-flex items-center rounded-full bg-green-400/10 px-2 py-1 text-xs font-medium text-green-400 ring-1 ring-inset ring-green-400/20">
                          Aktiv
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-red-400/10 px-2 py-1 text-xs font-medium text-red-400 ring-1 ring-inset ring-red-400/20">
                          Entwurf
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted capitalize">{item.category}</td>
                    <td className="px-4 py-3 text-muted">{item.stock}</td>
                    <td className="px-4 py-3 text-muted">
                      {new Intl.NumberFormat("de-DE", {
                        style: "currency",
                        currency: "EUR",
                      }).format(item.price)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted">
                    Keine Produkte gefunden.
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
