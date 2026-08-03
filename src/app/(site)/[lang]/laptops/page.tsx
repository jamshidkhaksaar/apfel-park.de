import type { Metadata } from "next";
import Link from "next/link";

import PageIntro from "../../../../components/PageIntro";
import StoreGrid from "../../../../components/store/StoreGrid";
import { getDictionary, type Locale } from "../../../../lib/i18n";
import { createMetadata } from "../../../../lib/metadata";
import { getStoreCatalog, parseStoreCatalogFilters, parseStorePage, parseStoreSort } from "../../../../lib/products";
import { siteInfo } from "../../../../lib/site";
import { getLaptopsContent } from "../../../../lib/content";

export const dynamic = "force-dynamic";

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> => {
  const { lang } = await params;
  const dict = getDictionary(lang as Locale);
  return createMetadata(
    lang as Locale,
    dict.meta.laptops.title,
    dict.meta.laptops.description,
    "/laptops",
  );
};

export default async function LaptopsPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { lang } = await params;
  const query = await searchParams;
  const dict = getDictionary(lang as Locale);
  const laptops = await getLaptopsContent(lang as Locale);
  const sort = parseStoreSort(query.sort);
  const page = parseStorePage(query.page);
  const activeFilters = parseStoreCatalogFilters(query);

  const catalog = await getStoreCatalog({
    category: "laptops",
    sort,
    page,
    pageSize: 24,
    locale: lang as Locale,
    filters: activeFilters,
  });

  return (
    <div className="bg-background">
      <PageIntro
        title={laptops.heroTitle}
        subtitle={laptops.heroSubtitle}
        eyebrow={dict.meta.laptops.title}
      />

      <section className="section-pad">
        <div className="container-page">
          <div className="mb-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {laptops.highlights.map((item: string) => (
              <div key={item} className="tech-card-hover rounded-2xl p-6 text-center">
                <p className="font-medium text-foreground">{item}</p>
              </div>
            ))}
          </div>

          <StoreGrid
            products={catalog.products}
            lang={lang as Locale}
            lockedCategory="laptops"
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

      <section className="section-pad">
        <div className="container-page">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gold/20 via-amber/10 to-bronze/20 p-10 md:p-16">
            <div className="absolute inset-0 circuit-pattern opacity-20" />

            <div className="relative flex flex-col items-center justify-between gap-8 text-center md:flex-row md:text-left">
              <div>
                <h3 className="text-2xl font-bold text-foreground md:text-3xl">
                  {lang === "de" ? "Interesse an einem Laptop?" : "Interested in a laptop?"}
                </h3>
                <p className="mt-2 text-muted">
                  {lang === "de"
                    ? "Besuche uns im Shop fur eine personliche Beratung oder ruf uns an."
                    : "Visit our shop for personal advice or give us a call."}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <Link href={`tel:${siteInfo.phone.replace(/\s/g, "")}`} className="btn-primary shrink-0">
                  <span>{siteInfo.phone}</span>
                </Link>
                <Link href={`/${lang}/contact`} className="btn-secondary shrink-0">
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
