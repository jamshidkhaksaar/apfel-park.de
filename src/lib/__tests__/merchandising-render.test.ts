import { createElement } from 'react';
import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import AccessoryCategoryCards from '../../components/store/AccessoryCategoryCards';
import TrendingProductsCarousel from '../../components/store/TrendingProductsCarousel';
import type { CatalogCardModel } from '../catalog-card';

const cards = (): CatalogCardModel[] => Array.from({length:8}, (_, i) => ({
  id:`p${i}`,title:`Phone ${i}`,slug:`phone-${i}`,price:299,stock:1,image:'/test.webp',condition:'new',
} as CatalogCardModel));

describe('merchandising server HTML', () => {
  it('reserves sticky-header space at the cases-card destination', () => {
    const source=readFileSync('src/app/(site)/[lang]/accessories/page.tsx','utf8');
    expect(source).toMatch(/<section className="scroll-mt-32 [^"]*" id="store">/);
  });
  it.each(['de','en'] as const)('links the %s cases card to the broad live filter and the product section', lang => {
    const html = renderToStaticMarkup(createElement(AccessoryCategoryCards, {lang}));
    expect(html).toContain(`href="/${lang}/accessories?atype=cases#store"`);
    expect(html).not.toContain(`href="/${lang}/accessories/hardcases"`);
    for(const slug of ['kopfhoerer-audio','ladegeraete-kabel','displayschutz']) expect(html).toContain(`href="/${lang}/accessories/${slug}"`);
    expect(html.match(/data-accessory-category=/g)).toHaveLength(4);
  });
  it.each(['de','en'] as const)('renders exactly eight available links in %s without a live-research claim', lang => {
    const html = renderToStaticMarkup(createElement(TrendingProductsCarousel, {lang, products:cards()}));
    expect(html.match(/data-trending-card=/g)).toHaveLength(8);
    expect(html).not.toMatch(/current search demand|aktueller Suchnachfrage/);
  });
  it('does not render a partial or duplicate carousel', () => {
    for(const products of [cards().slice(0,7), [...cards().slice(0,7), cards()[0]], cards().map(p=>({...p,stock:0}))]) {
      expect(renderToStaticMarkup(createElement(TrendingProductsCarousel, {lang:'de',products}))).toBe('');
    }
  });
});
