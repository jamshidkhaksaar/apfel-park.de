import type { Metadata } from "next";

import PageIntro from "@/components/PageIntro";
import StoreGrid from "@/components/store/StoreGrid";
import { getDictionary } from "@/lib/i18n";
import { createMetadata } from "@/lib/metadata";
import { getStoreCatalog, parseStoreCatalogFilters, parseStorePage, parseStoreSort } from "@/lib/products";
import { requireLocale } from "@/lib/route-locale";
import { safeJsonStringify } from "@/lib/security";
import { siteInfo } from "@/lib/site";
import { buildCollectionPageSchema, buildListingBreadcrumbSchema } from "@/lib/store-schema";

export const dynamic = "force-dynamic";

export const generateMetadata = async ({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> => {
  const { lang: rawLang } = await params;
  const lang = requireLocale(rawLang);
  const dict = getDictionary(lang);
  return createMetadata(lang, dict.meta.tablets.title, dict.meta.tablets.description, "/tablets");
};

export default async function TabletsPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { lang: rawLang } = await params;
  const lang = requireLocale(rawLang);
  const query = await searchParams;
  const locale = lang;
  const sort = parseStoreSort(query.sort);
  const page = parseStorePage(query.page);
  const activeFilters = parseStoreCatalogFilters(query);

  const catalog = await getStoreCatalog({
    category: "tablets",
    sort,
    page,
    pageSize: 24,
    locale,
    filters: activeFilters,
  });

  const pageUrl = `${siteInfo.url}/${locale}/tablets`;
  const tabletsName = locale === "de" ? "Tablets" : "Tablets";
  const tabletsDescription =
    locale === "de"
      ? "Geräte mit klar ausgewiesenem Zustand, Garantie und persönlicher Beratung in Hamburg."
      : "Devices with clearly stated condition, warranty, and personal advice in Hamburg.";
  const collectionPage = buildCollectionPageSchema({
    lang: locale,
    name: tabletsName,
    description: tabletsDescription,
    url: pageUrl,
    catalog: { total: catalog.total, page: catalog.page },
    products: catalog.products,
  });
  const breadcrumb = buildListingBreadcrumbSchema({
    lang: locale,
    name: tabletsName,
    url: pageUrl,
    catalog: { total: catalog.total, page: catalog.page },
    products: catalog.products,
  });

  return (
    <div className="bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonStringify(collectionPage) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonStringify(breadcrumb) }} />
      <PageIntro
        eyebrow={locale === "de" ? "Tablets" : "Tablets"}
        title={locale === "de" ? "Tablets und iPads" : "Tablets and iPads"}
        subtitle={locale === "de" ? "Geräte mit klar ausgewiesenem Zustand, Garantie und persönlicher Beratung in Hamburg." : "Devices with clearly stated condition, warranty, and personal advice in Hamburg."}
      />
      <section className="section-pad">
        <div className="container-page">
          <StoreGrid
            products={catalog.products}
            lang={locale}
            lockedCategory="tablets"
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
    </div>
  );
}
