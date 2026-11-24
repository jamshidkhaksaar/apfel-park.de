import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Product } from '@/lib/products';

const campaign = vi.hoisted(() => ({ phase: 'live' as 'off' | 'before' | 'live' | 'after' }));
const deals = vi.hoisted(() => ({ list: [] as unknown[] }));

vi.mock('@/lib/seasonal-theme-server', () => ({
  getEffectiveCampaign: async () => ({ mode: 'auto', source: 'calendar', phase: campaign.phase, theme: null }),
}));

vi.mock('@/lib/products', () => ({
  getBlackFridayDeals: async () => deals.list,
  getStoreCatalog: async () => ({ products: deals.list, total: deals.list.length, page: 1, pages: 1 }),
}));

const { pageRenderers } = await import('./page-renderers');
const { renderMarkdownDocument } = await import('./document');

const deal = (overrides: Partial<Product>): Product => ({
  id: 'p1',
  title: 'Apple iPhone 16 128GB',
  subtitle: '',
  description: '',
  slug: 'apple-iphone-16-128gb',
  price: 699,
  category: 'smartphones',
  condition: 'open_box',
  stock: 2,
  ...overrides,
}) as Product;

const render = async (id: string, locale: 'de' | 'en', path: string): Promise<string> => {
  const doc = await pageRenderers[id](locale, path);
  if (!doc) throw new Error(`no twin for ${id}`);
  return renderMarkdownDocument(doc);
};

describe('Black Week markdown twin', () => {
  beforeEach(() => {
    campaign.phase = 'live';
    deals.list = [
      deal({ campaignDeal: { percent: 12, referencePrice: 799, regularPrice: 799 } }),
      deal({ id: 'p2', title: 'Samsung Galaxy S25', slug: 'samsung-galaxy-s25', price: 649, condition: 'new', campaignDeal: { percent: 18, referencePrice: 799, regularPrice: 799 } }),
      deal({ id: 'p3', title: 'USB-C Ladekabel', slug: 'usb-c-ladekabel', price: 9.49, category: 'accessories', condition: 'new', campaignDeal: { percent: 5, referencePrice: 9.99, regularPrice: 9.99 } }),
    ];
  });

  it('lists live deals with price, saving against the 30-day lowest price and product link', async () => {
    const markdown = await render('black-friday', 'de', '/black-friday');
    expect(markdown).toContain('Canonical: https://apfel-park.de/de/black-friday');
    expect(markdown).toContain('Status: Die Aktion läuft. 3 Angebote verfügbar, bis zu 18 % Ersparnis.');
    // Every deal, grouped by category, smartphones before accessories.
    expect(markdown).toContain('### Smartphones (2 Angebote, bis zu 18 % Ersparnis)');
    expect(markdown.indexOf('### Smartphones')).toBeLessThan(markdown.indexOf('USB-C Ladekabel'));
    expect(markdown).toContain('Versand in ganz Deutschland');
    expect(markdown).toContain('niedrigster Preis der letzten 30 Tage');
    expect(markdown).toContain('https://apfel-park.de/de/store/samsung-galaxy-s25');
    // Biggest saving first.
    expect(markdown.indexOf('Samsung Galaxy S25')).toBeLessThan(markdown.indexOf('Apple iPhone 16 128GB'));
  });

  it('serves the same facts in English', async () => {
    const markdown = await render('black-friday', 'en', '/black-friday');
    expect(markdown).toContain('Canonical: https://apfel-park.de/en/black-friday');
    expect(markdown).toContain('saving up to 18%');
    expect(markdown).toContain('lowest price of the previous 30 days');
  });

  it('makes no saving claim before the sale starts', async () => {
    campaign.phase = 'before';
    const markdown = await render('black-friday', 'de', '/black-friday');
    expect(markdown).toContain('Bis dahin gelten die regulären Preise');
    expect(markdown).not.toContain('Ersparnis');
  });

  it('announces the next Black Week off season', async () => {
    campaign.phase = 'off';
    const markdown = await render('black-friday', 'de', '/black-friday');
    expect(markdown).toMatch(/# Black Friday \d{4}/);
    expect(markdown).not.toContain('apple-iphone-16-128gb');
  });
});

describe('service page markdown twins', () => {
  it('renders delivery, conditions, withdrawal, trade-in, guide and store pages in both languages', async () => {
    deals.list = [deal({})];
    const pages: Array<[string, string, string]> = [
      ['delivery-returns', '/delivery-returns', 'Widerrufsrecht (14 Tage)'],
      ['device-conditions', '/device-conditions', 'Unboxed (Open-Box)'],
      ['withdrawal', '/withdrawal', 'Muster-Widerruf'],
      ['trade-in', '/trade-in', 'Altes Gerät verkaufen'],
      ['smartphone-longevity-guide', '/ratgeber/smartphone-laenger-nutzen', 'Reparieren oder ersetzen?'],
      ['local-store', '/handy-shop-hamburg-wilhelmsburg', 'Apple iPhone 16 128GB'],
    ];
    for (const [id, path, expected] of pages) {
      const markdown = await render(id, 'de', path);
      expect(markdown, id).toContain(expected);
      expect(markdown, id).toContain(`Canonical: https://apfel-park.de/de${path}`);
      expect((await render(id, 'en', path)).length, `${id} en`).toBeGreaterThan(200);
    }
  });

  it('puts the English store page on its English slug', async () => {
    const markdown = await render('local-store', 'en', '/phone-store-hamburg-wilhelmsburg');
    expect(markdown).toContain('Canonical: https://apfel-park.de/en/phone-store-hamburg-wilhelmsburg');
  });
});
