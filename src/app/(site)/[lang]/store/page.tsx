import type { Metadata } from "next";
import { notFound } from "next/navigation";

import StoreCollectionLinks from "../../../../components/store/StoreCollectionLinks";
import StoreCommerceHeader from "../../../../components/store/StoreCommerceHeader";
import StoreGrid from "../../../../components/store/StoreGrid";
import ConditionExplainer from "@/components/store/ConditionExplainer";
import BlackFridayStoreBand from "@/components/black-friday/BlackFridayStoreBand";
import IPhoneBanner from "@/components/banner/IPhoneBanner";
import { createMetadata } from "../../../../lib/metadata";
import { getProducts, getStoreCatalog, getTrendingProducts, parseStoreCatalogFilters, parseStoreSort, type StoreCatalogCategory } from "../../../../lib/products";
import { requireLocale } from "@/lib/route-locale";
import { safeJsonStringify } from "@/lib/security";
import { getEffectiveCampaign } from "@/lib/seasonal-theme-server";
import { siteInfo } from "@/lib/site";
import { buildCollectionPageSchema, buildListingBreadcrumbSchema } from "@/lib/store-schema";
import {
  buildStoreCanonicalUrl,
  isStorePaginationOutOfRange,
  resolveStoreIndexing,
} from "@/lib/store-indexing";

export const generateMetadata = async ({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> => {
  const [{ lang: rawLang }, query] = await Promise.all([params, searchParams]);
  const lang = requireLocale(rawLang);
  const indexing = resolveStoreIndexing(query);
  return createMetadata(
    lang,
    lang === "de"
      ? "Smartphones, Tablets & Zubehör kaufen – neu, Open Box, Zustand A+"
      : "Buy smartphones, tablets & accessories – new, Open Box, Grade A+",
    lang === "de"
      ? "Smartphones, Tablets und Zubehör bei Apfel Park: neu versiegelt, Open Box oder geprüft gebraucht (Zustand A+). Abholung im LunaCenter Wilhelmsburg oder versicherter Versand in 1–3 Werktagen."
      : "Smartphones, tablets and accessories at Apfel Park: new sealed, Open Box or tested pre-owned (Grade A+). Collect at the LunaCenter Wilhelmsburg or get insured delivery in 1–3 business days.",
    "/store",
    undefined,
    { noindex: indexing.noindex, canonicalQuery: indexing.canonicalQuery },
  );
};

const catalogCategories = new Set<StoreCatalogCategory>(["all", "smartphones", "tablets", "open-box-smartphones-tablets", "accessories", "parts", "consoles", "laptops"]);
const valueOf = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] ?? "" : value ?? "";

export default async function StorePage({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { lang: rawLang } = await params;
  const lang = requireLocale(rawLang);
  const locale = lang;
  const query = await searchParams;
  const { theme: season } = await getEffectiveCampaign();
  const indexing = resolveStoreIndexing(query);
  const requestedCategory = valueOf(query.category) as StoreCatalogCategory;
  const category = catalogCategories.has(requestedCategory) ? requestedCategory : "all";
  const sort = parseStoreSort(query.sort);
  const page = indexing.page;
  const activeFilters = parseStoreCatalogFilters(query);
  const [catalog, trendingProducts, allProducts] = await Promise.all([
    getStoreCatalog({ category, sort, page, pageSize: 24, locale, filters: activeFilters, merchandising: "storefront" }),
    getTrendingProducts(locale, 8),
    getProducts(undefined, undefined, locale),
  ]);
  if (isStorePaginationOutOfRange(indexing.page, catalog.pages)) notFound();
  const showTrending = page === 1
    && sort === "featured"
    && category === "all"
    && !activeFilters.query
    && activeFilters.brands.length === 0
    && activeFilters.storages.length === 0
    && activeFilters.conditions.length === 0
    && activeFilters.accessoryTypes.length === 0
    && !activeFilters.inStockOnly
    && activeFilters.priceMin === undefined
    && activeFilters.priceMax === undefined;

  const pageUrl = buildStoreCanonicalUrl(`${siteInfo.url}/${lang}/store`, indexing);
  const storeName = lang === "de" ? "Online Shop" : "Online Store";
  const collectionPage = buildCollectionPageSchema({
    lang: locale,
    name: storeName,
    url: pageUrl,
    catalog: { total: catalog.total, page: catalog.page },
    products: catalog.products,
  });
  const breadcrumb = buildListingBreadcrumbSchema({
    lang: locale,
    name: storeName,
    url: pageUrl,
    catalog: { total: catalog.total, page: catalog.page },
    products: catalog.products,
  });

  return (
    <div className="bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonStringify(collectionPage) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonStringify(breadcrumb) }} />
      <StoreCommerceHeader
        lang={locale}
        title={lang === "de"
          ? "Smartphones, Tablets & Zubehör – neu, Open Box & gebraucht (Zustand A+)"
          : "Smartphones, tablets & accessories – new, Open Box & used (Grade A+)"}
        subtitle={lang === "de"
          ? "Versiegelt, Open Box oder geprüft gebraucht – Abholung in Wilhelmsburg oder Versand in 1–3 Werktagen."
          : "Sealed, Open Box or tested pre-owned – collect in Wilhelmsburg or get delivery in 1–3 business days."}
        eyebrow={season ? "Apfel Park Black Week" : lang === "de" ? "Marktplatz" : "Marketplace"}
        query={activeFilters.query}
        resultCount={catalog.total}
      />

      <ConditionExplainer locale={locale} />

      {season ? (
        <BlackFridayStoreBand lang={locale} />
      ) : null}

      <StoreCollectionLinks lang={locale} products={allProducts} />

      {/* During the campaign the deals are the store's call to action; the
          gold iPhone banner would out-shout them directly above the grid. */}
      {season ? null : (
        <div className="container-page py-4">
          <IPhoneBanner lang={locale} headingLevel="h3" shopHref={`/${locale}/iphone-18-pro`} />
        </div>
      )}

      <section className="bg-store-ground py-6 md:py-8">
        <div className="container-page">
          <StoreGrid products={catalog.products} trendingProducts={showTrending ? trendingProducts : []} lang={locale} activeCategory={category} sortBy={sort} total={catalog.total} page={catalog.page} pages={catalog.pages} counts={catalog.counts} facets={catalog.facets} activeFilters={activeFilters} showSearch={false} />
        </div>
      </section>
    </div>
  );
}
