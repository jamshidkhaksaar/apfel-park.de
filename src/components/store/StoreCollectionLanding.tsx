import Link from "next/link";
import { notFound } from "next/navigation";

import StoreCommerceHeader from "@/components/store/StoreCommerceHeader";
import StoreGrid from "@/components/store/StoreGrid";
import type { Locale } from "@/lib/i18n";
import {
  getStoreCatalog,
  parseStoreCatalogFilters,
  parseStoreSort,
  type StoreCatalogCollection,
} from "@/lib/products";
import { safeJsonStringify } from "@/lib/security";
import { siteInfo } from "@/lib/site";
import { getStoreCollectionCopy } from "@/lib/store-collections";
import { buildCollectionPageSchema, buildListingBreadcrumbSchema } from "@/lib/store-schema";
import {
  buildStoreCanonicalUrl,
  isStorePaginationOutOfRange,
  resolveStoreIndexing,
} from "@/lib/store-indexing";

export default async function StoreCollectionLanding({
  collection,
  locale,
  query,
}: {
  collection: StoreCatalogCollection;
  locale: Locale;
  query: Record<string, string | string[] | undefined>;
}) {
  const copy = getStoreCollectionCopy(collection, locale);
  const indexing = resolveStoreIndexing(query);
  const sort = parseStoreSort(query.sort);
  const page = indexing.page;
  const activeFilters = parseStoreCatalogFilters(query);
  const catalog = await getStoreCatalog({
    category: "smartphones",
    collection,
    sort,
    page,
    pageSize: 24,
    locale,
    filters: activeFilters,
  });
  if (isStorePaginationOutOfRange(indexing.page, catalog.pages)) notFound();
  const pageUrl = buildStoreCanonicalUrl(`${siteInfo.url}/${locale}${copy.path}`, indexing);
  const collectionPage = buildCollectionPageSchema({
    lang: locale,
    name: copy.title,
    description: copy.description,
    url: pageUrl,
    catalog: { total: catalog.total, page: catalog.page },
    products: catalog.products,
  });
  const breadcrumb = buildListingBreadcrumbSchema({
    lang: locale,
    name: copy.title,
    url: pageUrl,
    catalog: { total: catalog.total, page: catalog.page },
    products: catalog.products,
    parent: { name: "Smartphones", url: `${siteInfo.url}/${locale}/smartphones` },
  });

  return (
    <div className="bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonStringify(collectionPage) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonStringify(breadcrumb) }} />

      <StoreCommerceHeader lang={locale} title={copy.title} subtitle={copy.description} eyebrow={copy.eyebrow} query={activeFilters.query} resultCount={catalog.total} />

      <section className="bg-store-ground py-6 md:py-8" id="angebote">
        <div className="container-page">
          <StoreGrid
            products={catalog.products}
            lang={locale}
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
          {catalog.total === 0 ? (
            <div className="mt-8 rounded-2xl border border-border bg-store-card p-6 text-center text-muted">
              <p>{locale === "de" ? "Aktuell ist in dieser Kategorie kein Gerät verfügbar." : "No device is currently available in this collection."}</p>
              <Link href={`/${locale}/smartphones`} className="mt-3 inline-block font-semibold text-gold hover:underline">
                {locale === "de" ? "Alle Smartphones ansehen" : "View all smartphones"}
              </Link>
            </div>
          ) : null}
        </div>
      </section>

      <section className="border-y border-border/60 bg-surface/30 py-8">
        <div className="container-page grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-start">
          <div>
            <h2 className="text-2xl font-bold text-foreground">{copy.introTitle}</h2>
            {copy.intro.map((paragraph) => <p key={paragraph} className="mt-3 max-w-3xl text-sm leading-7 text-muted">{paragraph}</p>)}
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {copy.benefits.map((benefit) => (
              <div key={benefit.title} className="rounded-xl border border-gold/20 bg-gold/5 p-4">
                <h3 className="text-sm font-bold text-foreground">{benefit.title}</h3>
                <p className="mt-1 text-xs leading-5 text-muted">{benefit.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad bg-surface/30" aria-labelledby="collection-faq-heading">
        <div className="container-page">
          <h2 id="collection-faq-heading" className="text-2xl font-bold text-foreground md:text-3xl">
            {locale === "de" ? "Häufige Fragen" : "Frequently asked questions"}
          </h2>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {copy.faq.map((item) => (
              <article key={item.question} className="rounded-2xl border border-border bg-store-card p-6">
                <h3 className="font-bold text-foreground">{item.question}</h3>
                <p className="mt-3 text-sm leading-6 text-muted">{item.answer}</p>
              </article>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={`/${locale}/iphone-17`} className="rounded-full border border-gold/30 px-5 py-2 text-sm font-semibold text-gold hover:bg-gold/10">iPhone 17</Link>
            <Link href={`/${locale}/iphone-16-pro-max`} className="rounded-full border border-gold/30 px-5 py-2 text-sm font-semibold text-gold hover:bg-gold/10">iPhone 16 Pro Max</Link>
            <Link href={`/${locale}/samsung-handys`} className="rounded-full border border-gold/30 px-5 py-2 text-sm font-semibold text-gold hover:bg-gold/10">{locale === "de" ? "Samsung Handys" : "Samsung Phones"}</Link>
            <Link href={`/${locale}/xiaomi-redmi-handys`} className="rounded-full border border-gold/30 px-5 py-2 text-sm font-semibold text-gold hover:bg-gold/10">Xiaomi, Redmi & Poco</Link>
            <Link href={`/${locale}/handys-ohne-vertrag`} className="rounded-full border border-gold/30 px-5 py-2 text-sm font-semibold text-gold hover:bg-gold/10">{locale === "de" ? "Handys ohne Vertrag" : "Phones without a contract"}</Link>
            <Link href={`/${locale}/gebrauchte-iphones`} className="rounded-full border border-gold/30 px-5 py-2 text-sm font-semibold text-gold hover:bg-gold/10">{locale === "de" ? "Gebrauchte iPhones" : "Used iPhones"}</Link>
            <Link href={`/${locale}/gebrauchte-handys`} className="rounded-full border border-gold/30 px-5 py-2 text-sm font-semibold text-gold hover:bg-gold/10">{locale === "de" ? "Gebrauchte Handys" : "Used phones"}</Link>
            <Link href={`/${locale}/device-conditions`} className="rounded-full border border-white/15 px-5 py-2 text-sm font-semibold text-foreground hover:border-gold/30">{locale === "de" ? "Gerätezustände erklärt" : "Device conditions explained"}</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
