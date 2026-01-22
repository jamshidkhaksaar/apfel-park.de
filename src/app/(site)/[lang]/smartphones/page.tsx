import type { Metadata } from "next";
import Link from "next/link";

import PageIntro from "../../../../components/PageIntro";
import SmartphoneStore from "../../../../components/SmartphoneStore";
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
    dict.meta.smartphones.title,
    dict.meta.smartphones.description,
    "/smartphones",
  );
};

export default async function SmartphonesPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = getDictionary(lang as Locale);

  return (
    <div className="bg-background">
      <PageIntro
        title={dict.smartphones.heroTitle}
        subtitle={dict.smartphones.heroSubtitle}
        eyebrow={dict.meta.smartphones.title}
      />

      {/* Trust Badges */}
      <section className="border-b border-white/5 bg-surface/30 py-8">
        <div className="container-page">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {/* Warranty */}
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-green/20 to-emerald/20">
                <svg className="h-7 w-7 text-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">24 {lang === "de" ? "Monate" : "Months"}</p>
                <p className="text-sm text-muted">{lang === "de" ? "Garantie" : "Warranty"}</p>
              </div>
            </div>

            {/* Original */}
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gold/20 to-amber/20">
                <svg className="h-7 w-7 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">100% {lang === "de" ? "Original" : "Genuine"}</p>
                <p className="text-sm text-muted">{lang === "de" ? "Neuware" : "Brand New"}</p>
              </div>
            </div>

            {/* Best Price */}
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue/20 to-cyan/20">
                <svg className="h-7 w-7 text-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">{lang === "de" ? "Beste Preise" : "Best Prices"}</p>
                <p className="text-sm text-muted">{lang === "de" ? "Garantiert" : "Guaranteed"}</p>
              </div>
            </div>

            {/* Support */}
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple/20 to-pink/20">
                <svg className="h-7 w-7 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">{lang === "de" ? "Experten-Support" : "Expert Support"}</p>
                <p className="text-sm text-muted">{lang === "de" ? "Persönlich" : "Personal"}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Smartphone Store */}
      <SmartphoneStore lang={lang as Locale} />

      {/* Warranty Info Section */}
      <section className="section-pad bg-surface/30">
        <div className="container-page">
          <div className="relative overflow-hidden rounded-3xl border border-gold/20 bg-gradient-to-br from-gold/5 via-amber/5 to-bronze/5 p-8 md:p-12">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gold/10 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-amber/10 blur-3xl" />
            
            <div className="relative">
              <div className="flex flex-col items-start gap-8 md:flex-row md:items-center">
                {/* Icon */}
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-gold/20 to-amber/20">
                  <svg className="h-10 w-10 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-foreground md:text-3xl">
                    {lang === "de" ? "Unsere Garantie-Versprechen" : "Our Warranty Promise"}
                  </h3>
                  <p className="mt-3 text-muted">
                    {lang === "de"
                      ? "Alle Smartphones kommen mit voller Herstellergarantie. Bei uns kaufst du 100% originale Neuware mit Rechnung und vollem Support."
                      : "All smartphones come with full manufacturer warranty. With us, you buy 100% genuine new devices with invoice and full support."}
                  </p>

                  {/* Warranty Benefits */}
                  <div className="mt-6 grid gap-4 sm:grid-cols-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green/20">
                        <svg className="h-3 w-3 text-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-sm text-muted">
                        {lang === "de" ? "24 Monate Garantie auf alle Geräte" : "24-month warranty on all devices"}
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green/20">
                        <svg className="h-3 w-3 text-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-sm text-muted">
                        {lang === "de" ? "Originalverpackt und versiegelt" : "Original packaging and sealed"}
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green/20">
                        <svg className="h-3 w-3 text-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-sm text-muted">
                        {lang === "de" ? "Rechnung für Geschäftskunden" : "Invoice for business customers"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex shrink-0 gap-8">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gold">24</p>
                    <p className="text-xs text-muted">{lang === "de" ? "Monate" : "Months"}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gold">100%</p>
                    <p className="text-xs text-muted">{lang === "de" ? "Original" : "Genuine"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Brands */}
      <section className="section-pad">
        <div className="container-page">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-foreground md:text-4xl">
              {lang === "de" ? "Top Marken" : "Top Brands"}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted">
              {lang === "de"
                ? "Wir führen alle führenden Smartphone-Marken"
                : "We carry all leading smartphone brands"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-5">
            {/* Apple */}
            <div className="tech-card-hover group flex flex-col items-center justify-center rounded-2xl p-8 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-white/10 to-white/5 transition group-hover:from-gold/20 group-hover:to-amber/20">
                <svg className="h-8 w-8 text-muted transition group-hover:text-gold" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
              </div>
              <p className="font-semibold text-foreground">Apple</p>
              <p className="mt-1 text-xs text-muted">iPhone</p>
            </div>

            {/* Samsung */}
            <div className="tech-card-hover group flex flex-col items-center justify-center rounded-2xl p-8 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue/10 to-blue/5 transition group-hover:from-gold/20 group-hover:to-amber/20">
                <span className="text-xl font-bold text-muted transition group-hover:text-gold">S</span>
              </div>
              <p className="font-semibold text-foreground">Samsung</p>
              <p className="mt-1 text-xs text-muted">Galaxy</p>
            </div>

            {/* Google */}
            <div className="tech-card-hover group flex flex-col items-center justify-center rounded-2xl p-8 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-red/10 via-yellow/10 to-green/10 transition group-hover:from-gold/20 group-hover:to-amber/20">
                <span className="text-xl font-bold text-muted transition group-hover:text-gold">G</span>
              </div>
              <p className="font-semibold text-foreground">Google</p>
              <p className="mt-1 text-xs text-muted">Pixel</p>
            </div>

            {/* Xiaomi */}
            <div className="tech-card-hover group flex flex-col items-center justify-center rounded-2xl p-8 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange/10 to-orange/5 transition group-hover:from-gold/20 group-hover:to-amber/20">
                <span className="text-xl font-bold text-muted transition group-hover:text-gold">Mi</span>
              </div>
              <p className="font-semibold text-foreground">Xiaomi</p>
              <p className="mt-1 text-xs text-muted">Mi & Redmi</p>
            </div>

            {/* Huawei */}
            <div className="tech-card-hover group flex flex-col items-center justify-center rounded-2xl p-8 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-red/10 to-red/5 transition group-hover:from-gold/20 group-hover:to-amber/20">
                <span className="text-xl font-bold text-muted transition group-hover:text-gold">H</span>
              </div>
              <p className="font-semibold text-foreground">Huawei</p>
              <p className="mt-1 text-xs text-muted">Mate & Pura</p>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="section-pad bg-surface/30">
        <div className="container-page">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-foreground md:text-4xl">
              {lang === "de" ? "Unsere Services" : "Our Services"}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted">
              {lang === "de"
                ? "Mehr als nur Verkauf – wir bieten Full-Service für dein Smartphone"
                : "More than just sales – we offer full service for your smartphone"}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Trade-In */}
            <div className="tech-card-hover group rounded-2xl p-8">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gold/20 to-amber/20 text-gold">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-foreground">Trade-In</h3>
              <p className="mt-3 text-muted">
                {lang === "de"
                  ? "Bring dein altes Gerät mit und erhalte einen fairen Preis für dein neues Smartphone."
                  : "Bring your old device and get a fair price for your new smartphone."}
              </p>
            </div>

            {/* Setup */}
            <div className="tech-card-hover group rounded-2xl p-8">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue/20 to-cyan/20 text-blue">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-foreground">{lang === "de" ? "Kostenloser Setup" : "Free Setup"}</h3>
              <p className="mt-3 text-muted">
                {lang === "de"
                  ? "Wir richten dein neues Smartphone ein, übertragen Daten und installieren Schutzfolie."
                  : "We set up your new smartphone, transfer data, and install screen protection."}
              </p>
            </div>

            {/* Financing */}
            <div className="tech-card-hover group rounded-2xl p-8">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-green/20 to-emerald/20 text-green">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-foreground">{lang === "de" ? "Finanzierung" : "Financing"}</h3>
              <p className="mt-3 text-muted">
                {lang === "de"
                  ? "Flexible Ratenzahlung für dein Wunsch-Smartphone. Frag uns nach den Möglichkeiten."
                  : "Flexible installment payments for your dream smartphone. Ask us about options."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-pad">
        <div className="container-page">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gold/20 via-amber/10 to-bronze/20 p-10 md:p-16">
            <div className="absolute inset-0 circuit-pattern opacity-20" />
            
            <div className="relative flex flex-col items-center justify-between gap-8 text-center md:flex-row md:text-left">
              <div>
                <h3 className="text-2xl font-bold text-foreground md:text-3xl">
                  {lang === "de" ? "Finde dein perfektes Smartphone" : "Find your perfect smartphone"}
                </h3>
                <p className="mt-2 text-muted">
                  {lang === "de"
                    ? "Besuche uns für eine persönliche Beratung – wir helfen dir, das richtige Gerät zu finden."
                    : "Visit us for personal advice – we'll help you find the right device."}
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
