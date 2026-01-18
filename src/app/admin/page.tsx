import AdminShell from "../../components/admin/AdminShell";

const stats = [
  { label: "Offene Reparaturen", value: "12" },
  { label: "Neue Bestellungen", value: "8" },
  { label: "Produkte aktiv", value: "248" },
  { label: "Bewertungen", value: "45" },
];

export default function AdminPage() {
  return (
    <AdminShell title="Dashboard">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="glass-panel rounded-2xl p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
              {stat.label}
            </p>
            <p className="mt-4 text-3xl font-semibold text-foreground">
              {stat.value}
            </p>
          </div>
        ))}
      </div>
      <div className="glass-panel rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-foreground">Workflow</h2>
        <p className="mt-3 text-sm text-muted">
          Verbinde später Supabase, Zahlungen und Lagerbestand. Dieses Dashboard
          ist aktuell ein UI-Scaffold für Design-Validierung.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            "Produktkatalog & Varianten",
            "Online-Bestellungen & Status",
            "Reparaturaufträge & Tracking",
          ].map((item) => (
            <div key={item} className="rounded-xl border border-border/60 p-4">
              <p className="text-sm text-muted">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
