import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { CatalogCardModel } from '@/lib/catalog-card';
import RepairPriceComparisonPage from '@/app/(site)/[lang]/repairs/preisvergleich-hamburg/page';
import StoreProductCard from '../store/StoreProductCard';
import StoreProductRow from '../store/StoreProductRow';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('../store/StoreQuickAddDrawer', () => ({ default: () => null }));

const product: CatalogCardModel = {
  id: 'seo-fixture', title: 'Fixture Phone 128 GB', slug: 'fixture-phone',
  image: '/images/ipad.png', price: 199, category: 'smartphones', condition: 'used',
  stock: 3, facts: ['128 GB'], colors: ['Black'], storages: ['128 GB'], variants: [],
};

afterEach(() => vi.unstubAllEnvs());

describe('crawlable commerce links', () => {
  for (const Component of [StoreProductCard, StoreProductRow]) {
    for (const locale of ['de', 'en'] as const) {
      it(`${Component.name}/${locale}: names the link without changing the card controls`, () => {
        const html = renderToStaticMarkup(createElement(Component, {
          product, locale, listName: 'Fixture', position: 1,
        }));
        const anchor = html.match(/<a\b[^>]*href="[^\"]*\/store\/fixture-phone"[^>]*>([\s\S]*?)<\/a>/);
        expect(anchor?.[1]).toBe('<span class="sr-only">Fixture Phone 128 GB</span>');
        expect(html).toContain(locale === 'de' ? 'in den Warenkorb' : 'Add Fixture Phone 128 GB to cart');
        expect(anchor?.[0]).not.toContain('<button');
      });

      it(`${Component.name}/${locale}: retains the out-of-stock detail link and disabled purchase`, () => {
        const html = renderToStaticMarkup(createElement(Component, {
          product: { ...product, stock: 0 }, locale, listName: 'Fixture', position: 1,
        }));
        expect(html).toContain(`href="/${locale}/store/fixture-phone"`);
        expect(html).toContain('<span class="sr-only">Fixture Phone 128 GB</span>');
        expect(html).toMatch(/<button\b[^>]*disabled/);
      });
    }
  }

  for (const locale of ['de', 'en'] as const) {
    it(`${locale}: follows its localized repair source and preserves external qualifiers`, async () => {
      vi.stubEnv('REPAIR_PRICE_COMPARISON_VERIFIED', 'true');
      const html = renderToStaticMarkup(await RepairPriceComparisonPage({ params: Promise.resolve({ lang: locale }) }));
      const ownSource = html.match(/<a\b([^>]*)>Apfel Park<\/a>/);
      expect(ownSource?.[1]).toContain(`href="/${locale}/repairs"`);
      expect(ownSource?.[1]).not.toContain('nofollow');
      expect(html).toMatch(/<a\b[^>]*rel="noopener noreferrer nofollow"[^>]*>iSmart Repair<\/a>/);
    });
  }

  it('keeps the HTTPS edge policy consistent on redirects and static files', () => {
    const nginx = readFileSync('deployment/vps/nginx/apfel-park.conf', 'utf8');
    const edge = 'add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;';
    expect(nginx.match(/add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;/g)).toHaveLength(4);
    expect(nginx).toContain('proxy_hide_header Strict-Transport-Security;');
    expect(nginx.slice(nginx.indexOf('server_name www.apfel-park.de;'), nginx.indexOf('server_name apfel-park.de;'))).toContain(edge);
    // The separate mail host keeps its existing policy and proxy configuration.
    expect(nginx).toContain('add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;');
  });
});
