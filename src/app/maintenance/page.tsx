type MaintenancePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MaintenancePage({ searchParams }: MaintenancePageProps) {
  const params = (await searchParams) ?? {};
  const scope = Array.isArray(params.scope) ? params.scope[0] : params.scope;
  const isStoreOnly = scope === "store";

  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-6 py-16 text-foreground">
      {/* Subtle grid backdrop */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(90deg,var(--border)_1px,transparent_1px)] bg-[size:42px_42px] opacity-40" />
      {/* Gold radial glow */}
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-accent-glow blur-[120px]" />

      <div className="relative mx-auto flex max-w-5xl flex-col items-center gap-12 text-center">
        {/* Logo */}
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl border border-border bg-surface/60 p-4 shadow-2xl shadow-black/20 backdrop-blur-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/uploads/branding/logo-white.png"
            alt="Apfel Park"
            className="h-full w-full object-contain"
          />
        </div>

        {/* Status badge */}
        <div className="inline-flex items-center gap-3 rounded-full border border-accent/30 bg-accent/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-accent-soft">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
          </span>
          {isStoreOnly ? "Store Update" : "Maintenance"}
        </div>
        {/* Headline */}
        <div className="space-y-5">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            {isStoreOnly ? (
              <>
                Unser Store wird gerade{" "}
                <span className="gradient-text">optimiert</span>
              </>
            ) : (
              <>
                Wir verbessern gerade die{" "}
                <span className="gradient-text">Apfel Park</span> Website
              </>
            )}
          </h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted">
            {isStoreOnly
              ? "Unsere Werkstatt läuft weiter — nur der Shop-Bereich bekommt gerade ein technisches Update. Wir sind in Kürze wieder für dich da."
              : "Ein Techniker arbeitet an Performance, Inhalten und System-Updates. Wir sind in Kürze wieder für Besucher verfügbar."}
          </p>
        </div>

        {/* Status cards */}
        <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-3">
          <div className="tech-card rounded-2xl p-5 text-left">
            <div className="flex items-center gap-2 text-accent-soft">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <p className="text-xs uppercase tracking-[0.2em] text-muted">Status</p>
            </div>
            <p className="mt-2 text-base font-semibold text-foreground">
              {isStoreOnly ? "Shop pausiert" : "Update läuft"}
            </p>
          </div>
          <div className="tech-card rounded-2xl p-5 text-left">
            <div className="flex items-center gap-2 text-accent-soft">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs uppercase tracking-[0.2em] text-muted">Bereich</p>
            </div>
            <p className="mt-2 text-base font-semibold text-foreground">
              {isStoreOnly ? "Nur Shop" : "Komplette Seite"}
            </p>
          </div>
          <div className="tech-card rounded-2xl p-5 text-left">
            <div className="flex items-center gap-2 text-accent-soft">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs uppercase tracking-[0.2em] text-muted">ETA</p>
            </div>
            <p className="mt-2 text-base font-semibold text-foreground">In Kürze</p>
          </div>
        </div>

        {/* What's available */}
        {isStoreOnly ? (
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="text-xs uppercase tracking-[0.2em] text-muted">Noch verfügbar:</span>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-4 py-2 text-sm text-foreground">
              <svg className="h-3.5 w-3.5 text-accent-soft" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Reparatur & Service
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-4 py-2 text-sm text-foreground">
              <svg className="h-3.5 w-3.5 text-accent-soft" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Kontakt & Anfragen
            </div>
          </div>
        ) : null}

        {/* Contact CTA */}
        <div className="flex flex-col items-center gap-4 pt-4">
          <p className="text-sm text-muted">Brauchst du Hilfe? Wir sind erreichbar:</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="tel:+494058978787"
              className="btn-primary inline-flex items-center gap-2 !px-6 !py-3 text-sm"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              040 58978787
            </a>
            <a
              href="mailto:info@apfel-park.de"
              className="btn-secondary inline-flex items-center gap-2 !px-6 !py-3 text-sm"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              info@apfel-park.de
            </a>
          </div>
        </div>

        {/* Address footer */}
        <div className="mt-8 border-t border-border pt-6 text-xs text-muted">
          <p className="font-semibold uppercase tracking-[0.2em] text-muted-strong">Apfel Park</p>
          <p className="mt-1">Wilhelm-Strauß-Weg 2b · 21109 Hamburg</p>
        </div>
      </div>
    </main>
  );
}
