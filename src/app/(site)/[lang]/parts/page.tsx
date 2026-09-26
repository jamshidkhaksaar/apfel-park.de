import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import StoreCommerceHeader from '@/components/store/StoreCommerceHeader';
import StoreGrid from '@/components/store/StoreGrid';
import TrusmiPartner from '@/components/TrusmiPartner';
import { partsCatalogCopy } from '@/lib/i18n';
import { createMetadata } from '@/lib/metadata';
import { getStoreCatalog, parseStoreCatalogFilters, parseStoreSort } from '@/lib/products';
import { PART_SUBCATEGORIES } from '@/lib/product-subcategory';
import { requireLocale } from '@/lib/route-locale';
import { safeJsonStringify } from '@/lib/security';
import { siteInfo } from '@/lib/site';
import { buildCollectionPageSchema, buildListingBreadcrumbSchema } from '@/lib/store-schema';
import { buildStoreCanonicalUrl, isStorePaginationOutOfRange, resolveStoreIndexing } from '@/lib/store-indexing';

type Props = {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};
export const dynamic = 'force-dynamic';

export const generateMetadata = async ({ params, searchParams }: Props): Promise<Metadata> => {
  const [{ lang: rawLang }, query] = await Promise.all([params, searchParams]);
  const lang = requireLocale(rawLang);
  const copy = partsCatalogCopy[lang];
  const indexing = resolveStoreIndexing(query);
  return createMetadata(lang, copy.title, copy.description, '/parts', undefined, {
    noindex: indexing.noindex, canonicalQuery: indexing.canonicalQuery,
  });
};

export default async function PartsPage({ params, searchParams }: Props) {
  const [{ lang: rawLang }, query] = await Promise.all([params, searchParams]);
  const lang = requireLocale(rawLang);
  const copy = partsCatalogCopy[lang];
  const indexing = resolveStoreIndexing(query);
  const subcategory = typeof query.subcategory === 'string' ? query.subcategory : undefined;
  if (subcategory && !(PART_SUBCATEGORIES as readonly string[]).includes(subcategory)) notFound();
  const filters = parseStoreCatalogFilters(query);
  const sort = parseStoreSort(query.sort);
  const catalog = await getStoreCatalog({ category: 'parts', subcategory, sort, page: indexing.page, pageSize: 24, locale: lang, filters });
  if (isStorePaginationOutOfRange(indexing.page, catalog.pages)) notFound();
  const url = buildStoreCanonicalUrl(`${siteInfo.url}/${lang}/parts`, indexing);
  const schemaInput = { lang, name: copy.title, description: copy.description, url, catalog: { total: catalog.total, page: catalog.page }, products: catalog.products };
  const sections = [
    { slug: '', label: copy.all },
    { slug: 'replacement-displays', label: copy.displays },
    { slug: 'replacement-batteries', label: copy.batteries },
    { slug: 'repair-components', label: copy.components },
  ];
  const typeHref = (slug: string) => {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (key !== 'page' && key !== 'subcategory' && typeof value === 'string') next.set(key, value);
    }
    if (slug) next.set('subcategory', slug);
    return `/${lang}/parts${next.size ? `?${next}` : ''}#store`;
  };
  return <div className="bg-background">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonStringify(buildCollectionPageSchema(schemaInput)) }} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonStringify(buildListingBreadcrumbSchema(schemaInput)) }} />
    <StoreCommerceHeader lang={lang} title={copy.title} subtitle={copy.subtitle} eyebrow="TRUSMI · Apfel Park" query={filters.query} resultCount={catalog.total} breadcrumbs={[{ label: copy.title }]} />
    <nav aria-label={copy.title} className="container-page flex flex-wrap gap-2 py-5">
      {sections.map(section => <Link key={section.slug} href={typeHref(section.slug)} aria-current={(subcategory ?? '') === section.slug ? 'page' : undefined} className={`inline-flex min-h-11 items-center rounded-xl border px-4 text-sm font-semibold ${(subcategory ?? '') === section.slug ? 'border-gold/40 bg-gold/15 text-foreground' : 'border-border text-muted hover:text-foreground'}`}>{section.label}</Link>)}
    </nav>
    <section id="store" className="scroll-mt-32 bg-store-ground py-6 md:py-8">
      <div className="container-page"><StoreGrid products={catalog.products} lang={lang} lockedCategory="parts" sortBy={sort} total={catalog.total} page={catalog.page} pages={catalog.pages} counts={catalog.counts} facets={catalog.facets} activeFilters={filters} showSearch={false} /></div>
    </section>
    <section className="section-pad"><div className="container-page space-y-8">
      <div className="grid gap-5 md:grid-cols-2">
        <article className="tech-card rounded-2xl p-6"><h2 className="text-xl font-semibold text-foreground">{copy.retailTitle}</h2><p className="mt-3 leading-relaxed text-muted">{copy.retailBody}</p><Link href="#store" className="btn-primary mt-5">{copy.all}</Link></article>
        <article className="tech-card rounded-2xl p-6"><h2 className="text-xl font-semibold text-foreground">{copy.wholesaleTitle}</h2><p className="mt-3 leading-relaxed text-muted">{copy.wholesaleBody}</p><div className="mt-5 flex flex-wrap gap-3"><Link href={`/${lang}/contact`} className="btn-primary">{copy.quote}</Link><Link href={`/${lang}/firmenkunden#parts`} className="btn-secondary">{copy.business}</Link></div></article>
      </div>
      <p className="text-sm leading-relaxed text-muted">{copy.compatibility} <Link href={`/${lang}/repairs`} className="font-semibold text-gold underline">{copy.repairs}</Link></p>
      <TrusmiPartner locale={lang} />
    </div></section>
  </div>;
}
