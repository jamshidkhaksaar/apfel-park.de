import type { Metadata } from "next";
import Link from "next/link";

import StoreCommerceHeader from "../../../../components/store/StoreCommerceHeader";
import StoreGrid from "../../../../components/store/StoreGrid";
import StoreCollectionLinks from "../../../../components/store/StoreCollectionLinks";
import { getDictionary } from "../../../../lib/i18n";
import { createMetadata } from "../../../../lib/metadata";
import { getStoreCatalog, hasCatalogSearchQuery, parseStoreCatalogFilters, parseStorePage, parseStoreSort } from "../../../../lib/products";
import { siteInfo } from "../../../../lib/site";
import { getSmartphonesContent } from "../../../../lib/content";
import { requireLocale } from "@/lib/route-locale";
import { safeJsonStringify } from "@/lib/security";
import { buildCollectionPageSchema, buildListingBreadcrumbSchema } from "@/lib/store-schema";

export const dynamic = "force-dynamic";

export const generateMetadata = async ({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> => {
  const [{ lang: rawLang }, query] = await Promise.all([params, searchParams]);
  const lang = requireLocale(rawLang);
  const dict = getDictionary(lang);
  return createMetadata(
    lang,
    dict.meta.smartphones.title,
    dict.meta.smartphones.description,
    "/smartphones",
    undefined,
    { noindex: hasCatalogSearchQuery(query) },
  );
};

export default async function SmartphonesPage({
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
  const smartphonesContent = await getSmartphonesContent(lang);
  const sort = parseStoreSort(query.sort);
  const page = parseStorePage(query.page);
  const activeFilters = parseStoreCatalogFilters(query);
  const catalog = await getStoreCatalog({
    category: "smartphones",
    sort,
    page,
    pageSize: 24,
    locale: lang,
    filters: activeFilters,
  });

  const pageUrl = `${siteInfo.url}/${lang}/smartphones`;
  const smartphonesName = dict.meta.smartphones.title;
  const collectionPage = buildCollectionPageSchema({
    lang,
    name: smartphonesName,
    description: dict.meta.smartphones.description,
    url: pageUrl,
    catalog: { total: catalog.total, page: catalog.page },
    products: catalog.products,
  });
  const breadcrumb = buildListingBreadcrumbSchema({
    lang,
    name: smartphonesName,
    url: pageUrl,
    catalog: { total: catalog.total, page: catalog.page },
    products: catalog.products,
  });

  return (
    <div className="bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonStringify(collectionPage) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonStringify(breadcrumb) }} />
      <StoreCommerceHeader
        lang={lang}
        title={smartphonesContent.heroTitle}
        subtitle={smartphonesContent.heroSubtitle}
        eyebrow={dict.meta.smartphones.title}
        query={activeFilters.query}
        resultCount={catalog.total}
        breadcrumbs={[{ label: "Smartphones" }]}
      />

      <StoreCollectionLinks lang={lang} products={catalog.products} />

      {/* Smartphone Store Grid with Filters */}
      <section className="bg-store-ground py-6 md:py-8" id="store">
        <div className="container-page">
          <StoreGrid
            products={catalog.products}
            lang={lang}
            lockedCategory="smartphones"
            sortBy={sort}
            total={catalog.total}
            page={catalog.page}
            pages={catalog.pages}
            counts={catalog.counts}
            facets={catalog.facets}
            activeFilters={activeFilters}
            showSearch={false}
          />
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
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gold/10 to-amber/10 transition group-hover:from-gold/20 group-hover:to-amber/20">
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
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gold/20 to-amber/20 text-gold">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-foreground">{lang === "de" ? "Kostenloses Setup" : "Free Setup"}</h3>
              <p className="mt-3 text-muted">
                {lang === "de"
                  ? "Wir richten dein neues Smartphone ein, übertragen Daten und installieren Schutzfolie."
                  : "We set up your new smartphone, transfer data, and install screen protection."}
              </p>
            </div>

            {/* Financing */}
            <div className="tech-card-hover group rounded-2xl p-8">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gold/20 to-amber/20 text-gold">
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
