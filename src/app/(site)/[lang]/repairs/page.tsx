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

  return (
    <div className="bg-background">
      <PageIntro
        title={dict.repairs.heroTitle}
        subtitle={dict.repairs.heroSubtitle}
        eyebrow={dict.meta.repairs.title}
      />

      {/* Why Choose Us */}
      <section className="section-pad">
        <div className="container-page grid gap-12 lg:grid-cols-2">
          {/* Left: Highlights */}
          <div className="tech-card rounded-3xl p-8">
            <span className="badge-cyan mb-4 inline-flex">
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
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green/20">
                    <svg className="h-4 w-4 text-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
                <p className="text-2xl font-bold text-cyan">30</p>
                <p className="mt-1 text-xs text-muted">min</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue">12</p>
                <p className="mt-1 text-xs text-muted">{lang === "de" ? "Monate" : "months"}</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple">5K+</p>
                <p className="mt-1 text-xs text-muted">{lang === "de" ? "Reparaturen" : "repairs"}</p>
              </div>
            </div>
          </div>

          {/* Right: Repair Types Grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            {dict.repairs.repairTypes.map((item, index) => (
              <div key={item.title} className="tech-card-hover rounded-2xl p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan/20 to-blue/20 text-cyan">
                  {repairIcons[index]}
                </div>
                <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm text-muted">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-pad bg-surface/30">
        <div className="container-page">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan/20 via-blue/10 to-purple/20 p-10 md:p-16">
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
              
              <Link
                href={`tel:${siteInfo.phone.replace(/\s/g, "")}`}
                className="btn-primary shrink-0"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {siteInfo.phone}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
