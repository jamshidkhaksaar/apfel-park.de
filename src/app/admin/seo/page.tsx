import AdminShell from "../../../components/admin/AdminShell";

const seoFields = [
  {
    label: "Standard Title",
    placeholder: "Apfel Park | Smartphone & Repair Studio",
  },
  {
    label: "Meta Description",
    placeholder:
      "Smart Phone. Smart Service. Smart Price. Premium Smartphones, Accessories & Repairs in Hamburg.",
  },
  {
    label: "Focus Keywords",
    placeholder: "smartphone reparatur hamburg, handy zubehoer, ...",
  },
  {
    label: "Open Graph Image",
    placeholder: "https://.../og-image.jpg",
  },
];

const verificationFields = [
  { label: "Google Search Console", placeholder: "Verification Token" },
  { label: "Bing Webmaster Tools", placeholder: "Verification Token" },
  { label: "Google Analytics ID", placeholder: "G-XXXXXXXXXX" },
];

export default function SeoPage() {
  return (
    <AdminShell title="SEO & Keys">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="glass-panel rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-foreground">
            SEO Grundeinstellungen
          </h2>
          <p className="mt-2 text-sm text-muted">
            Diese Felder steuern Metadaten, Keywords und Open Graph Inhalte.
          </p>
          <div className="mt-6 space-y-4">
            {seoFields.map((field) => (
              <div key={field.label}>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                  {field.label}
                </label>
                <input
                  type="text"
                  placeholder={field.placeholder}
                  className="mt-2 w-full rounded-xl border border-border/60 bg-black/30 px-4 py-3 text-sm text-foreground"
                />
              </div>
            ))}
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              "Sitemap automatisch generieren",
              "Robots.txt verwalten",
              "SEO Audit Erinnerungen",
              "Canonical Tags erzwingen",
            ].map((item) => (
              <label
                key={item}
                className="flex items-center justify-between rounded-xl border border-border/60 px-4 py-3 text-sm text-muted"
              >
                <span>{item}</span>
                <input type="checkbox" defaultChecked className="h-4 w-4" />
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-panel rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-foreground">
              Search Engine Keys
            </h2>
            <p className="mt-2 text-sm text-muted">
              Verbinde Google, Bing und Analytics für Indexierung.
            </p>
            <div className="mt-6 space-y-4">
              {verificationFields.map((field) => (
                <div key={field.label}>
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                    {field.label}
                  </label>
                  <input
                    type="text"
                    placeholder={field.placeholder}
                    className="mt-2 w-full rounded-xl border border-border/60 bg-black/30 px-4 py-3 text-sm text-foreground"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-foreground">
              Structured Data
            </h2>
            <p className="mt-2 text-sm text-muted">
              JSON-LD Module und lokale Schema-Infos konfigurieren.
            </p>
            <div className="mt-6 space-y-3 text-sm text-muted">
              <div className="flex items-center justify-between rounded-xl border border-border/60 px-4 py-3">
                <span>Local Business Schema</span>
                <input type="checkbox" defaultChecked className="h-4 w-4" />
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border/60 px-4 py-3">
                <span>FAQ Schema</span>
                <input type="checkbox" className="h-4 w-4" />
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border/60 px-4 py-3">
                <span>Product Schema</span>
                <input type="checkbox" defaultChecked className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
