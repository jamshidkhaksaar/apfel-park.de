import { describe, expect, it } from 'vitest';

import { seoRouteDefinitions } from '@/lib/seo-shared';

import {
  markdownRoutes,
  markdownSkips,
  matchMarkdownRoute,
  splitLocale,
  type MarkdownRoute,
} from './routes';

/**
 * The coverage test is the point of this file: a new public page that nobody
 * gives a markdown twin (or an explicit skip reason) must fail here rather
 * than quietly stay invisible to agents.
 */
describe('markdown route coverage', () => {
  it('covers every registered public route with a twin or a documented skip', () => {
    const covered = new Set<string>([
      ...markdownRoutes.map((route) => route.pattern || '/'),
      ...markdownSkips.map((skip) => skip.pattern),
    ]);
    const missing = seoRouteDefinitions
      .map((definition) => definition.path || '/')
      .filter((path) => !covered.has(path));

    expect(missing).toEqual([]);
  });

  it('gives every skip a reason a reviewer can act on', () => {
    for (const skip of markdownSkips) {
      expect(skip.reason.length, `reason for ${skip.pattern}`).toBeGreaterThan(20);
    }
  });

  it('keeps patterns unique and defaulted to a renderer kind', () => {
    const patterns = markdownRoutes.map((route) => route.pattern);
    expect(new Set(patterns).size).toBe(patterns.length);
    expect(markdownRoutes.every((route) => Boolean(route.kind))).toBe(true);
  });
});

describe('markdown route matching', () => {
  it('separates locale from the remaining path', () => {
    expect(splitLocale('/de/faq')).toEqual({ locale: 'de', rest: '/faq' });
    expect(splitLocale('/en/store/iphone-15')).toEqual({ locale: 'en', rest: '/store/iphone-15' });
    expect(splitLocale('/faq')).toEqual({ locale: 'de', rest: '/faq' });
    expect(splitLocale('/')).toEqual({ locale: 'de', rest: '/' });
  });

  it('resolves locale-prefixed content, collection and listing routes', () => {
    expect(matchMarkdownRoute('/de/faq')?.route.kind).toBe('content');
    expect(matchMarkdownRoute('/en/about')?.route.id).toBe('about');
    expect(matchMarkdownRoute('/de/samsung-handys')?.route.id).toBe('samsung-phones');
    // The catalogue wins over the product pattern.
    expect(matchMarkdownRoute('/en/store/catalog')?.route.id).toBe('all');
    expect(matchMarkdownRoute('/de/store')?.route.kind).toBe('catalog');
  });

  it('resolves dynamic families to their slug', () => {
    expect(matchMarkdownRoute('/de/store/iphone-15-128gb')?.slug).toBe('iphone-15-128gb');
    expect(matchMarkdownRoute('/en/repairs/water-damage')?.slug).toBe('water-damage');
    expect(matchMarkdownRoute('/de/accessories/cases')?.slug).toBe('cases');
    // A dynamic path never matches two segments deep.
    expect(matchMarkdownRoute('/de/store/iphone-15/variant')).toBeNull();
  });

  it('never exposes private or unrendered paths', () => {
    const privatePaths = ['/admin', '/admin/products', '/api/public/maintenance', '/login', '/maintenance', '/cart', '/checkout', '/store/preview/abc'];
    for (const path of privatePaths) {
      expect(matchMarkdownRoute(path), path).toBeNull();
      expect(matchMarkdownRoute(`/de${path}`), path).toBeNull();
    }
    expect(matchMarkdownRoute('/de/ratgeber/smartphone-laenger-nutzen')).toBeNull();
  });

  it('treats the homepage as a content route', () => {
    const home: MarkdownRoute | undefined = markdownRoutes[0];
    expect(home?.pattern).toBe('');
    expect(matchMarkdownRoute('/')?.route.pattern).toBe('');
    expect(matchMarkdownRoute('/de')?.route.pattern).toBe('');
    expect(matchMarkdownRoute('/en/')?.route.pattern).toBe('');
  });
});
