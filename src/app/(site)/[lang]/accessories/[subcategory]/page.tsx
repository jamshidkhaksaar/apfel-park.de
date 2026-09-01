import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import PageIntro from "@/components/PageIntro";
import StoreGrid from "@/components/store/StoreGrid";
import { requireLocale } from "@/lib/route-locale";
import { createMetadata } from "@/lib/metadata";
import {
  countActiveSubcategoryProducts,
  getStoreCatalog,
  parseStoreCatalogFilters,
  parseStoreSort,
} from "@/lib/products";
import { safeJsonStringify } from "@/lib/security";
import { siteInfo } from "@/lib/site";
import { getAccessoryCollection } from "@/lib/accessory-collections";
import {
  buildStoreCanonicalUrl,
  isStorePaginationOutOfRange,
  resolveStoreIndexing,
} from "@/lib/store-indexing";

export const dynamic = "force-dynamic";

export const generateMetadata = async ({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string; subcategory: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> => {
  const [{ lang: rawLang, subcategory }, query] = await Promise.all([params, searchParams]);
  const lang = requireLocale(rawLang);
  const copy = getAccessoryCollection(subcategory, lang);
  const indexing = resolveStoreIndexing(query);
  if (!copy) {
    return createMetadata(
      lang,
      lang === "de" ? "Kategorie nicht gefunden" : "Category not found",
      lang === "de" ? "Diese Kategorie ist nicht verfügbar." : "This category is not available.",
      `/accessories/${subcategory}`,
    );
  }
  // An empty subcategory is thin content; keep it out of the index until it
  // has stock rather than publishing a page with no products on it.
  const available = await countActiveSubcategoryProducts(copy.subcategory);
  return createMetadata(lang, copy.metaTitle, copy.description, `/accessories/${copy.slug}`, undefined, {
    noindex: available === 0 || indexing.noindex,
    canonicalQuery: indexing.canonicalQuery,
  });
};

export default async function AccessorySubcategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string; subcategory: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { lang: rawLang, subcategory } = await params;
  const lang = requireLocale(rawLang);
  const copy = getAccessoryCollection(subcategory, lang);
  if (!copy) notFound();

  const query = await searchParams;
  const indexing = resolveStoreIndexing(query);
  const sort = parseStoreSort(query.sort);
  const page = indexing.page;
  const activeFilters = parseStoreCatalogFilters(query);
  const catalog = await getStoreCatalog({
    category: "accessories",
    subcategory: copy.subcategory,
    sort,
    page,
    pageSize: 24,
    locale: lang,
    filters: activeFilters,
  });
  if (isStorePaginationOutOfRange(indexing.page, catalog.pages)) notFound();

  const pageUrl = buildStoreCanonicalUrl(
    `${siteInfo.url}/${lang}/accessories/${copy.slug}`,
    indexing,
  );
  const collectionPage = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: copy.title,
    description: copy.description,
    url: pageUrl,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: catalog.total,
      itemListElement: catalog.products.map((product, index) => ({
        "@type": "ListItem",
        position: (catalog.page - 1) * 24 + index + 1,
        name: product.title,
        url: `${siteInfo.url}/${lang}/store/${product.slug}`,
      })),
    },
  };
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: lang === "de" ? "Startseite" : "Home", item: `${siteInfo.url}/${lang}` },
      { "@type": "ListItem", position: 2, name: lang === "de" ? "Zubehör" : "Accessories", item: `${siteInfo.url}/${lang}/accessories` },
      { "@type": "ListItem", position: 3, name: copy.title, item: pageUrl },
    ],
  };


  return (
    <div className="bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonStringify(collectionPage) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonStringify(breadcrumb) }} />


      <PageIntro title={copy.title} subtitle={copy.description} eyebrow={copy.eyebrow} />

      <nav className="container-page pt-6 text-xs uppercase tracking-[0.2em] text-muted" aria-label="Breadcrumb">
        <Link href={`/${lang}/accessories`} className="transition hover:text-gold">
          {lang === "de" ? "Zubehör" : "Accessories"}
        </Link>
        <span className="px-2">/</span>
        <span className="text-foreground">{copy.title}</span>
      </nav>

      <section className="border-b border-white/5 py-10">
        <div className="container-page">
          <h2 className="text-2xl font-bold text-foreground md:text-3xl">{copy.introTitle}</h2>
          {copy.intro.map((paragraph) => (
            <p key={paragraph} className="mt-4 max-w-3xl leading-7 text-muted">
              {paragraph}
            </p>
          ))}
        </div>
      </section>

      <section className="bg-store-ground py-6 md:py-8" id="store">
        <div className="container-page">
          {catalog.total === 0 ? (
            <div className="rounded-2xl border border-border/60 bg-surface/40 p-8 text-center">
              <p className="text-foreground">
                {lang === "de"
                  ? "Aktuell ist in dieser Kategorie nichts vorrätig."
                  : "Nothing is in stock in this category right now."}
              </p>
              <p className="mt-2 text-sm text-muted">
                {lang === "de"
                  ? "Schreib uns kurz mit deinem Gerätemodell – wir bestellen passendes Zubehör für dich."
                  : "Send us your device model and we will order the right accessory for you."}
              </p>
              <Link href={`/${lang}/contact`} className="btn-primary mt-5 inline-flex">
                {lang === "de" ? "Anfrage senden" : "Send inquiry"}
              </Link>
            </div>
          ) : null}
          <StoreGrid
            products={catalog.products}
            lang={lang}
            lockedCategory="accessories"
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

      <section className="section-pad bg-surface/30">
        <div className="container-page max-w-3xl">
          <h2 className="text-2xl font-bold text-foreground md:text-3xl">
            {lang === "de" ? "Häufige Fragen" : "Frequently asked questions"}
          </h2>
          <div className="mt-6 space-y-3">
            {copy.faq.map((item) => (
              <details key={item.question} className="rounded-2xl border border-border/60 bg-surface/40 px-5 py-4">
                <summary className="cursor-pointer text-sm font-semibold text-foreground">{item.question}</summary>
                <p className="mt-3 leading-7 text-muted">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
