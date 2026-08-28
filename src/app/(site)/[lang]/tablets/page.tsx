import type { Metadata } from "next";
import Link from "next/link";

import StoreCommerceHeader from "@/components/store/StoreCommerceHeader";
import StoreGrid from "@/components/store/StoreGrid";
import { getDictionary } from "@/lib/i18n";
import { createMetadata } from "@/lib/metadata";
import { getStoreCatalog, hasCatalogSearchQuery, parseStoreCatalogFilters, parseStorePage, parseStoreSort } from "@/lib/products";
import { requireLocale } from "@/lib/route-locale";
import { safeJsonStringify } from "@/lib/security";
import { siteInfo } from "@/lib/site";
import { buildCollectionPageSchema, buildListingBreadcrumbSchema } from "@/lib/store-schema";

export const dynamic = "force-dynamic";

export const generateMetadata = async ({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }): Promise<Metadata> => {
  const [{ lang: rawLang }, query] = await Promise.all([params, searchParams]);
  const lang = requireLocale(rawLang);
  const dict = getDictionary(lang);
  return createMetadata(lang, dict.meta.tablets.title, dict.meta.tablets.description, "/tablets", undefined, { noindex: hasCatalogSearchQuery(query) });
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
      <StoreCommerceHeader
        lang={locale}
        eyebrow={locale === "de" ? "Tablets" : "Tablets"}
        title={locale === "de" ? "Tablets und iPads" : "Tablets and iPads"}
        subtitle={locale === "de" ? "Geräte mit klar ausgewiesenem Zustand, Garantie und persönlicher Beratung in Hamburg." : "Devices with clearly stated condition, warranty, and personal advice in Hamburg."}
        query={activeFilters.query}
        resultCount={catalog.total}
        breadcrumbs={[{ label: "Tablets" }]}
      />
      <section className="bg-store-ground py-6 md:py-8">
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
            showSearch={false}
          />

          <div className="mt-14 border-t border-border/60 pt-10">
            <h2 className="text-2xl font-semibold text-foreground">
              {locale === "de" ? "Tablet vor dem Kauf vergleichen" : "Compare a tablet before buying"}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
              {locale === "de"
                ? "Auf jeder Produktseite findest du den konkreten Gerätezustand, Preis, Lagerbestand und verfügbare Varianten. So kannst du Neuware, Open-Box und gebrauchte Geräte getrennt bewerten."
                : "Each product page shows the exact device condition, price, stock and available variants, so you can assess new, open-box and used devices separately."}
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="tech-card rounded-2xl p-5">
                <h3 className="font-semibold text-foreground">{locale === "de" ? "Zustand" : "Condition"}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">
                  {locale === "de" ? "Neu ist versiegelt; geöffnete oder zuvor genutzte Ware wird separat gekennzeichnet." : "New stock is sealed; opened or previously used stock is labelled separately."}
                </p>
                <Link href={`/${locale}/device-conditions`} className="mt-4 inline-flex min-h-11 items-center text-sm font-medium text-gold hover:text-gold-soft">
                  {locale === "de" ? "Gerätezustände verstehen" : "Understand device conditions"}
                </Link>
              </div>
              <div className="tech-card rounded-2xl p-5">
                <h3 className="font-semibold text-foreground">{locale === "de" ? "Lieferung oder Abholung" : "Delivery or collection"}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">
                  {locale === "de" ? "Kostenlose Abholung in Hamburg-Wilhelmsburg oder versicherter Versand innerhalb Deutschlands." : "Free collection in Hamburg-Wilhelmsburg or insured delivery within Germany."}
                </p>
                <Link href={`/${locale}/delivery-returns`} className="mt-4 inline-flex min-h-11 items-center text-sm font-medium text-gold hover:text-gold-soft">
                  {locale === "de" ? "Lieferung & Rückgabe" : "Delivery & returns"}
                </Link>
              </div>
              <div className="tech-card rounded-2xl p-5">
                <h3 className="font-semibold text-foreground">{locale === "de" ? "Rechte & Garantie" : "Rights & warranty"}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">
                  {locale === "de" ? "14 Tage Widerrufsrecht beim Online-Kauf, gesetzliche Mängelrechte und zusätzlich 12 Monate Garantie." : "A 14-day online withdrawal right, statutory defect rights and an additional 12-month commercial warranty."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
