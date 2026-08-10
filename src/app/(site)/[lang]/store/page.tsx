import type { Metadata } from "next";

import PageIntro from "../../../../components/PageIntro";
import StoreCollectionLinks from "../../../../components/store/StoreCollectionLinks";
import StoreGrid from "../../../../components/store/StoreGrid";
import TrendingProductsCarousel from "../../../../components/store/TrendingProductsCarousel";
import { createMetadata } from "../../../../lib/metadata";
import { getStoreCatalog, getTrendingProducts, parseStoreCatalogFilters, parseStorePage, parseStoreSort, type StoreCatalogCategory } from "../../../../lib/products";
import { requireLocale } from "@/lib/route-locale";
import { safeJsonStringify } from "@/lib/security";
import { siteInfo } from "@/lib/site";
import { buildCollectionPageSchema, buildListingBreadcrumbSchema } from "@/lib/store-schema";

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> => {
  const { lang: rawLang } = await params;
  const lang = requireLocale(rawLang);
  return createMetadata(
    lang,
    lang === "de" ? "Online Shop" : "Online Store",
    lang === "de" ? "Smartphones, Tablets und Zubehör mit klaren Angaben zu Zustand, Preis und Verfügbarkeit kaufen." : "Buy smartphones, tablets and accessories with clear condition, price and availability details.",
    "/store",
  );
};

const catalogCategories = new Set<StoreCatalogCategory>(["all", "smartphones", "tablets", "open-box-smartphones-tablets", "accessories", "consoles", "laptops"]);
const valueOf = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] ?? "" : value ?? "";

export default async function StorePage({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { lang: rawLang } = await params;
  const lang = requireLocale(rawLang);
  const locale = lang;
  const query = await searchParams;
  const requestedCategory = valueOf(query.category) as StoreCatalogCategory;
  const category = catalogCategories.has(requestedCategory) ? requestedCategory : "all";
  const sort = parseStoreSort(query.sort);
  const page = parseStorePage(query.page);
  const activeFilters = parseStoreCatalogFilters(query);
  const [catalog, trendingProducts] = await Promise.all([
    getStoreCatalog({ category, sort, page, pageSize: 24, locale, filters: activeFilters }),
    getTrendingProducts(locale, 8),
  ]);

  const pageUrl = `${siteInfo.url}/${lang}/store`;
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
      <PageIntro
        title={lang === "de" ? "Online Shop" : "Online Store"}
        subtitle={lang === "de" 
          ? "Smartphones, Tablets und Zubehör mit klar ausgewiesenem Zustand, Preis und Verfügbarkeit."
          : "Smartphones, tablets and accessories with clearly stated condition, price and availability."}
        eyebrow={lang === "de" ? "Marktplatz" : "Marketplace"}
      />

      <StoreCollectionLinks lang={locale} />

      <section className="section-pad">
        <div className="container-page">
          <TrendingProductsCarousel products={trendingProducts} lang={locale} />
          <StoreGrid products={catalog.products} lang={locale} activeCategory={category} sortBy={sort} total={catalog.total} page={catalog.page} pages={catalog.pages} counts={catalog.counts} facets={catalog.facets} activeFilters={activeFilters} />
        </div>
      </section>
    </div>
  );
}
