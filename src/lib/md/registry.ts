import { getAccessoryCollection, accessoryCollectionSlugs } from '@/lib/accessory-collections';
import { businessAddress, businessIdentity, legalProvider } from '@/lib/business-identity';
import {
  getAboutContent,
  getAccessoriesContent,
  getContactContent,
  getFaqContent,
  getGamingContent,
  getHomeContent,
  getLaptopsContent,
  getPrivacyContent,
  getRepairsContent,
  getSmartphonesContent,
  getTermsContent,
} from '@/lib/content';
import { getDictionary, type Locale } from '@/lib/i18n';
import {
  getProductBySlug,
  getStoreCatalog,
  type Product,
  type StoreCatalogCategory,
} from '@/lib/products';
import { getRepairService, repairServices } from '@/lib/repair-services';
import { showcaseOverviews, showcasePages, type ShowcaseSlug } from '@/lib/showcase-pages';
import { siteInfo } from '@/lib/site';
import { getStoreCollectionCopy, type StoreCollectionId } from '@/lib/store-collections';

import { contentToMarkdown, firstString } from './content-walk';
import type { MarkdownDoc } from './document';
import { blocks, heading, isoDate, list, markdownLink, section, table } from './format';
import {
  fillPattern,
  isDynamicPattern,
  matchMarkdownRoute,
  markdownRoutes,
  type MarkdownLocale,
  type MarkdownRoute,
} from './routes';

/**
 * Renderers for the markdown twins.
 *
 * Every renderer reads the same source the HTML page reads, so rendered
 * markdown and the page cannot drift apart. Adding a page is one entry in
 * ./routes.ts plus one renderer here; the coverage test in registry.test.ts
 * fails when one of the two is missing.
 */

export type MarkdownRenderContext = { locale: MarkdownLocale; path: string; slug?: string };
export type MarkdownRenderer = (context: MarkdownRenderContext) => Promise<MarkdownDoc | null>;

const MAX_LISTED_PRODUCTS = 50;

const localeTag = (locale: MarkdownLocale): Locale => locale;

const formatPrice = (locale: MarkdownLocale, value: number): string =>
  new Intl.NumberFormat(locale === 'de' ? 'de-DE' : 'en-US', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);

const conditionLabel = (locale: MarkdownLocale, condition: Product['condition']): string => {
  if (locale === 'de') {
    return condition === 'new' ? 'Neu' : condition === 'open_box' ? 'Open Box' : 'Gebraucht';
  }
  return condition === 'new' ? 'New' : condition === 'open_box' ? 'Open box' : 'Used';
};

const availabilityLabel = (locale: MarkdownLocale, product: Product): string => {
  const stock = product.stock ?? 0;
  const pickup = product.pickupStock ?? 0;
  if (locale === 'de') {
    if (stock > 0) return 'online verfügbar';
    if (pickup > 0) return 'im Laden verfügbar (Abholung)';
    return 'derzeit nicht verfügbar';
  }
  if (stock > 0) return 'available online';
  if (pickup > 0) return 'available for pickup';
  return 'currently unavailable';
};

/** One listing line: title, absolute product URL, price, condition, stock. */
const productLine = (locale: MarkdownLocale, product: Product): string => {
  const parts = [
    formatPrice(locale, product.price),
    conditionLabel(locale, product.condition),
    availabilityLabel(locale, product),
  ];
  const detail = product.subtitle?.trim();
  return `- ${markdownLink(product.title, `/${locale}/store/${product.slug}`)} – ${parts.join(' · ')}${detail ? ` – ${detail}` : ''}`;
};

const catalogPageUrl = (locale: MarkdownLocale): string => `/${locale}/store/catalog`;

/** Listing section shared by the catalogue, category and collection pages. */
const productListingSection = async (
  locale: MarkdownLocale,
  options: { category?: StoreCatalogCategory; collection?: StoreCollectionId; subcategory?: string },
): Promise<string> => {
  let catalog: Awaited<ReturnType<typeof getStoreCatalog>>;
  try {
    catalog = await getStoreCatalog({
      category: options.category ?? 'all',
      collection: options.collection,
      subcategory: options.subcategory,
      locale: localeTag(locale),
      pageSize: MAX_LISTED_PRODUCTS,
    });
  } catch (error) {
    // A catalogue read must never turn a page's markdown twin into a 404: the
    // HTML page still renders, and the copy above the listing is the point of
    // the file. Degrade to a pointer instead.
    console.warn('[md] catalogue read failed', { error });
    return locale === 'de'
      ? `Die Angebotsliste ist gerade nicht abrufbar. Der aktuelle Bestand steht im ${markdownLink('Online-Shop', catalogPageUrl(locale))}.`
      : `The listing is temporarily unavailable. Current stock is in the ${markdownLink('online shop', catalogPageUrl(locale))}.`;
  }

  if (catalog.products.length === 0) {
    return locale === 'de'
      ? 'Derzeit ist in dieser Kategorie kein Gerät gelistet.'
      : 'No devices are listed in this category right now.';
  }

  const lines = catalog.products.map((product) => productLine(locale, product));
  const truncated = catalog.total > lines.length
    ? locale === 'de'
      ? `Aufgeführt sind ${lines.length} von ${catalog.total} Angeboten; die vollständige Liste steht im ${markdownLink('Katalog', catalogPageUrl(locale))}.`
      : `Showing ${lines.length} of ${catalog.total} listings; the full list is in the ${markdownLink('catalogue', catalogPageUrl(locale))}.`
    : undefined;

  return blocks(lines.join('\n'), truncated);
};

const categoryContentLoaders: Record<string, (lang: Locale) => Promise<unknown>> = {
  home: getHomeContent,
  about: getAboutContent,
  faq: getFaqContent,
  contact: getContactContent,
  repairs: getRepairsContent,
  privacy: getPrivacyContent,
  terms: getTermsContent,
  smartphones: getSmartphonesContent,
  accessories: getAccessoriesContent,
  gaming: getGamingContent,
  laptops: getLaptopsContent,
};

/** Content pages that also list a product category. */
const contentCategoryListings: Record<string, StoreCatalogCategory> = {
  smartphones: 'smartphones',
  accessories: 'accessories',
  gaming: 'consoles',
  laptops: 'laptops',
};

const contentRenderer: MarkdownRenderer = async ({ locale, path, slug }) => {
  if (!slug) return null;
  const loader = categoryContentLoaders[slug];
  if (!loader) return null;

  const content = await loader(localeTag(locale));
  const dictionary = getDictionary(localeTag(locale));
  const meta = (dictionary.meta as Record<string, { title?: string; description?: string } | undefined>)[slug];

  const title = firstString(content, ['heroTitle', 'title']) ?? meta?.title ?? 'Apfel Park';
  const summary = firstString(content, ['heroSubtitle', 'subtitle', 'description']) ?? meta?.description;
  const category = contentCategoryListings[slug];

  const body = blocks(
    contentToMarkdown(content, [
      'title',
      'heroTitle',
      'subtitle',
      'heroSubtitle',
      'description',
      'metaTitle',
    ]),
    category
      ? await section(
          locale === 'de' ? 'Aktuelle Angebote' : 'Current offers',
          await productListingSection(locale, { category }),
        )
      : undefined,
    slug === 'repairs' ? await repairServicesSection(locale) : undefined,
  );

  return {
    title,
    summary,
    canonicalPath: pathWithLocale(locale, path),
    body,
    related: relatedLinks(locale, path),
  };
};

const pathWithLocale = (locale: MarkdownLocale, path: string): string =>
  path === '/' || path === '' ? `/${locale}` : `/${locale}${path}`;

const repairServicesSection = async (locale: MarkdownLocale): Promise<string> => {
  const headingText = locale === 'de' ? 'Reparaturleistungen' : 'Repair services';
  const items = repairServices.map((service) => {
    const copy = service.copy[localeTag(locale)];
    return `- ${markdownLink(copy.title, `/${locale}/repairs/${service.slug}`)} – ${copy.description}`;
  });
  return section(headingText, items.join('\n'));
};

const relatedLinks = (
  locale: MarkdownLocale,
  path: string,
): readonly { label: string; path: string }[] => {
  const candidates: { label: { de: string; en: string }; path: string }[] = [
    { label: { de: 'Online-Shop', en: 'Online shop' }, path: `/${locale}/store` },
    { label: { de: 'Katalog mit allen Angeboten', en: 'Catalogue with every listing' }, path: catalogPageUrl(locale) },
    { label: { de: 'Reparaturpreise', en: 'Repair prices' }, path: `/${locale}/repairs` },
    { label: { de: 'Häufige Fragen', en: 'Frequently asked questions' }, path: `/${locale}/faq` },
    { label: { de: 'Kontakt und Anfahrt', en: 'Contact and directions' }, path: `/${locale}/contact` },
    { label: { de: 'Lieferung und Rückgabe', en: 'Delivery and returns' }, path: `/${locale}/delivery-returns` },
    { label: { de: 'Impressum', en: 'Legal notice' }, path: `/${locale}/impressum` },
    { label: { de: 'Datenschutz', en: 'Privacy' }, path: `/${locale}/privacy` },
    { label: { de: 'AGB', en: 'Terms' }, path: `/${locale}/terms` },
  ];
  return candidates
    .filter((candidate) => candidate.path !== pathWithLocale(locale, path))
    .map((candidate) => ({ label: candidate.label[locale], path: candidate.path }));
};

const catalogRenderer: MarkdownRenderer = async ({ locale, path, slug }) => {
  const category = (slug ?? 'all') as StoreCatalogCategory;
  const dictionary = getDictionary(localeTag(locale));
  const meta = (dictionary.meta as Record<string, { title?: string; description?: string } | undefined>)[category];
  const title = meta?.title ?? (locale === 'de' ? 'Online-Shop' : 'Online shop');

  return {
    title,
    summary: meta?.description,
    canonicalPath: pathWithLocale(locale, path),
    body: await section(
      locale === 'de' ? 'Angebote' : 'Listings',
      await productListingSection(locale, { category }),
    ),
    related: relatedLinks(locale, path),
  };
};

const collectionRenderer: MarkdownRenderer = async ({ locale, path, slug }) => {
  const copy = getStoreCollectionCopy(slug as StoreCollectionId, localeTag(locale));
  if (!copy) return null;

  const comparison = copy.comparison
    ? section(
        copy.comparison.heading,
        blocks(
          table(copy.comparison.columns, copy.comparison.rows),
          copy.comparison.note,
          copy.comparison.sources?.length
            ? list(
                copy.comparison.sources.map((source) => markdownLink(source.label, source.href)),
              )
            : undefined,
        ),
      )
    : undefined;

  const body = blocks(
    section(copy.introTitle, copy.intro.join('\n\n')),
    copy.benefits.length
      ? blocks(
          ...copy.benefits.map((benefit) =>
            blocks(heading(3, benefit.title), benefit.text),
          ),
        )
      : undefined,
    comparison,
    copy.faq.length
      ? section(
          locale === 'de' ? 'Häufige Fragen' : 'Frequently asked questions',
          blocks(
            ...copy.faq.map((entry) => blocks(heading(3, entry.question), entry.answer)),
          ),
        )
      : undefined,
    copy.sources?.length && !copy.comparison
      ? section(
          locale === 'de' ? 'Quellen' : 'Sources',
          list(copy.sources.map((source) => markdownLink(source.label, source.href))),
        )
      : undefined,
    await section(
      locale === 'de' ? 'Aktuelle Angebote' : 'Current offers',
      await productListingSection(locale, { collection: slug as StoreCollectionId }),
    ),
  );

  return {
    title: copy.title,
    summary: copy.description,
    canonicalPath: pathWithLocale(locale, path),
    body,
    related: relatedLinks(locale, path),
  };
};

const productRenderer: MarkdownRenderer = async ({ locale, path, slug }) => {
  if (!slug) return null;
  const product = await getProductBySlug(slug, localeTag(locale));
  if (!product) return null;

  const groupedSpecs = new Map<string, string[][]>();
  for (const spec of product.specs) {
    const group = spec.group ?? '';
    const rows = groupedSpecs.get(group) ?? [];
    rows.push([spec.label, spec.value]);
    groupedSpecs.set(group, rows);
  }

  const specsMarkdown = blocks(
    ...[...groupedSpecs.entries()].map(([group, rows]) =>
      blocks(
        group ? heading(3, group) : undefined,
        table([locale === 'de' ? 'Merkmal' : 'Detail', locale === 'de' ? 'Wert' : 'Value'], rows),
      ),
    ),
  );

  const variantsMarkdown = product.variants.length
    ? section(
        locale === 'de' ? 'Varianten' : 'Variants',
        table(
          [
            locale === 'de' ? 'Farbe' : 'Colour',
            locale === 'de' ? 'Speicher' : 'Storage',
            locale === 'de' ? 'Preis' : 'Price',
            locale === 'de' ? 'Verfügbarkeit' : 'Availability',
          ],
          product.variants.map((variant) => [
            variant.color,
            variant.storage,
            typeof variant.price === 'number' ? formatPrice(locale, variant.price) : '',
            (variant.stock ?? 0) > 0
              ? locale === 'de'
                ? 'verfügbar'
                : 'available'
              : locale === 'de'
                ? 'nicht verfügbar'
                : 'unavailable',
          ]),
        ),
      )
    : undefined;

  const facts = table(
    [locale === 'de' ? 'Angabe' : 'Detail', locale === 'de' ? 'Wert' : 'Value'],
    [
      [locale === 'de' ? 'Preis' : 'Price', formatPrice(locale, product.price)],
      [locale === 'de' ? 'Zustand' : 'Condition', conditionLabel(locale, product.condition)],
      [locale === 'de' ? 'Verfügbarkeit' : 'Availability', availabilityLabel(locale, product)],
      ...(product.brand ? [[locale === 'de' ? 'Marke' : 'Brand', product.brand]] : []),
      ...(product.model ? [[locale === 'de' ? 'Modell' : 'Model', product.model]] : []),
      ...(product.sku ? [['SKU', product.sku]] : []),
      ...(product.gtin ? [['GTIN', product.gtin]] : []),
    ],
  );

  const faqMarkdown = product.faq.length
    ? section(
        locale === 'de' ? 'Häufige Fragen' : 'Frequently asked questions',
        blocks(...product.faq.map((entry) => blocks(heading(3, entry.question), entry.answer))),
      )
    : undefined;

  return {
    title: product.title,
    summary: product.subtitle?.trim() || undefined,
    canonicalPath: pathWithLocale(locale, path),
    lastUpdated: isoDate(product.updatedAt ?? product.createdAt),
    body: blocks(
      facts,
      product.conditionNote,
      product.description,
      product.featureBullets.length
        ? section(
            locale === 'de' ? 'Merkmale' : 'Key features',
            list(product.featureBullets),
          )
        : undefined,
      specsMarkdown ? section(locale === 'de' ? 'Technische Daten' : 'Specifications', specsMarkdown) : undefined,
      variantsMarkdown,
      faqMarkdown,
      product.gpsr?.safetyWarnings.length
        ? section(
            locale === 'de' ? 'Sicherheitshinweise' : 'Safety notes',
            list(product.gpsr.safetyWarnings),
          )
        : undefined,
    ),
    related: relatedLinks(locale, path),
  };
};

const repairServiceRenderer: MarkdownRenderer = async ({ locale, path, slug }) => {
  if (!slug) return null;
  const service = getRepairService(slug);
  if (!service) return null;

  const copy = service.copy[localeTag(locale)];
  const body = blocks(
    copy.intro,
    contentToMarkdown(copy, ['title', 'shortTitle', 'description', 'intro']),
    await section(
      locale === 'de' ? 'Preise und Verfügbarkeit' : 'Prices and availability',
      locale === 'de'
        ? `Modellbezogene Preise stehen im ${markdownLink('Preisfinder', `/${locale}/repairs`)}. Der konkrete Preis und Umfang werden vor kostenpflichtigen Arbeiten bestätigt.`
        : `Model-specific prices are in the ${markdownLink('price finder', `/${locale}/repairs`)}. The exact price and scope are confirmed before paid work begins.`,
    ),
  );

  return {
    title: copy.title,
    summary: copy.description,
    canonicalPath: pathWithLocale(locale, path),
    body,
    related: relatedLinks(locale, path),
  };
};

const showcaseRenderer: MarkdownRenderer = async ({ locale, path, slug }) => {
  if (!slug || !(slug in showcasePages)) return null;
  const page = showcasePages[slug as ShowcaseSlug];
  const overview = showcaseOverviews[slug as ShowcaseSlug];

  const body = blocks(
    overview.intro[localeTag(locale)],
    section(
      locale === 'de' ? 'Technische Angaben' : 'Specifications',
      list(overview.facts[localeTag(locale)]),
    ),
    section(
      locale === 'de' ? 'Quelle der Herstellerangaben' : 'Source of the manufacturer figures',
      markdownLink(page.source, page.source),
    ),
    section(
      locale === 'de' ? 'Preis und Verfügbarkeit' : 'Price and availability',
      locale === 'de'
        ? `Diese Modellseite ist keine Bestandsliste. Ob das Gerät verfügbar ist, steht im ${markdownLink('Online-Shop', `/${locale}/store`)}; Verfügbarkeit und Endpreis werden vor dem Kauf bestätigt.`
        : `This model page is not a stock list. Availability is shown in the ${markdownLink('online shop', `/${locale}/store`)}; availability and final price are confirmed before purchase.`,
    ),
  );

  return {
    title: page.name,
    summary: overview.tagline[localeTag(locale)],
    canonicalPath: pathWithLocale(locale, path),
    lastUpdated: isoDate(page.updated),
    body,
    related: relatedLinks(locale, path),
  };
};

const accessoryCollectionRenderer: MarkdownRenderer = async ({ locale, path, slug }) => {
  if (!slug) return null;
  const collection = getAccessoryCollection(slug, localeTag(locale));
  if (!collection) return null;

  const body = blocks(
    contentToMarkdown(collection, ['title', 'metaTitle', 'description', 'slug', 'subcategory']),
    await section(
      locale === 'de' ? 'Aktuelle Angebote' : 'Current offers',
      await productListingSection(locale, { category: 'accessories', subcategory: collection.subcategory }),
    ),
  );

  return {
    title: firstString(collection, ['title', 'metaTitle']) ?? slug,
    summary: firstString(collection, ['description']),
    canonicalPath: pathWithLocale(locale, path),
    body,
    related: relatedLinks(locale, path),
  };
};

/** Impressum, assembled from the same identity the HTML page and legal pages use. */
const legalRenderer: MarkdownRenderer = async ({ locale, path }) => {
  const identity = businessIdentity;
  const registration = siteInfo.businessRegistration;
  const isGerman = locale === 'de';

  const rows: string[][] = [
    [isGerman ? 'Anbieter' : 'Provider', legalProvider(localeTag(locale))],
    [isGerman ? 'Anschrift' : 'Address', businessAddress(localeTag(locale))],
    [isGerman ? 'Telefon' : 'Phone', identity.phones.legalBusiness[locale]],
    [isGerman ? 'E-Mail' : 'Email', identity.email],
    [isGerman ? 'Umsatzsteuer-Identifikationsnummer' : 'VAT ID', identity.vatId],
    [isGerman ? 'Rechtsform' : 'Legal form', identity.legalForm[locale]],
    [
      isGerman ? 'Gewerbeanmeldung' : 'Business registration',
      `${registration.authority} (${registration.legalBasisDe}), ${isGerman ? 'Beginn' : 'start'} ${registration.businessStartDate}`,
    ],
    [isGerman ? 'Handelsregister' : 'Commercial register', isGerman ? registration.commercialRegisterDe : registration.commercialRegisterEn],
    [isGerman ? 'Website' : 'Website', identity.website],
  ];

  const body = blocks(
    table([isGerman ? 'Angabe' : 'Detail', isGerman ? 'Wert' : 'Value'], rows),
    section(
      isGerman ? 'Verantwortlich für den Inhalt' : 'Responsible for the content',
      `${identity.legalOwner}, ${businessAddress(localeTag(locale))}`,
    ),
    section(
      isGerman ? 'Öffnungszeiten' : 'Opening hours',
      isGerman ? 'Montag bis Samstag 09:30–20:00 Uhr' : 'Monday to Saturday 09:30–20:00',
    ),
  );

  return {
    title: isGerman ? 'Impressum' : 'Legal notice',
    summary: isGerman
      ? 'Anbieterkennzeichnung nach § 5 DDG für Apfel Park in Hamburg-Wilhelmsburg.'
      : 'Provider identification for Apfel Park in Hamburg-Wilhelmsburg.',
    canonicalPath: pathWithLocale(locale, path),
    body,
    related: relatedLinks(locale, path),
  };
};

const renderers: Record<string, MarkdownRenderer> = {
  content: contentRenderer,
  catalog: catalogRenderer,
  collection: collectionRenderer,
  product: productRenderer,
  'repair-service': repairServiceRenderer,
  showcase: showcaseRenderer,
  'accessory-collection': accessoryCollectionRenderer,
  legal: legalRenderer,
};

const rendererFor = (route: MarkdownRoute): MarkdownRenderer | null => renderers[route.kind] ?? null;

/** Renders the markdown twin of a public path, or null when none exists. */
export const renderMarkdownFor = async (pathname: string): Promise<MarkdownDoc | null> => {
  const match = matchMarkdownRoute(pathname);
  if (!match) return null;

  const renderer = rendererFor(match.route);
  if (!renderer) return null;

  const { locale } = matchLocale(pathname);
  const slug = match.slug ?? match.route.id;
  const basePath = fillPattern(match.route.pattern, match.slug);

  return renderer({ locale, path: basePath, slug });
};

const matchLocale = (pathname: string): { locale: MarkdownLocale } => {
  const match = /^\/(de|en)(?=\/|$)/.exec(pathname);
  return { locale: match ? (match[1] as MarkdownLocale) : 'de' };
};

export type MarkdownRouteInfo = {
  /** Public HTML path, the canonical of the pair. */
  path: string;
  /** Addressable markdown URL, `.md` on the same path. */
  markdownPath: string;
  kind: MarkdownRoute['kind'];
};

/**
 * Every addressable markdown route, used by the catalogue endpoint and by
 * llms.txt. Product pages are not enumerated here: there are hundreds of them
 * and the catalogue listing already carries the full, current set.
 */
export const listMarkdownRoutes = (): MarkdownRouteInfo[] => {
  const infos: MarkdownRouteInfo[] = [];
  const locales: MarkdownLocale[] = ['de', 'en'];

  for (const route of markdownRoutes) {
    for (const locale of locales) {
      if (route.pattern.includes('[service]')) {
        for (const service of repairServices) {
          infos.push(routeInfo(locale, fillPattern(route.pattern, service.slug), route.kind));
        }
        continue;
      }
      if (route.pattern.includes('[collection]')) {
        for (const collection of accessoryCollectionSlugs) {
          infos.push(routeInfo(locale, fillPattern(route.pattern, collection), route.kind));
        }
        continue;
      }
      // Product slugs are not enumerated: hundreds of them, all already
      // reachable through the catalogue listing.
      if (isDynamicPattern(route.pattern)) continue;
      infos.push(routeInfo(locale, route.pattern === '' ? '/' : route.pattern, route.kind));
    }
  }

  return infos;
};

const routeInfo = (locale: MarkdownLocale, pattern: string, kind: MarkdownRoute['kind']): MarkdownRouteInfo => {
  const htmlPath = pattern === '/' ? `/${locale}` : `/${locale}${pattern}`;
  return { path: htmlPath, markdownPath: `${htmlPath}.md`, kind };
};
