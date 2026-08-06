import type { Metadata } from "next";

import PageIntro from "../../../../components/PageIntro";
import StoreGrid from "../../../../components/store/StoreGrid";
import StoreCollectionLinks from "../../../../components/store/StoreCollectionLinks";
import { type Locale } from "../../../../lib/i18n";
import { createMetadata } from "../../../../lib/metadata";
import { getStoreCatalog, parseStoreCatalogFilters, parseStorePage, parseStoreSort } from "../../../../lib/products";
import { requireLocale } from "@/lib/route-locale";
import { safeJsonStringify } from "@/lib/security";
import { siteInfo } from "@/lib/site";
import { buildCollectionPageSchema, buildListingBreadcrumbSchema } from "@/lib/store-schema";

export const dynamic = "force-dynamic";

// "Open Box" is the label used on the products, but almost nobody searches it
// in Germany -- roughly 10 searches a month against 430 for "B-Ware" at
// difficulty 0. Both terms are used here because they are not quite
// synonymous: B-Ware is the broader German category and can include
// cosmetically damaged goods, while these units are opened but undamaged.
// Saying so is both accurate and the selling point.
const copy = {
  de: {
    title: "B-Ware & Open-Box Handys kaufen",
    description:
      "B-Ware und Open-Box Smartphones bei Apfel Park Hamburg: geöffnete Vorführ- und Retourengeräte in einwandfreiem Zustand, geprüft, mit Garantie und deutlich günstiger als neu.",
    explainer:
      "B-Ware heißt bei uns nicht beschädigt. Es sind Originalgeräte, deren Verpackung geöffnet wurde – Vorführgeräte, Retouren oder Umtausch. Jedes Gerät wird vollständig geprüft, bevor es in den Verkauf geht, und du bekommst dieselbe Garantie wie auf Neuware. Anders als bei vielen B-Ware-Angeboten verkaufen wir keine Geräte mit Kratzern oder Gebrauchsspuren – dafür haben wir die Kategorie gebrauchte Geräte.",
    empty: "Aktuell sind keine B-Ware- oder Open-Box-Artikel verfügbar. Schau bald wieder vorbei.",
  },
  en: {
    title: "Buy Open-Box Phones & Tablets",
    description:
      "Open-box smartphones at Apfel Park Hamburg: opened display and return units in flawless condition, fully tested, with warranty, and noticeably cheaper than new.",
    explainer:
      "Open box does not mean damaged. These are original devices whose packaging was opened – display units, returns or exchanges. Every device is fully tested before it goes on sale, and you get the same warranty as on new stock. Unlike many discounted listings, we do not sell devices with scratches or visible wear; those belong in our used category.",
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

  const pageUrl = `${siteInfo.url}/${locale}/open-box`;
  const collectionPage = buildCollectionPageSchema({
    lang: locale,
    name: t.title,
    description: t.description,
    url: pageUrl,
    catalog: { total: catalog.total, page: catalog.page },
    products: catalog.products,
  });
  const breadcrumb = buildListingBreadcrumbSchema({
    lang: locale,
    name: t.title,
    url: pageUrl,
    catalog: { total: catalog.total, page: catalog.page },
    products: catalog.products,
  });

  return (
    <div className="bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonStringify(collectionPage) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonStringify(breadcrumb) }} />
      <PageIntro title={t.title} subtitle={t.description} eyebrow={t.title} />

      <section className="border-b border-border/60 pb-8">
        <div className="container-page">
          <p className="max-w-3xl text-sm leading-6 text-muted">{t.explainer}</p>
        </div>
      </section>

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
