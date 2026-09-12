import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import CollectionBuyingGuide from '../../components/store/CollectionBuyingGuide';
import { analyticsItem, withGa4Items } from '../analytics';
import { catalogListFields, getCollectionAnalyticsList } from '../store-collection-analytics';
import { getStoreCollectionCopy, storeCollectionIds } from '../store-collections';
import { buildStoreCanonicalUrl, resolveStoreIndexing } from '../store-indexing';

const measured = ['samsung-phones', 'used-iphones', 'phones-without-contract'] as const;

describe('three-page collection growth release', () => {
  it.each(['de', 'en'] as const)('limits guides and analytics to the agreed collections in %s', locale => {
    for (const id of storeCollectionIds) {
      const included = measured.some(target => target === id);
      expect(Boolean(getStoreCollectionCopy(id, locale).comparison)).toBe(included);
      expect(Boolean(getCollectionAnalyticsList(id, locale))).toBe(included);
      if (included) expect(getCollectionAnalyticsList(id, locale)?.id).toBe(id);
    }
  });

  it.each(measured)('%s renders accessible, linked buying content in both locales', id => {
    for (const locale of ['de', 'en'] as const) {
      const guide = getStoreCollectionCopy(id, locale).comparison!;
      expect(guide.rows.every(row => row.length === guide.columns.length)).toBe(true);
      const html = renderToStaticMarkup(createElement(CollectionBuyingGuide, { guide, locale }));
      expect(html).toContain('<table');
      expect(html).toContain('<caption');
      expect(html).toContain('scope="col"');
      expect(html).toContain('scope="row"');
      expect(html).toContain('aria-describedby="collection-comparison-note"');
      expect(html).not.toContain('application/ld+json');
      for (const link of guide.links) {
        expect(html).toContain(`href="/${locale}${link.href}"`);
        expect(link.href.startsWith('/')).toBe(true);
      }
    }
  });

  it('keeps model searches shareable but noindex with an unchanged collection canonical', () => {
    const guide = getStoreCollectionCopy('samsung-phones', 'de').comparison!;
    const links = guide.links.filter(link => link.href.includes('?'));
    expect(links).toHaveLength(2);
    expect(links.map(link => new URL(link.href, 'https://apfel-park.de').searchParams.get('q'))).toEqual(['Galaxy A55', 'Galaxy S24']);
    for (const link of links) {
      const url = new URL(link.href, 'https://apfel-park.de');
      const indexing = resolveStoreIndexing({ q: url.searchParams.get('q')! });
      expect(indexing.noindex).toBe(true);
      expect(buildStoreCanonicalUrl('https://apfel-park.de/de/samsung-handys', indexing)).toBe('https://apfel-park.de/de/samsung-handys');
      expect(url.pathname).toBe('/samsung-handys');
    }
  });

  it('documents model limitations and official sources without stock or battery promises', () => {
    const samsung = getStoreCollectionCopy('samsung-phones', 'de').comparison!;
    expect(samsung.note).toContain('keine Bestandszusage');
    expect(samsung.rows[0][1]).toContain('6,6');
    expect(samsung.rows[0][2]).toContain('6,2');
    expect(samsung.sources).toHaveLength(3);
    for (const source of samsung.sources!) expect(new URL(source.href).hostname).toMatch(/(^|\.)samsung\.com$/);
    const used = getStoreCollectionCopy('used-iphones', 'de').comparison!;
    expect(used.rows.flat().join(' ')).toContain('Aktivierungssperre');
    expect(used.rows.flat().join(' ')).toContain('Teile- und Serviceprotokoll');
    expect(used.rows.flat().join(' ')).not.toMatch(/(?:80|85|90|100)\s*%/);
    expect(getStoreCollectionCopy('phones-without-contract', 'de').intro[0]).toContain('hängt vom genauen Gerät');
    expect(getStoreCollectionCopy('phones-without-contract', 'en').intro[0]).toContain('depends on the exact device');
  });

  it('keeps legacy list defaults and matches item-level and event-level identity', () => {
    expect(catalogListFields('Smartphones')).toEqual({ item_list_id: 'store-catalog', item_list_name: 'Smartphones' });
    for (const id of measured) {
      const list = getCollectionAnalyticsList(id, 'de')!;
      const fields = catalogListFields(list.name, list.id);
      const event = withGa4Items(fields, [analyticsItem({ item_id: 'test', item_name: 'Test', ...fields })]);
      expect(event.item_list_id).toBe(id);
      expect(event.items).toEqual([{ item_id: 'test', item_name: 'Test', ...fields }]);
    }
  });
});
