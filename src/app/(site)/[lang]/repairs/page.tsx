import type { Metadata } from "next";
import Link from "next/link";

import PageIntro from "../../../../components/PageIntro";
import { getDictionary, type Locale } from "../../../../lib/i18n";
import { createMetadata } from "../../../../lib/metadata";
import { siteInfo } from "../../../../lib/site";

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> => {
  const { lang } = await params;
  const dict = getDictionary(lang as Locale);
  return createMetadata(
    lang as Locale,
    dict.meta.repairs.title,
    dict.meta.repairs.description,
    "/repairs",
  );
};

export default async function RepairsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const dict = getDictionary(lang as Locale);

  const repairIcons = [
    <svg key="display" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg>,
    <svg key="water" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>,
    <svg key="chip" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z" /></svg>,
    <svg key="audio" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" /></svg>,
  ];

  const serviceIcons = [
    <svg key="repair" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" /></svg>,
    <svg key="setup" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    <svg key="shield" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>,
    <svg key="business" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" /></svg>,
  ];

  return (
    <div className="bg-background">
      <PageIntro
        title={dict.repairs.heroTitle}
        subtitle={dict.repairs.heroSubtitle}
        eyebrow={dict.meta.repairs.title}
      />

      {/* Why Choose Us & Repair Types */}
      <section className="section-pad">
        <div className="container-page grid gap-12 lg:grid-cols-2">
          {/* Left: Highlights */}
          <div className="tech-card rounded-3xl p-8">
            <span className="badge-gold mb-4 inline-flex">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              {lang === "de" ? "Unsere Vorteile" : "Our Advantages"}
            </span>
            <h2 className="text-2xl font-bold text-foreground">
              {lang === "de" ? "Warum Apfel Park?" : "Why Apfel Park?"}
            </h2>
            
            <ul className="mt-8 space-y-4">
              {dict.repairs.highlights.map((item) => (
                <li key={item} className="flex items-start gap-4">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold/20">
                    <svg className="h-4 w-4 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-muted">{item}</span>
                </li>
              ))}
            </ul>

            {/* Stats */}
            <div className="mt-8 grid grid-cols-3 gap-4 border-t border-white/10 pt-8">
              <div className="text-center">
                <p className="text-2xl font-bold text-gold">30</p>
                <p className="mt-1 text-xs text-muted">min</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-amber">12</p>
                <p className="mt-1 text-xs text-muted">{lang === "de" ? "Monate" : "months"}</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-bronze">5K+</p>
                <p className="mt-1 text-xs text-muted">{lang === "de" ? "Reparaturen" : "repairs"}</p>
              </div>
            </div>
          </div>

          {/* Right: Repair Types Grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            {dict.repairs.repairTypes.map((item, index) => (
              <div key={item.title} className="tech-card-hover rounded-2xl p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-gold/20 to-amber/20 text-gold">
                  {repairIcons[index]}
                </div>
                <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm text-muted">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="section-pad bg-surface/30">
        <div className="container-page">
          <div className="mb-12 text-center">
            <span className="badge-gold mb-4 inline-flex">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
              </svg>
              {lang === "de" ? "Premium Services" : "Premium Services"}
            </span>
            <h2 className="text-3xl font-bold text-foreground md:text-4xl">
              {dict.services.heroTitle}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted">
              {dict.services.heroSubtitle}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {dict.services.categories.map((item, index) => (
              <div key={item.title} className="tech-card-hover group rounded-2xl p-6 text-center">
                <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gold/20 to-amber/20 text-gold transition group-hover:from-gold/30 group-hover:to-amber/30">
                  {serviceIcons[index]}
                </div>
                <h3 className="text-lg font-bold text-foreground">{item.title}</h3>
                <p className="mt-3 text-sm text-muted">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Devices We Repair */}
      <section className="section-pad">
        <div className="container-page">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-foreground md:text-4xl">
              {lang === "de" ? "Geräte die wir reparieren" : "Devices We Repair"}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted">
              {lang === "de" 
                ? "Wir reparieren alle gängigen Marken und Gerätetypen"
                : "We repair all major brands and device types"}
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* iPhones */}
            <div className="tech-card-hover group rounded-2xl p-6">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gold/10 to-amber/10 text-gold transition group-hover:from-gold/20 group-hover:to-amber/20">
                <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <rect x="5" y="2" width="14" height="20" rx="3" />
                  <line x1="12" y1="18" x2="12" y2="18.01" strokeWidth={2} strokeLinecap="round" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-foreground">iPhone</h3>
              <p className="mt-2 text-sm text-muted">
                {lang === "de" ? "Alle Modelle von iPhone 6 bis iPhone 16" : "All models from iPhone 6 to iPhone 16"}
              </p>
            </div>

            {/* Samsung */}
            <div className="tech-card-hover group rounded-2xl p-6">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue/10 to-cyan/10 text-blue transition group-hover:from-blue/20 group-hover:to-cyan/20">
                <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <rect x="4" y="2" width="16" height="20" rx="2" />
                  <path d="M8 19h8" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-foreground">Samsung Galaxy</h3>
              <p className="mt-2 text-sm text-muted">
                {lang === "de" ? "Galaxy S, A, Z Fold & Z Flip Serie" : "Galaxy S, A, Z Fold & Z Flip series"}
              </p>
            </div>

            {/* iPad & Tablets */}
            <div className="tech-card-hover group rounded-2xl p-6">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple/10 to-pink/10 text-purple transition group-hover:from-purple/20 group-hover:to-pink/20">
                <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <circle cx="12" cy="12" r="1" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-foreground">iPad & Tablets</h3>
              <p className="mt-2 text-sm text-muted">
                {lang === "de" ? "iPad, iPad Pro, Samsung Tab und mehr" : "iPad, iPad Pro, Samsung Tab and more"}
              </p>
            </div>

            {/* Game Consoles */}
            <div className="tech-card-hover group rounded-2xl p-6">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green/10 to-emerald/10 text-green transition group-hover:from-green/20 group-hover:to-emerald/20">
                <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M6 11h4M8 9v4M15 12h.01M18 10h.01" strokeLinecap="round" />
                  <rect x="2" y="6" width="20" height="12" rx="3" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-foreground">
                {lang === "de" ? "Spielkonsolen" : "Game Consoles"}
              </h3>
              <p className="mt-2 text-sm text-muted">
                PlayStation, Xbox, Nintendo Switch
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-pad bg-surface/30">
        <div className="container-page">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gold/20 via-amber/10 to-bronze/20 p-10 md:p-16">
            <div className="absolute inset-0 circuit-pattern opacity-20" />
            
            <div className="relative flex flex-col items-center justify-between gap-8 text-center md:flex-row md:text-left">
              <div>
                <h3 className="text-2xl font-bold text-foreground md:text-3xl">
                  {lang === "de" ? "Sofort-Reparatur anfragen" : "Request Express Repair"}
                </h3>
                <p className="mt-2 text-muted">
                  {lang === "de"
                    ? "Ruf uns an oder besuche den Shop – wir helfen sofort."
                    : "Call us or visit the shop – we help right away."}
                </p>
              </div>
              
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href={`tel:${siteInfo.phone.replace(/\s/g, "")}`}
                  className="btn-primary shrink-0"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>{siteInfo.phone}</span>
                </Link>
                <Link
                  href={`/${lang}/contact`}
                  className="btn-secondary shrink-0"
                >
                  <span>{lang === "de" ? "Kontakt" : "Contact"}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
