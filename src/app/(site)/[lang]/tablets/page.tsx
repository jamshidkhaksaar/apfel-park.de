import type { Metadata } from "next";

import PageIntro from "@/components/PageIntro";
import StoreGrid from "@/components/store/StoreGrid";
import { getDictionary, type Locale } from "@/lib/i18n";
import { createMetadata } from "@/lib/metadata";
import { getStoreCatalog, parseStoreCatalogFilters, parseStorePage, parseStoreSort } from "@/lib/products";

export const dynamic = "force-dynamic";

export const generateMetadata = async ({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> => {
  const { lang } = await params;
  const dict = getDictionary(lang as Locale);
  return createMetadata(lang as Locale, dict.meta.tablets.title, dict.meta.tablets.description, "/tablets");
};

export default async function TabletsPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { lang } = await params;
  const query = await searchParams;
  const locale = lang as Locale;
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

  return (
    <div className="bg-background">
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
