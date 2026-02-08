import AdminShell from "../../../components/admin/AdminShell";

export default function PaymentsPage() {
  return (
    <AdminShell title="Payments">
      <div className="grid gap-6 xl:grid-cols-[1fr_350px]">
        {/* Main Provider List */}
        <div className="glass-panel rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-foreground">
            Zahlungsanbieter
          </h2>
          <p className="mt-2 text-sm text-muted">
            Aktiviere und konfiguriere die verfügbaren Zahlungsarten für den
            Checkout.
          </p>

          <div className="mt-8 rounded-xl border border-border/60 bg-black/20 p-6 text-sm text-muted">
            Noch keine Zahlungsanbieter hinterlegt. Sobald du die Integration aus dem Backend aktivierst,
            erscheinen sie hier zur Konfiguration.
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="glass-panel rounded-2xl p-6">
            <h3 className="font-semibold text-foreground">Transaktionen</h3>
            <p className="mt-2 text-sm text-muted">
              Übersicht der letzten Auszahlungen und Gebühren.
            </p>
            <div className="mt-6 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted">Umsatz (Heute)</span>
                <span className="font-mono text-brand-gold">2.450 €</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Offene Payouts</span>
                <span className="font-mono text-foreground">890 €</span>
              </div>
              <div className="h-px w-full bg-border/50" />
              <button className="w-full rounded-xl bg-surface-strong py-2 text-xs font-semibold text-foreground transition hover:bg-brand-gold hover:text-black">
                Finanzreport öffnen
              </button>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6">
            <h3 className="font-semibold text-foreground">Steuern</h3>
            <div className="mt-4 space-y-3">
              <label className="flex items-center justify-between text-sm text-muted">
                <span>MwSt. (19%)</span>
                <input type="checkbox" defaultChecked className="h-4 w-4" />
              </label>
              <label className="flex items-center justify-between text-sm text-muted">
                <span>Kleinunternehmer</span>
                <input type="checkbox" className="h-4 w-4" />
              </label>
              <label className="flex items-center justify-between text-sm text-muted">
                <span>OSS Verfahren</span>
                <input type="checkbox" className="h-4 w-4" />
              </label>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
