import type { Metadata } from "next";

import PageIntro from "../../../../components/PageIntro";
import StoreGrid from "../../../../components/store/StoreGrid";
import StoreCollectionLinks from "../../../../components/store/StoreCollectionLinks";
import { type Locale } from "../../../../lib/i18n";
import { createMetadata } from "../../../../lib/metadata";
import { getStoreCatalog, parseStoreCatalogFilters, parseStorePage, parseStoreSort } from "../../../../lib/products";
import { requireLocale } from "@/lib/route-locale";

export const dynamic = "force-dynamic";

const copy = {
  de: {
    title: "Open-Box Smartphones & Tablets kaufen",
    description:
      "Geöffnete Vorführ- und Retourengeräte in einwandfreiem Zustand – geprüft, mit Garantie und zum reduzierten Preis.",
    empty: "Aktuell sind keine Open-Box-Artikel verfügbar. Schau bald wieder vorbei.",
  },
  en: {
    title: "Buy Open-Box Phones & Tablets",
    description:
      "Opened display and return units in flawless condition – tested, with warranty, at a reduced price.",
    empty: "No open-box items are available right now. Check back soon.",
  },
} as const;

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> => {
  const { lang: rawLang } = await params;
  const lang = requireLocale(rawLang);
  const locale = (lang === "en" ? "en" : "de") as Locale;
  return createMetadata(locale, copy[locale].title, copy[locale].description, "/open-box");
};

export default async function OpenBoxPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { lang: rawLang } = await params;
  const lang = requireLocale(rawLang);
  const query = await searchParams;
  const locale = (lang === "en" ? "en" : "de") as Locale;
  const sort = parseStoreSort(query.sort);
  const page = parseStorePage(query.page);
  const activeFilters = parseStoreCatalogFilters(query);
  const t = copy[locale];

  const catalog = await getStoreCatalog({
    category: "open-box-smartphones-tablets",
    sort,
    page,
    pageSize: 24,
    locale,
    filters: activeFilters,
  });

  return (
    <div className="bg-background">
      <PageIntro title={t.title} subtitle={t.description} eyebrow={t.title} />

      <StoreCollectionLinks lang={locale} />

      <section className="section-pad">
        <div className="container-page">
          <StoreGrid
            products={catalog.products}
            lang={locale}
            lockedCategory="open-box-smartphones-tablets"
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
