import type { Metadata } from "next";
import Link from "next/link";

import PageIntro from "../../../../components/PageIntro";
import GamingStore from "../../../../components/GamingStore";
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
    dict.meta.gaming.title,
    dict.meta.gaming.description,
    "/gaming",
  );
};

export default async function GamingPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const dict = getDictionary(lang as Locale);

  return (
    <div className="bg-background">
      <PageIntro
        title={dict.gaming.heroTitle}
        subtitle={dict.gaming.heroSubtitle}
        eyebrow={dict.meta.gaming.title}
      />

      {/* Console Brands */}
      <section className="border-b border-white/5 bg-surface/30 py-8">
        <div className="container-page">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
            {/* PlayStation */}
            <div className="group flex flex-col items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue/20 to-blue/10 transition group-hover:from-gold/20 group-hover:to-amber/20">
                <svg className="h-8 w-8 text-blue transition group-hover:text-gold" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8.985 2.596v17.548l3.915 1.261V6.688c0-.69.304-1.151.794-.991.636.181.76.814.76 1.505v5.876c2.441 1.193 4.362-.002 4.362-3.153 0-3.237-1.126-4.675-4.438-5.827-1.307-.448-3.728-1.186-5.391-1.502h-.002zm4.656 16.242l6.296-2.275c.715-.258.826-.625.246-.818-.586-.192-1.637-.139-2.357.123l-4.205 1.500v-2.385l.24-.085s1.201-.42 2.913-.615c1.696-.18 3.785.03 5.437.661 1.848.601 2.041 1.472 1.576 2.072s-1.622 1.036-1.622 1.036l-8.544 3.107v-2.297l.02-.024zM1.985 18.042c-1.725-.521-2.001-1.615-1.228-2.168.718-.514 1.946-.903 1.946-.903l5.131-1.828v2.301l-3.681 1.319c-.715.256-.826.627-.246.818.585.192 1.637.139 2.355-.123l1.572-.561v2.063c-.083.014-.18.035-.27.046-1.493.18-3.073-.044-4.539-.54-.457-.149-.891-.343-1.04-.424z"/>
                </svg>
              </div>
              <span className="text-sm font-medium text-muted group-hover:text-foreground">PlayStation</span>
            </div>

            {/* Xbox */}
            <div className="group flex flex-col items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green/20 to-green/10 transition group-hover:from-gold/20 group-hover:to-amber/20">
                <svg className="h-8 w-8 text-green transition group-hover:text-gold" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4.102 21.033C6.211 22.881 8.977 24 12 24c3.026 0 5.789-1.119 7.902-2.967 1.877-1.912-4.316-8.709-7.902-11.417-3.582 2.708-9.779 9.505-7.898 11.417zm11.16-14.406c2.5 2.961 7.484 10.313 6.076 12.912C23.056 17.036 24 14.62 24 12c0-5.172-3.264-9.581-7.849-11.291-.547-.104-1.326.178-1.423.323-.096.144.536.556.536.556l-.002.039zm-6.523 0l-.001-.039s.632-.412.535-.556c-.097-.145-.875-.427-1.422-.323C3.263 2.419 0 6.828 0 12c0 2.62.944 5.036 2.662 6.539-1.408-2.599 3.576-9.951 6.077-12.912z"/>
                </svg>
              </div>
              <span className="text-sm font-medium text-muted group-hover:text-foreground">Xbox</span>
            </div>

            {/* Nintendo */}
            <div className="group flex flex-col items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-red/20 to-red/10 transition group-hover:from-gold/20 group-hover:to-amber/20">
                <svg className="h-8 w-8 text-red transition group-hover:text-gold" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10.04 20.4H2.94c-1.63 0-2.94-1.32-2.94-2.94V6.54C0 4.9 1.32 3.6 2.94 3.6h7.1v16.8zm1.92-16.8h7.1c1.63 0 2.94 1.31 2.94 2.94v10.92c0 1.62-1.32 2.94-2.94 2.94h-7.1V3.6zM5.97 7.68a2.94 2.94 0 100 5.88 2.94 2.94 0 000-5.88zm12.06 5.52a1.56 1.56 0 100-3.12 1.56 1.56 0 000 3.12z"/>
                </svg>
              </div>
              <span className="text-sm font-medium text-muted group-hover:text-foreground">Nintendo</span>
            </div>
          </div>
        </div>
      </section>

      {/* Gaming Store */}
      <GamingStore lang={lang as Locale} />

      {/* Repair Services */}
      <section className="section-pad bg-surface/30">
        <div className="container-page">
          <div className="mb-12 text-center">
            <span className="badge-gold mb-4 inline-flex">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
              </svg>
              {lang === "de" ? "Reparatur-Service" : "Repair Service"}
            </span>
            <h2 className="text-3xl font-bold text-foreground md:text-4xl">
              {lang === "de" ? "Konsolen-Reparatur" : "Console Repair"}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted">
              {lang === "de"
                ? "Professionelle Reparaturen für alle Gaming-Konsolen mit Garantie"
                : "Professional repairs for all gaming consoles with warranty"}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* HDMI Port Repair */}
            <div className="tech-card-hover group rounded-2xl p-6">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue/20 to-cyan/20 text-blue">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-foreground">HDMI Port</h3>
              <p className="mt-2 text-muted">
                {lang === "de"
                  ? "Austausch defekter HDMI-Anschlüsse bei PS4, PS5 und Xbox"
                  : "Replacement of defective HDMI ports for PS4, PS5 and Xbox"}
              </p>
              <p className="mt-4 text-lg font-bold text-gold">{lang === "de" ? "ab €79" : "from €79"}</p>
            </div>

            {/* Disc Drive */}
            <div className="tech-card-hover group rounded-2xl p-6">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple/20 to-pink/20 text-purple-400">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 9.563C9 9.252 9.252 9 9.563 9h4.874c.311 0 .563.252.563.563v4.874c0 .311-.252.563-.563.563H9.564A.562.562 0 019 14.437V9.564z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-foreground">{lang === "de" ? "Laufwerk" : "Disc Drive"}</h3>
              <p className="mt-2 text-muted">
                {lang === "de"
                  ? "Reparatur oder Austausch von Blu-ray Laufwerken"
                  : "Repair or replacement of Blu-ray disc drives"}
              </p>
              <p className="mt-4 text-lg font-bold text-gold">{lang === "de" ? "ab €89" : "from €89"}</p>
            </div>

            {/* Thermal Paste */}
            <div className="tech-card-hover group rounded-2xl p-6">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange/20 to-red/20 text-orange">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-foreground">{lang === "de" ? "Wärmeleitpaste" : "Thermal Paste"}</h3>
              <p className="mt-2 text-muted">
                {lang === "de"
                  ? "Erneuerung der Wärmeleitpaste gegen Überhitzung"
                  : "Renewal of thermal paste to prevent overheating"}
              </p>
              <p className="mt-4 text-lg font-bold text-gold">{lang === "de" ? "ab €49" : "from €49"}</p>
            </div>

            {/* Fan Cleaning */}
            <div className="tech-card-hover group rounded-2xl p-6">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan/20 to-blue/20 text-cyan-400">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-foreground">{lang === "de" ? "Lüfter-Reinigung" : "Fan Cleaning"}</h3>
              <p className="mt-2 text-muted">
                {lang === "de"
                  ? "Professionelle Reinigung gegen laute Lüftergeräusche"
                  : "Professional cleaning to reduce fan noise"}
              </p>
              <p className="mt-4 text-lg font-bold text-gold">{lang === "de" ? "ab €39" : "from €39"}</p>
            </div>

            {/* Controller Repair */}
            <div className="tech-card-hover group rounded-2xl p-6">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-green/20 to-emerald/20 text-green">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 11h4M8 9v4M15 12h.01M18 10h.01M17.5 5H6.5a4.5 4.5 0 00-4.5 4.5v4a4.5 4.5 0 004.5 4.5h11a4.5 4.5 0 004.5-4.5v-4A4.5 4.5 0 0017.5 5z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-foreground">{lang === "de" ? "Controller" : "Controller"}</h3>
              <p className="mt-2 text-muted">
                {lang === "de"
                  ? "Stick-Drift, Tasten und Akku-Reparatur"
                  : "Stick drift, buttons and battery repair"}
              </p>
              <p className="mt-4 text-lg font-bold text-gold">{lang === "de" ? "ab €29" : "from €29"}</p>
            </div>

            {/* SSD Upgrade */}
            <div className="tech-card-hover group rounded-2xl p-6">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gold/20 to-amber/20 text-gold">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-foreground">SSD Upgrade</h3>
              <p className="mt-2 text-muted">
                {lang === "de"
                  ? "Speichererweiterung für PS5 und Xbox"
                  : "Storage expansion for PS5 and Xbox"}
              </p>
              <p className="mt-4 text-lg font-bold text-gold">{lang === "de" ? "ab €99" : "from €99"}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="section-pad">
        <div className="container-page">
          <div className="grid gap-6 md:grid-cols-4">
            <div className="tech-card rounded-2xl p-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-green/20 to-emerald/20">
                <svg className="h-7 w-7 text-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <p className="text-2xl font-bold text-foreground">24</p>
              <p className="text-sm text-muted">{lang === "de" ? "Monate Garantie" : "Months Warranty"}</p>
            </div>

            <div className="tech-card rounded-2xl p-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gold/20 to-amber/20">
                <svg className="h-7 w-7 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-2xl font-bold text-foreground">48h</p>
              <p className="text-sm text-muted">{lang === "de" ? "Express-Reparatur" : "Express Repair"}</p>
            </div>

            <div className="tech-card rounded-2xl p-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue/20 to-cyan/20">
                <svg className="h-7 w-7 text-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
              <p className="text-2xl font-bold text-foreground">500+</p>
              <p className="text-sm text-muted">{lang === "de" ? "Konsolen repariert" : "Consoles Repaired"}</p>
            </div>

            <div className="tech-card rounded-2xl p-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple/20 to-pink/20">
                <svg className="h-7 w-7 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
              </div>
              <p className="text-2xl font-bold text-foreground">5.0</p>
              <p className="text-sm text-muted">{lang === "de" ? "Google Bewertung" : "Google Rating"}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-pad bg-surface/30">
        <div className="container-page">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue/20 via-purple/10 to-pink/20 p-10 md:p-16">
            <div className="absolute inset-0 circuit-pattern opacity-20" />
            
            <div className="relative flex flex-col items-center justify-between gap-8 text-center md:flex-row md:text-left">
              <div>
                <h3 className="text-2xl font-bold text-foreground md:text-3xl">
                  {lang === "de" ? "Konsole defekt?" : "Console broken?"}
                </h3>
                <p className="mt-2 text-muted">
                  {lang === "de"
                    ? "Bring sie vorbei – wir machen eine kostenlose Diagnose und beraten dich."
                    : "Bring it by – we'll do a free diagnosis and give you advice."}
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
