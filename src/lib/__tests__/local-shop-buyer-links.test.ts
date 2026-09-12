import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/products', async original => ({ ...await original<typeof import('@/lib/products')>(), getStoreCatalog: async () => ({ products: [], total: 0, page: 1, pages: 1, counts: {}, facets: {} }) }));
vi.mock('@/components/store/StoreGrid', () => ({ default: () => null }));
import Page from '../../app/(site)/[lang]/handy-shop-hamburg-wilhelmsburg/page';

describe('local shop buying shortcuts', () => {
  it.each(['de', 'en'] as const)('renders crawlable shortcuts ahead of inventory in %s', async lang => {
    const html = renderToStaticMarkup(await Page({ params: Promise.resolve({ lang }), searchParams: Promise.resolve({}) }));
    expect(html).toContain('href="#angebote"');
    expect(html).toContain(`href="/${lang}/samsung-handys"`);
    expect(html).toContain(`href="/${lang}/repairs"`);
    expect(html.indexOf('href="#angebote"')).toBeLessThan(html.indexOf('id="angebote"'));
    expect(html).toContain(lang === 'de' ? 'Kaufen oder reparieren' : 'Buy or repair');
    expect(html).toContain('aria-labelledby="local-inventory-heading"');
    expect(html).toContain('BreadcrumbList');
  });
});
