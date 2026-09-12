import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CatalogCardModel } from '../catalog-card';

const harness = vi.hoisted(() => ({
  effects: [] as Array<() => void | (() => void)>, cleanups: [] as Array<() => void>,
  pathname: '/de/store/qa-product', search: '', fetch: vi.fn(),
}));
vi.mock('react', async original => ({
  ...await original<typeof import('react')>(),
  useRef: (initial: unknown) => ({ current: initial }),
  useEffect: (effect: () => void | (() => void)) => { harness.effects.push(effect); },
}));
vi.mock('next/navigation', () => ({
  usePathname: () => harness.pathname,
  useSearchParams: () => new URLSearchParams(harness.search), useRouter: () => ({ push: vi.fn() }),
}));

import ProductViewTracker from '@/components/ProductViewTracker';
import StoreCatalogClient from '@/components/store/StoreCatalogClient';
import MarketingConsentScripts from '@/components/MarketingConsentScripts';
import { CONSENT_EVENT_NAME } from '../consent';
import { TRACKING_READY_EVENT } from '../analytics';
import { getCollectionAnalyticsList, type CatalogAnalyticsList } from '../store-collection-analytics';

const product: CatalogCardModel = { id: '11111111-1111-4111-8111-111111111111', title: 'QA Product', slug: 'qa-product', image: '/images/qa.webp', price: 10, category: 'smartphones', condition: 'new', stock: 1, facts: [], colors: [], storages: [], variants: [] };
const productView = () => ProductViewTracker({ productId: product.id, title: product.title, category: product.category, price: product.price, locale: 'de', slug: product.slug });
const catalogView = (analyticsList?: CatalogAnalyticsList) => StoreCatalogClient({
  analyticsList,
  products: [product], lang: 'de', total: 1, page: 2, pages: 2,
  counts: { all: 1, smartphones: 1, tablets: 0, accessories: 0, laptops: 0, consoles: 0, 'open-box-smartphones-tablets': 0 },
  facets: { brands: [], storages: [], conditions: [], accessoryTypes: [], inStock: 1, priceMin: 10, priceMax: 10 },
  activeFilters: { query: '', brands: [], storages: [], conditions: [], accessoryTypes: [], inStockOnly: false },
});
const bridge = () => MarketingConsentScripts({ googleAnalyticsEnabled: true, googleAnalyticsId: 'G-QATESTONLY', metaPixelEnabled: false, metaPixelId: '', tiktokPixelEnabled: false, tiktokPixelId: '' });
const mount = (component: () => unknown) => {
  const first = harness.effects.length;
  component();
  for (const effect of harness.effects.slice(first)) { const cleanup = effect(); if (typeof cleanup === 'function') harness.cleanups.push(cleanup); }
};
const events = (name: string) => (window.dataLayer ?? []).map(row => Array.from(row as ArrayLike<unknown>)).filter(row => row[0] === 'event' && row[1] === name);
const grant = () => { document.cookie = 'apfel-consent=external'; window.dispatchEvent(new CustomEvent(CONSENT_EVENT_NAME, { detail: 'external' })); };

beforeEach(() => {
  vi.useFakeTimers(); harness.effects.length = 0; harness.cleanups.length = 0;
  harness.pathname = '/de/store/qa-product'; harness.search = '';
  harness.fetch.mockReset().mockResolvedValue({ ok: true });
  vi.stubGlobal('fetch', harness.fetch);
  vi.stubGlobal('window', Object.assign(new EventTarget(), {
    location: { origin: 'https://apfel-park.de', get pathname() { return harness.pathname; }, get search() { return harness.search; } },
    localStorage: { getItem: vi.fn(() => null) },
    setTimeout: (fn: () => void, delay: number) => setTimeout(fn, delay), clearTimeout: (timer: ReturnType<typeof setTimeout>) => clearTimeout(timer),
  }));
  vi.stubGlobal('document', { cookie: 'apfel-consent=external', referrer: '', getElementById: vi.fn(() => null), createElement: vi.fn(() => ({})), head: { appendChild: vi.fn() } });
});
afterEach(() => { for (const cleanup of harness.cleanups) cleanup(); vi.unstubAllGlobals(); vi.useRealTimers(); });

describe('current-page view tracking', () => {
  it.each(['samsung-phones', 'used-iphones', 'phones-without-contract'] as const)('keeps %s identity through the real consent bridge', async id => {
    harness.pathname = '/de/samsung-handys'; document.cookie = 'apfel-consent=necessary';
    mount(bridge); mount(() => catalogView(getCollectionAnalyticsList(id, 'de')));
    expect(events('view_item_list')).toHaveLength(0);
    grant(); await vi.advanceTimersByTimeAsync(0);
    window.dispatchEvent(new Event(TRACKING_READY_EVENT));
    expect(events('view_item_list')).toHaveLength(1);
    const payload = events('view_item_list')[0][2] as { item_list_id: string; item_list_name: string; items: Array<{ item_list_id: string; item_list_name: string }> };
    expect(payload.item_list_id).toBe(id);
    expect(payload.items[0].item_list_id).toBe(id);
    expect(payload.items[0].item_list_name).toBe(payload.item_list_name);
  });
  it('records a product after late bridge installation with one shared browser/server event ID', async () => {
    mount(productView); await vi.advanceTimersByTimeAsync(2_000); mount(bridge);
    expect(events('view_item')).toHaveLength(1);
    expect(harness.fetch).toHaveBeenCalledTimes(1);
    const payload = events('view_item')[0][2] as Record<string, unknown>;
    expect(JSON.parse(harness.fetch.mock.calls[0][1].body).eventId).toBe(payload.event_id);
  });
  it('does not send a product observation after its component is removed', async () => {
    mount(productView); for (const cleanup of harness.cleanups.splice(0)) cleanup();
    await vi.advanceTimersByTimeAsync(2_000); mount(bridge);
    expect(events('view_item')).toHaveLength(0); expect(harness.fetch).not.toHaveBeenCalled();
  });
  it('records the current catalog when consent is granted later', async () => {
    harness.pathname = '/de/store'; document.cookie = 'apfel-consent=necessary';
    mount(bridge); mount(catalogView); grant(); await vi.advanceTimersByTimeAsync(0);
    expect(events('view_item_list')).toHaveLength(1);
    const payload = events('view_item_list')[0][2] as { items: Array<{ index: number; item_id: string }> };
    expect(payload.items[0]).toMatchObject({ index: 25, item_id: product.id });
  });
  it('records a catalog when the bridge mounts late', async () => {
    harness.pathname = '/de/store'; mount(catalogView); await vi.advanceTimersByTimeAsync(2_000); mount(bridge);
    expect(events('view_item_list')).toHaveLength(1);
  });
  it('never replays old observations after navigation while waiting for consent', async () => {
    document.cookie = 'apfel-consent=necessary'; mount(productView);
    harness.pathname = '/de/contact'; mount(bridge); grant(); await vi.advanceTimersByTimeAsync(2_000);
    expect(events('view_item')).toHaveLength(0); expect(harness.fetch).not.toHaveBeenCalled();
  });
  it('does not duplicate a browser product event after a server-request failure', async () => {
    harness.fetch.mockRejectedValue(new Error('Network failure')); mount(bridge); mount(productView);
    await vi.advanceTimersByTimeAsync(0); grant(); await vi.advanceTimersByTimeAsync(0);
    window.dispatchEvent(new Event(TRACKING_READY_EVENT));
    expect(events('view_item')).toHaveLength(1);
  });
  it.each(['/admin/orders', '/store/preview/private-token'])('does not send client or server views on %s', async path => {
    harness.pathname = path; mount(bridge); mount(productView); mount(catalogView);
    grant(); await vi.advanceTimersByTimeAsync(2_000);
    expect(events('view_item')).toHaveLength(0); expect(events('view_item_list')).toHaveLength(0);
    expect(events('page_view')).toHaveLength(0);
    expect(harness.fetch).not.toHaveBeenCalled();
  });
  it('waits for an accepted bridge context before marking a product viewed', () => {
    window.apfelTrack = vi.fn(() => false); mount(productView);
    expect(harness.fetch).not.toHaveBeenCalled();
    mount(bridge);
    expect(events('view_item')).toHaveLength(1); expect(harness.fetch).toHaveBeenCalledTimes(1);
  });
  it('deduplicates a list while effects reconnect', () => {
    harness.pathname = '/de/store'; mount(bridge); mount(catalogView);
    for (const cleanup of harness.cleanups.splice(0)) cleanup();
    for (const effect of [...harness.effects]) { const cleanup = effect(); if (typeof cleanup === 'function') harness.cleanups.push(cleanup); }
    expect(events('view_item_list')).toHaveLength(1);
  });
});
