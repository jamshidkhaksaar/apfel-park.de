import Image from "next/image";

type MaintenancePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MaintenancePage({ searchParams }: MaintenancePageProps) {
  const params = (await searchParams) ?? {};
  const scope = Array.isArray(params.scope) ? params.scope[0] : params.scope;
  const isStoreOnly = scope === "store";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#213249,transparent_35%),linear-gradient(180deg,#0a1017_0%,#0f1723_45%,#111827_100%)] px-6 py-16 text-white">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:36px_36px] opacity-20" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-white/10 bg-white/5 p-3 shadow-2xl shadow-black/30">
              <Image
                src="/uploads/branding/logo-white.png"
                alt="Apfel Park"
                width={56}
                height={56}
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Apfel Park</p>
              <p className="mt-2 text-sm text-slate-300">
                Hamburg repair, devices and store operations
              </p>
            </div>
          </div>
          <div className="inline-flex items-center gap-3 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-amber-300">
            <span className="h-2 w-2 animate-pulse rounded-full bg-amber-300" />
            Apfel Park Maintenance
          </div>
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
              {isStoreOnly ? "Store Update in Progress" : "Website Update in Progress"}
            </p>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white md:text-6xl">
              {isStoreOnly
                ? "Unser Store wird gerade optimiert."
                : "Wir verbessern gerade die Apfel Park Website."}
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-300">
              {isStoreOnly
                ? "Unsere Werkstatt lauft weiter, aber der Shop-Bereich bekommt gerade ein technisches Update. Admin und interne Systeme bleiben verfugbar."
                : "Ein Techniker arbeitet gerade an Performance, Inhalten und System-Updates. Wir sind in Kurze wieder fur Besucher verfugbar."}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Status</p>
              <p className="mt-2 text-lg font-semibold text-white">Technician active</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Scope</p>
              <p className="mt-2 text-lg font-semibold text-white">{isStoreOnly ? "Store only" : "Full website"}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Location</p>
              <p className="mt-2 text-lg font-semibold text-white">Hamburg</p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <p className="text-sm font-semibold text-white">
              {isStoreOnly ? "Was weiterhin verfugbar bleibt" : "Was intern weiterlauft"}
            </p>
            <div className="mt-4 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                Admin dashboard and internal workflows
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                Repair handling and customer communication
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                Email systems and mailbox access
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                Fast rollback once maintenance is complete
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/30 backdrop-blur">
          <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-4">
            <svg viewBox="0 0 640 520" className="w-full" role="img" aria-label="Technician repairing devices illustration">
              <defs>
                <linearGradient id="panel" x1="0" x2="1">
                  <stop offset="0%" stopColor="#18212f" />
                  <stop offset="100%" stopColor="#27384e" />
                </linearGradient>
                <linearGradient id="accent" x1="0" x2="1">
                  <stop offset="0%" stopColor="#f7c948" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
              </defs>
              <rect x="24" y="28" width="592" height="464" rx="28" fill="url(#panel)" stroke="rgba(255,255,255,0.12)" />
              <rect x="58" y="72" width="220" height="120" rx="20" fill="#0f172a" stroke="#334155" />
              <rect x="84" y="98" width="168" height="16" rx="8" fill="#1e293b" />
              <rect x="84" y="128" width="120" height="16" rx="8" fill="#1e293b" />
              <rect x="84" y="158" width="88" height="16" rx="8" fill="url(#accent)" />

              <rect x="336" y="330" width="180" height="42" rx="14" fill="#111827" stroke="#334155" />
              <rect x="358" y="350" width="76" height="8" rx="4" fill="#475569" />
              <rect x="446" y="350" width="48" height="8" rx="4" fill="url(#accent)" />

              <ellipse cx="430" cy="432" rx="124" ry="18" fill="rgba(0,0,0,0.25)" />
              <rect x="302" y="250" width="160" height="90" rx="18" fill="#0b1220" stroke="#475569" />
              <rect x="320" y="266" width="124" height="58" rx="10" fill="#111827" />
              <circle cx="383" cy="294" r="22" fill="none" stroke="url(#accent)" strokeWidth="8" />
              <path d="M383 274v20l14 10" fill="none" stroke="#f8fafc" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />

              <circle cx="212" cy="238" r="46" fill="#f2c4a5" />
              <path d="M170 232c6-54 86-66 105-12l-4 6c-34-14-66-13-97 6z" fill="#111827" />
              <rect x="187" y="278" width="52" height="86" rx="18" fill="#f2c4a5" />
              <path d="M149 346c22-28 39-40 58-40h20c17 0 30 5 50 24l32 30-34 31-26-22-2 101h-70l2-73-24 58-51-23 33-78z" fill="#0f172a" />
              <path d="M272 351l38-33 38 43-32 27z" fill="#f59e0b" />
              <path d="M314 338l22-18 18 22-20 18z" fill="#f8fafc" opacity="0.9" />
              <path d="M360 387l54-52 24 26-60 55z" fill="#1f2937" />
              <path d="M372 420l58-53 18 19-63 58z" fill="#334155" />
              <circle cx="451" cy="355" r="16" fill="url(#accent)" />
              <path d="M451 343v24M439 355h24" stroke="#111827" strokeWidth="4" strokeLinecap="round" />

              <rect x="72" y="372" width="160" height="22" rx="11" fill="#111827" stroke="#334155" />
              <rect x="88" y="379" width="72" height="8" rx="4" fill="#475569" />
              <rect x="168" y="379" width="44" height="8" rx="4" fill="url(#accent)" />
            </svg>
          </div>
        </section>
      </div>
    </main>
  );
}
