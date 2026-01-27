import type { Metadata } from "next";
import Link from "next/link";

import PageIntro from "../../../../components/PageIntro";
import AccessoriesStore from "../../../../components/AccessoriesStore";
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
    dict.meta.accessories.title,
    dict.meta.accessories.description,
    "/accessories",
  );
};

export default async function AccessoriesPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = getDictionary(lang as Locale);

  return (
    <div className="bg-background">
      <PageIntro
        title={dict.accessories.heroTitle}
        subtitle={dict.accessories.heroSubtitle}
        eyebrow={dict.meta.accessories.title}
      />

      {/* Category Quick Links */}
      <section className="border-b border-white/5 bg-surface/30 py-6">
        <div className="container-page">
          <div className="flex flex-wrap items-center justify-center gap-3">
            {[
              { id: "all", labelDe: "Alle", labelEn: "All" },
              { id: "cases", labelDe: "Hüllen", labelEn: "Cases" },
              { id: "screen-protectors", labelDe: "Displayschutz", labelEn: "Screen Protectors" },
              { id: "chargers", labelDe: "Ladegeräte", labelEn: "Chargers" },
              { id: "cables", labelDe: "Kabel", labelEn: "Cables" },
              { id: "headphones", labelDe: "Kopfhörer", labelEn: "Headphones" },
              { id: "bluetooth", labelDe: "Bluetooth", labelEn: "Bluetooth" },
              { id: "power-banks", labelDe: "Powerbanks", labelEn: "Power Banks" },
              { id: "sd-cards", labelDe: "SD-Karten", labelEn: "SD Cards" },
              { id: "smart-home", labelDe: "Smart Home", labelEn: "Smart Home" },
            ].map((cat) => (
              <a
                key={cat.id}
                href={`#${cat.id}`}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-muted transition hover:border-gold/30 hover:bg-gold/10 hover:text-gold"
              >
                {lang === "de" ? cat.labelDe : cat.labelEn}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Accessories Store with Filters */}
      <AccessoriesStore lang={lang as Locale} />

      {/* Featured Categories */}
      <section className="section-pad bg-surface/30">
        <div className="container-page">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-foreground md:text-4xl">
              {lang === "de" ? "Beliebte Kategorien" : "Popular Categories"}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted">
              {lang === "de"
                ? "Entdecke unsere meistgekauften Zubehör-Kategorien"
                : "Discover our best-selling accessory categories"}
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Cases */}
            <div className="tech-card-hover group overflow-hidden rounded-2xl">
              <div className="relative aspect-square bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-blue-500/10 p-8">
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="h-24 w-24 text-gold/20 transition group-hover:text-gold/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                  </svg>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-bold text-foreground">
                  {lang === "de" ? "Hüllen & Cases" : "Cases & Covers"}
                </h3>
                <p className="mt-2 text-sm text-muted">
                  {lang === "de" ? "Schutz mit Stil für dein Gerät" : "Protection with style for your device"}
                </p>
                <div className="mt-4 flex items-center gap-2 text-sm font-medium text-gold">
                  {lang === "de" ? "Entdecken" : "Explore"}
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Headphones */}
            <div className="tech-card-hover group overflow-hidden rounded-2xl">
              <div className="relative aspect-square bg-gradient-to-br from-ocean-light/10 via-ocean/10 to-ocean-deep/10 p-8">
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="h-24 w-24 text-gold/20 transition group-hover:text-gold/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={0.5}>
                    <path d="M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM21 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
                    <path d="M9 19V8a3 3 0 013-3h0a3 3 0 013 3v11" />
                    <path d="M3 12V8a9 9 0 0118 0v4" />
                  </svg>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-bold text-foreground">
                  {lang === "de" ? "Kopfhörer & Audio" : "Headphones & Audio"}
                </h3>
                <p className="mt-2 text-sm text-muted">
                  {lang === "de" ? "Kabellos und kabelgebunden" : "Wireless and wired options"}
                </p>
                <div className="mt-4 flex items-center gap-2 text-sm font-medium text-gold">
                  {lang === "de" ? "Entdecken" : "Explore"}
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Chargers */}
            <div className="tech-card-hover group overflow-hidden rounded-2xl">
              <div className="relative aspect-square bg-gradient-to-br from-green-500/10 via-emerald-500/10 to-teal-500/10 p-8">
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="h-24 w-24 text-gold/20 transition group-hover:text-gold/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                  </svg>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-bold text-foreground">
                  {lang === "de" ? "Ladegeräte & Kabel" : "Chargers & Cables"}
                </h3>
                <p className="mt-2 text-sm text-muted">
                  {lang === "de" ? "Schnellladen für alle Geräte" : "Fast charging for all devices"}
                </p>
                <div className="mt-4 flex items-center gap-2 text-sm font-medium text-gold">
                  {lang === "de" ? "Entdecken" : "Explore"}
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Screen Protectors */}
            <div className="tech-card-hover group overflow-hidden rounded-2xl">
              <div className="relative aspect-square bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-indigo-500/10 p-8">
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="h-24 w-24 text-gold/20 transition group-hover:text-gold/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-bold text-foreground">
                  {lang === "de" ? "Displayschutz" : "Screen Protectors"}
                </h3>
                <p className="mt-2 text-sm text-muted">
                  {lang === "de" ? "Panzerglas und Schutzfolien" : "Tempered glass and films"}
                </p>
                <div className="mt-4 flex items-center gap-2 text-sm font-medium text-gold">
                  {lang === "de" ? "Entdecken" : "Explore"}
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Buy From Us */}
      <section className="section-pad">
        <div className="container-page">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="tech-card rounded-2xl p-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gold/20 to-amber/20">
                <svg className="h-8 w-8 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-foreground">
                {lang === "de" ? "Geprüfte Qualität" : "Certified Quality"}
              </h3>
              <p className="mt-2 text-sm text-muted">
                {lang === "de"
                  ? "Nur geprüfte Markenprodukte in unserem Sortiment"
                  : "Only certified brand products in our selection"}
              </p>
            </div>

            <div className="tech-card rounded-2xl p-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green/20 to-emerald/20">
                <svg className="h-8 w-8 text-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-foreground">
                {lang === "de" ? "Direkt im Shop" : "In-Store Pickup"}
              </h3>
              <p className="mt-2 text-sm text-muted">
                {lang === "de"
                  ? "Sofort mitnehmen oder professionell anbringen lassen"
                  : "Take it home or get professional installation"}
              </p>
            </div>

            <div className="tech-card rounded-2xl p-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue/20 to-cyan/20">
                <svg className="h-8 w-8 text-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-foreground">
                {lang === "de" ? "Faire Preise" : "Fair Prices"}
              </h3>
              <p className="mt-2 text-sm text-muted">
                {lang === "de"
                  ? "Qualität zum besten Preis-Leistungs-Verhältnis"
                  : "Quality at the best value for money"}
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
                  {lang === "de" ? "Zubehör nicht gefunden?" : "Can't find what you need?"}
                </h3>
                <p className="mt-2 text-muted">
                  {lang === "de"
                    ? "Besuche uns im Shop – wir haben noch viel mehr auf Lager!"
                    : "Visit our shop – we have much more in stock!"}
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
