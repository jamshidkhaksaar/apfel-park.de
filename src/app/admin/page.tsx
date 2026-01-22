import { createClient } from "@/lib/supabase/server";
import AdminShell from "../../components/admin/AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createClient();

  // Fetch stats in parallel
  const [
    { count: repairsCount },
    { count: ordersCount },
    { count: productsCount },
    { count: reviewsCount },
  ] = await Promise.all([
    supabase.from("repairs").select("*", { count: "exact", head: true }).eq("status", "new"),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("products").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("reviews").select("*", { count: "exact", head: true }),
  ]);

  const stats = [
    { label: "Offene Reparaturen", value: repairsCount || 0, color: "text-blue-400" },
    { label: "Neue Bestellungen", value: ordersCount || 0, color: "text-green-400" },
    { label: "Produkte aktiv", value: productsCount || 0, color: "text-gold" },
    { label: "Bewertungen", value: reviewsCount || 0, color: "text-purple-400" },
  ];

  return (
    <AdminShell title="Dashboard">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="glass-panel rounded-2xl p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
              {stat.label}
            </p>
            <p className={`mt-4 text-3xl font-semibold ${stat.color || "text-foreground"}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>
      <div className="glass-panel rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-foreground">Quick Actions</h2>
        <p className="mt-3 text-sm text-muted">
          Willkommen im Admin-Bereich. Hier ist eine Übersicht der wichtigsten Module.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            { title: "Produkt hinzufügen", path: "/admin/products/new", desc: "Neues Gerät oder Zubehör anlegen" },
            { title: "Reparatur erfassen", path: "/admin/repairs/new", desc: "Neuen Service-Auftrag starten" },
            { title: "Bestellungen prüfen", path: "/admin/orders", desc: "Offene Online-Bestellungen bearbeiten" },
          ].map((item) => (
            <div key={item.title} className="group cursor-pointer rounded-xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10">
              <p className="font-medium text-foreground group-hover:text-gold">{item.title}</p>
              <p className="mt-1 text-xs text-muted">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
