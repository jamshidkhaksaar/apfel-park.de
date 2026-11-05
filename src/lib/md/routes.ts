/**
 * Route table for the markdown twins of the public pages.
 *
 * This file must stay free of runtime imports: src/proxy.ts matches every
 * request against it, and importing the renderers there would drag the
 * database client into the middleware bundle.
 */

export type MarkdownLocale = 'de' | 'en';

export type MarkdownRouteKind =
  /** Copy from src/lib/content.ts (home, about, faq, privacy, terms, …). */
  | 'content'
  /** A store collection landing page from src/lib/store-collections.ts. */
  | 'collection'
  /** A product listing built from the catalog. */
  | 'catalog'
  /** Safe harbor pages assembled from the published business identity. */
  | 'legal'
  /** One editorial model page from src/lib/showcase-pages.ts. */
  | 'showcase'
  /** One repair service from src/lib/repair-services.ts. */
  | 'repair-service'
  /** One accessory subcategory landing page. */
  | 'accessory-collection'
  /** One product from the database. */
  | 'product';

export type MarkdownRoute = {
  /** Locale-relative public path; `[slug]` marks the single dynamic segment. */
  pattern: string;
  kind: MarkdownRouteKind;
  /** Entity or copy id the renderer needs, when it is not the path itself. */
  id?: string;
};

export const markdownRoutes: readonly MarkdownRoute[] = [
  { pattern: '', kind: 'content', id: 'home' },
  { pattern: '/about', kind: 'content', id: 'about' },
  { pattern: '/faq', kind: 'content', id: 'faq' },
  { pattern: '/contact', kind: 'content', id: 'contact' },
  { pattern: '/repairs', kind: 'content', id: 'repairs' },
  { pattern: '/privacy', kind: 'content', id: 'privacy' },
  { pattern: '/terms', kind: 'content', id: 'terms' },
  { pattern: '/smartphones', kind: 'content', id: 'smartphones' },
  { pattern: '/accessories', kind: 'content', id: 'accessories' },
  { pattern: '/gaming', kind: 'content', id: 'gaming' },
  { pattern: '/laptops', kind: 'content', id: 'laptops' },
  { pattern: '/impressum', kind: 'legal', id: 'impressum' },

  // Category and collection pages whose copy lives in data, not in the page
  // component: the same source the HTML page renders from.
  { pattern: '/store', kind: 'catalog', id: 'all' },
  { pattern: '/store/catalog', kind: 'catalog', id: 'all' },
  { pattern: '/tablets', kind: 'catalog', id: 'tablets' },
  { pattern: '/parts', kind: 'catalog', id: 'parts' },
  { pattern: '/open-box', kind: 'catalog', id: 'open-box-smartphones-tablets' },
  { pattern: '/iphone-17', kind: 'collection', id: 'iphone-17' },
  { pattern: '/iphone-16-pro-max', kind: 'collection', id: 'iphone-16-pro-max' },
  { pattern: '/xiaomi-redmi-handys', kind: 'collection', id: 'xiaomi-redmi-phones' },
  { pattern: '/samsung-handys', kind: 'collection', id: 'samsung-phones' },
  { pattern: '/handys-ohne-vertrag', kind: 'collection', id: 'phones-without-contract' },
  { pattern: '/gebrauchte-handys', kind: 'collection', id: 'used-phones' },
  { pattern: '/gebrauchte-iphones', kind: 'collection', id: 'used-iphones' },

  { pattern: '/iphone-18-pro', kind: 'showcase', id: 'iphone-18-pro' },
  { pattern: '/iphone-18-pro-max', kind: 'showcase', id: 'iphone-18-pro-max' },
  { pattern: '/iphone-duo', kind: 'showcase', id: 'iphone-duo' },
  { pattern: '/galaxy-z-fold-8', kind: 'showcase', id: 'galaxy-z-fold-8' },
  { pattern: '/galaxy-z-fold-8-ultra', kind: 'showcase', id: 'galaxy-z-fold-8-ultra' },
  { pattern: '/pixel-11', kind: 'showcase', id: 'pixel-11' },
  { pattern: '/pixel-11-pro-fold', kind: 'showcase', id: 'pixel-11-pro-fold' },

  { pattern: '/repairs/[service]', kind: 'repair-service' },
  { pattern: '/accessories/[collection]', kind: 'accessory-collection' },
  { pattern: '/store/[slug]', kind: 'product' },
];

/**
 * Public pages that intentionally have no markdown twin yet. Every entry needs
 * a reason a reviewer can act on; the coverage test fails when a route from
 * src/lib/seo-shared.ts is neither in `markdownRoutes` nor here.
 */
export const markdownSkips: readonly { pattern: string; reason: string }[] = [
  { pattern: '/delivery-returns', reason: 'Shipping and return copy is written inline in the page component; move it to src/lib/content.ts to expose it.' },
  { pattern: '/device-conditions', reason: 'Condition-grade copy (Neu, Open Box, A+, Gebraucht) is inline in the page component; move it to src/lib/content.ts to expose it.' },
  { pattern: '/withdrawal', reason: 'The withdrawal page is a form plus links; the legal text it points to is /delivery-returns.' },
  { pattern: '/trade-in', reason: 'Trade-in is an interactive quote form with no prose beyond its intro.' },
  { pattern: '/firmenkunden', reason: 'B2B copy (including partsCatalogCopy) is inline in the page component.' },
  { pattern: '/handy-shop-hamburg-wilhelmsburg', reason: 'Local landing copy is inline in the page component; move it to src/lib/content.ts to expose it.' },
  { pattern: '/ratgeber/smartphone-laenger-nutzen', reason: 'Guide copy is inline in the page component; move it to src/lib/content.ts to expose it.' },
  { pattern: '/repairs/preisvergleich-hamburg', reason: 'Benchmark copy is inline in the page component; the dated comparison table should move next to src/lib/repair-price-benchmark.ts.' },
  { pattern: '/cart', reason: 'Transactional and noindex; never exposed as markdown.' },
  { pattern: '/checkout', reason: 'Transactional and noindex; never exposed as markdown.' },
  { pattern: '/store/preview/[token]', reason: 'Signed preview links are private.' },
];

/** Routes that must never be reachable through the markdown handler. */
const PRIVATE_PREFIXES = ['/admin', '/api', '/login', '/maintenance', '/cart', '/checkout', '/store/preview'];

const isPrivate = (localeRelativePath: string): boolean =>
  PRIVATE_PREFIXES.some(
    (prefix) => localeRelativePath === prefix || localeRelativePath.startsWith(`${prefix}/`),
  );

/** Fills a pattern's single dynamic segment, for both paths and catalogues. */
export const fillPattern = (pattern: string, slug?: string): string =>
  pattern.replace(DYNAMIC_SEGMENT, slug ?? '');

export type MarkdownRouteMatch = { route: MarkdownRoute; slug?: string };

/** Splits `/de/store/iphone-15.md` style input into its locale and remainder. */
export const splitLocale = (pathname: string): { locale: MarkdownLocale; rest: string } => {
  const match = /^\/(de|en)(?=\/|$)/.exec(pathname);
  if (!match) return { locale: 'de', rest: pathname };
  return { locale: match[1] as MarkdownLocale, rest: pathname.slice(match[0].length) };
};

/** Any `[slug]`, `[service]` or `[collection]` placeholder is one dynamic segment. */
const DYNAMIC_SEGMENT = /\[[a-z]+\]/;

export const isDynamicPattern = (pattern: string): boolean => DYNAMIC_SEGMENT.test(pattern);

const matchesPattern = (pattern: string, rest: string): string | null | undefined => {
  if (pattern === '') return rest === '' || rest === '/' ? null : undefined;
  if (!isDynamicPattern(pattern)) return rest === pattern ? null : undefined;

  const head = pattern.slice(0, pattern.search(DYNAMIC_SEGMENT));
  if (!rest.startsWith(head)) return undefined;

  const slug = rest.slice(head.length);
  // Exactly one segment: /store/catalog is its own route, not a product slug.
  if (!slug || slug.includes('/')) return undefined;
  return slug;
};

/**
 * Resolves a public path to its markdown route. Returns null when the path has
 * no renderer, so both the proxy and the handler treat it as "no twin exists"
 * rather than guessing.
 */
export const matchMarkdownRoute = (pathname: string): MarkdownRouteMatch | null => {
  const { rest } = splitLocale(pathname);
  const normalized = rest.length > 1 && rest.endsWith('/') ? rest.slice(0, -1) : rest;
  if (normalized === '') return { route: markdownRoutes[0] };
  if (isPrivate(normalized)) return null;

  // Static patterns win over dynamic ones, so /store/catalog stays a listing.
  for (const route of markdownRoutes) {
    if (isDynamicPattern(route.pattern)) continue;
    if (matchesPattern(route.pattern, normalized) === null) return { route };
  }
  for (const route of markdownRoutes) {
    if (!isDynamicPattern(route.pattern)) continue;
    const slug = matchesPattern(route.pattern, normalized);
    if (typeof slug === 'string') return { route, slug };
  }
  return null;
};

/** True when a markdown twin is addressable for this public path. */
export const hasMarkdownRoute = (pathname: string): boolean => matchMarkdownRoute(pathname) !== null;
