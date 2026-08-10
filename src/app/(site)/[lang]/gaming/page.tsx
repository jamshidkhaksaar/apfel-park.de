import type { Metadata } from "next";
import Link from "next/link";

import PageIntro from "../../../../components/PageIntro";
import StoreGrid from "../../../../components/store/StoreGrid";
import { getDictionary } from "../../../../lib/i18n";
import { createMetadata } from "../../../../lib/metadata";
import { getStoreCatalog, parseStoreCatalogFilters, parseStorePage, parseStoreSort } from "../../../../lib/products";
import { siteInfo } from "../../../../lib/site";
import { getGamingContent } from "../../../../lib/content";
import { requireLocale } from "@/lib/route-locale";

export const dynamic = "force-dynamic";

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> => {
  const { lang: rawLang } = await params;
  const lang = requireLocale(rawLang);
  const dict = getDictionary(lang);
  const catalog = await getStoreCatalog({ category: "consoles", page: 1, pageSize: 1, locale: lang });
  return createMetadata(
    lang,
    dict.meta.gaming.title,
    dict.meta.gaming.description,
    "/gaming",
    undefined,
    { noindex: catalog.total === 0 },
  );
};

export default async function GamingPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { lang: rawLang } = await params;
  const lang = requireLocale(rawLang);
  const query = await searchParams;
  const dict = getDictionary(lang);
  const gaming = await getGamingContent(lang);
  const sort = parseStoreSort(query.sort);
  const page = parseStorePage(query.page);
  const activeFilters = parseStoreCatalogFilters(query);

  const catalog = await getStoreCatalog({
    category: "consoles",
    sort,
    page,
    pageSize: 24,
    locale: lang,
    filters: activeFilters,
  });

  return (
    <div className="bg-background">
      <PageIntro
        title={gaming.heroTitle}
        subtitle={gaming.heroSubtitle}
        eyebrow={dict.meta.gaming.title}
      />

      {/* Console Brands */}
      <section className="border-b border-white/5 bg-surface/30 py-8">
        <div className="container-page">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
            {/* PlayStation */}
            <div className="group flex flex-col items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gold/20 to-amber/10 transition group-hover:from-gold/30 group-hover:to-amber/20">
                <svg className="h-8 w-8 text-gold transition group-hover:text-gold" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8.985 2.596v17.548l3.915 1.261V6.688c0-.69.304-1.151.794-.991.636.181.76.814.76 1.505v5.876c2.441 1.193 4.362-.002 4.362-3.153 0-3.237-1.126-4.675-4.438-5.827-1.307-.448-3.728-1.186-5.391-1.502h-.002zm4.656 16.242l6.296-2.275c.715-.258.826-.625.246-.818-.586-.192-1.637-.139-2.357.123l-4.205 1.500v-2.385l.24-.085s1.201-.42 2.913-.615c1.696-.18 3.785.03 5.437.661 1.848.601 2.041 1.472 1.576 2.072s-1.622 1.036-1.622 1.036l-8.544 3.107v-2.297l.02-.024zM1.985 18.042c-1.725-.521-2.001-1.615-1.228-2.168.718-.514 1.946-.903 1.946-.903l5.131-1.828v2.301l-3.681 1.319c-.715.256-.826.627-.246.818.585.192 1.637.139 2.355-.123l1.572-.561v2.063c-.083.014-.18.035-.27.046-1.493.18-3.073-.044-4.539-.54-.457-.149-.891-.343-1.04-.424z"/>
                </svg>
              </div>
              <span className="text-sm font-medium text-muted group-hover:text-foreground">PlayStation</span>
            </div>

            {/* Xbox */}
            <div className="group flex flex-col items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gold/20 to-amber/10 transition group-hover:from-gold/30 group-hover:to-amber/20">
                <svg className="h-8 w-8 text-gold transition group-hover:text-gold" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4.102 21.033C6.211 22.881 8.977 24 12 24c3.026 0 5.789-1.119 7.902-2.967 1.877-1.912-4.316-8.709-7.902-11.417-3.582 2.708-9.779 9.505-7.898 11.417zm11.16-14.406c2.5 2.961 7.484 10.313 6.076 12.912C23.056 17.036 24 14.62 24 12c0-5.172-3.264-9.581-7.849-11.291-.547-.104-1.326.178-1.423.323-.096.144.536.556.536.556l-.002.039zm-6.523 0l-.001-.039s.632-.412.535-.556c-.097-.145-.875-.427-1.422-.323C3.263 2.419 0 6.828 0 12c0 2.62.944 5.036 2.662 6.539-1.408-2.599 3.576-9.951 6.077-12.912z"/>
                </svg>
              </div>
              <span className="text-sm font-medium text-muted group-hover:text-foreground">Xbox</span>
            </div>

            {/* Nintendo */}
            <div className="group flex flex-col items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gold/20 to-amber/10 transition group-hover:from-gold/30 group-hover:to-amber/20">
                <svg className="h-8 w-8 text-gold transition group-hover:text-gold" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10.04 20.4H2.94c-1.63 0-2.94-1.32-2.94-2.94V6.54C0 4.9 1.32 3.6 2.94 3.6h7.1v16.8zm1.92-16.8h7.1c1.63 0 2.94 1.31 2.94 2.94v10.92c0 1.62-1.32 2.94-2.94 2.94h-7.1V3.6zM5.97 7.68a2.94 2.94 0 100 5.88 2.94 2.94 0 000-5.88zm12.06 5.52a1.56 1.56 0 100-3.12 1.56 1.56 0 000 3.12z"/>
                </svg>
              </div>
              <span className="text-sm font-medium text-muted group-hover:text-foreground">Nintendo</span>
            </div>
          </div>
        </div>
      </section>

      {/* Gaming Store */}
      <section className="section-pad" id="store">
        <div className="container-page">
          <StoreGrid
            products={catalog.products}
            lang={lang}
            lockedCategory="consoles"
            sortBy={sort}
            total={catalog.total}
            page={catalog.page}
            pages={catalog.pages}
            counts={catalog.counts}
            facets={catalog.facets}
            activeFilters={activeFilters}
          />
        </div>
      </section>

      {/* Repair Services */}
      {/* Why Choose Us */}
      <section className="section-pad">
        <div className="container-page">
          <div className="grid gap-6 md:grid-cols-4">
            <div className="tech-card rounded-2xl p-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gold/20 to-amber/20">
                <svg className="h-7 w-7 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <p className="text-lg font-bold text-foreground">{lang === "de" ? "Klare Diagnose" : "Clear diagnosis"}</p>
              <p className="text-sm text-muted">{lang === "de" ? "Wir sagen dir ehrlich, welches Gerät zu dir passt – auch wenn es das günstigere ist." : "We tell you honestly which device suits you, even when that is the cheaper one."}</p>
            </div>

            <div className="tech-card rounded-2xl p-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gold/20 to-amber/20">
                <svg className="h-7 w-7 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-lg font-bold text-foreground">{lang === "de" ? "Schnelle Rückmeldung" : "Fast response"}</p>
              <p className="text-sm text-muted">{lang === "de" ? "Wir prüfen den Schaden und melden uns mit dem nächsten Schritt." : "We inspect the issue and come back with the next step."}</p>
            </div>

            <div className="tech-card rounded-2xl p-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gold/20 to-amber/20">
                <svg className="h-7 w-7 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
              <p className="text-lg font-bold text-foreground">{lang === "de" ? "Saubere Ausführung" : "Clean execution"}</p>
              <p className="text-sm text-muted">{lang === "de" ? "Jedes Gerät wird vor dem Verkauf geprüft, mit klar ausgewiesenem Zustand." : "Every device is tested before sale, with its condition clearly stated."}</p>
            </div>

            <div className="tech-card rounded-2xl p-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gold/20 to-amber/20">
                <svg className="h-7 w-7 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
              </div>
              <p className="text-lg font-bold text-foreground">{lang === "de" ? "Persönliche Beratung" : "Personal advice"}</p>
              <p className="text-sm text-muted">{lang === "de" ? "Komm im Laden in Wilhelmsburg vorbei oder ruf an, bevor du entscheidest." : "Drop into the Wilhelmsburg store or call us before you decide."}</p>
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
