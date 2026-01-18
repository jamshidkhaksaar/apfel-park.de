import AdminShell from "../../../components/admin/AdminShell";

const paymentProviders = [
  {
    name: "PayPal",
    active: true,
    fields: ["Client ID", "Secret Key", "Sandbox Mode"],
  },
  {
    name: "Stripe",
    active: true,
    fields: ["Publishable Key", "Secret Key", "Webhook Secret"],
  },
  {
    name: "Klarna",
    active: false,
    fields: ["Merchant ID", "Shared Secret", "Region"],
  },
  {
    name: "Sofort",
    active: false,
    fields: ["Project ID", "Project Password", "Notification Key"],
  },
  {
    name: "Apple Pay",
    active: true,
    fields: ["Merchant Identity Cert", "Processing Cert"],
  },
  {
    name: "Google Pay",
    active: true,
    fields: ["Merchant ID", "Gateway Tokenization"],
  },
];

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

          <div className="mt-8 grid gap-4">
            {paymentProviders.map((provider) => (
              <div
                key={provider.name}
                className="group relative overflow-hidden rounded-xl border border-border/60 bg-black/20 p-5 transition hover:border-brand-gold/50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/5 font-bold text-muted transition group-hover:bg-brand-gold/10 group-hover:text-brand-gold">
                      {provider.name[0]}
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">
                        {provider.name}
                      </h3>
                      <p className="text-xs text-muted">
                        {provider.active
                          ? "Aktiv im Checkout"
                          : "Derzeit deaktiviert"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        provider.active
                          ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"
                          : "bg-red-500/50"
                      }`}
                    />
                    <button className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-muted transition hover:bg-white/5 hover:text-foreground">
                      Konfigurieren
                    </button>
                  </div>
                </div>

                {/* Mock Settings Preview (Visual only) */}
                <div className="mt-4 hidden space-y-3 border-t border-white/5 pt-4 group-hover:block animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-2 gap-4">
                    {provider.fields.map((field) => (
                      <div key={field}>
                        <label className="text-[10px] uppercase tracking-wider text-muted">
                          {field}
                        </label>
                        <div className="mt-1 h-8 w-full rounded-md bg-white/5" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
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
