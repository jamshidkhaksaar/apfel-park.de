import AdminShell from "../../../components/admin/AdminShell";

export default function SettingsPage() {
  return (
    <AdminShell title="Shop Settings">
      <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          {/* General Information */}
          <div className="glass-panel rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-foreground">
              Allgemeine Informationen
            </h2>
            <p className="mt-2 text-sm text-muted">
              Stammdaten des Geschäfts, die auf Rechnungen und im Footer
              erscheinen.
            </p>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Shop Name
                </label>
                <input
                  type="text"
                  defaultValue="Apfel Park"
                  className="w-full rounded-xl border border-border/60 bg-black/30 px-4 py-3 text-sm text-foreground focus:border-brand-gold/50 focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Inhaber
                </label>
                <input
                  type="text"
                  defaultValue="Max Mustermann"
                  className="w-full rounded-xl border border-border/60 bg-black/30 px-4 py-3 text-sm text-foreground focus:border-brand-gold/50 focus:outline-none"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Adresse
                </label>
                <input
                  type="text"
                  defaultValue="Musterstraße 123, 20095 Hamburg"
                  className="w-full rounded-xl border border-border/60 bg-black/30 px-4 py-3 text-sm text-foreground focus:border-brand-gold/50 focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Email (Support)
                </label>
                <input
                  type="email"
                  defaultValue="support@apfelpark.de"
                  className="w-full rounded-xl border border-border/60 bg-black/30 px-4 py-3 text-sm text-foreground focus:border-brand-gold/50 focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Telefon
                </label>
                <input
                  type="text"
                  defaultValue="+49 40 123 456 78"
                  className="w-full rounded-xl border border-border/60 bg-black/30 px-4 py-3 text-sm text-foreground focus:border-brand-gold/50 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Location & Maps */}
          <div className="glass-panel rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-foreground">
              Standort & Maps
            </h2>
            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Google Maps API Key
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    defaultValue="AIzaSyB..."
                    className="w-full rounded-xl border border-border/60 bg-black/30 px-4 py-3 text-sm text-foreground focus:border-brand-gold/50 focus:outline-none"
                  />
                  <button className="shrink-0 rounded-xl border border-border/60 px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-strong">
                    Test
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar: Opening Hours */}
        <div className="space-y-6">
          <div className="glass-panel rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-foreground">
              Öffnungszeiten
            </h2>
            <p className="mt-2 text-sm text-muted">
              Wird im Footer und auf der Kontaktseite angezeigt.
            </p>
            <div className="mt-6 space-y-3">
              {[
                "Montag",
                "Dienstag",
                "Mittwoch",
                "Donnerstag",
                "Freitag",
                "Samstag",
              ].map((day) => (
                <div
                  key={day}
                  className="grid grid-cols-[1fr_1fr] items-center gap-2"
                >
                  <span className="text-sm text-muted">{day}</span>
                  <input
                    type="text"
                    defaultValue={day === "Samstag" ? "10:00 - 16:00" : "09:00 - 18:00"}
                    className="rounded-lg border border-border/60 bg-black/20 px-3 py-1.5 text-xs text-foreground text-center"
                  />
                </div>
              ))}
              <div className="grid grid-cols-[1fr_1fr] items-center gap-2 pt-2 border-t border-border/30">
                <span className="text-sm text-red-400">Sonntag</span>
                <input
                  type="text"
                  defaultValue="Geschlossen"
                  className="rounded-lg border border-red-900/30 bg-red-900/10 px-3 py-1.5 text-xs text-red-200 text-center"
                />
              </div>
            </div>
          </div>

          {/* Maintenance Mode */}
          <div className="glass-panel rounded-2xl border-yellow-500/20 bg-yellow-950/5 p-6">
            <h2 className="text-lg font-semibold text-yellow-500">
              Wartungsmodus
            </h2>
            <p className="mt-2 text-xs text-yellow-500/80">
              Sperrt den öffentlichen Zugriff auf den Shop. Admin-Bereich bleibt
              erreichbar.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <div className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-stone-700 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:ring-offset-2">
                <span className="translate-x-0 pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
              </div>
              <span className="text-sm font-medium text-muted">Inaktiv</span>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
