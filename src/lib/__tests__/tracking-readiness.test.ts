import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const harness = vi.hoisted(() => ({
  effects: [] as Array<() => void | (() => void)>,
  cleanups: [] as Array<() => void>,
  pathname: '/de/checkout/success',
}));
vi.mock('react', async original => ({
  ...await original<typeof import('react')>(),
  useState: (initial: unknown) => [typeof initial === 'function' ? (initial as () => unknown)() : initial, vi.fn()],
  useRef: (initial: unknown) => ({ current: initial }),
  useEffect: (effect: () => void | (() => void)) => { harness.effects.push(effect); },
}));
vi.mock('next/navigation', () => ({
  usePathname: () => harness.pathname,
  useSearchParams: () => new URLSearchParams('provider=stripe&order_id=private-test-order&token=private-test-token'),
}));
vi.mock('@/components/checkout/cart', () => ({ clearStoredCart: vi.fn() }));

import CheckoutSuccessClient from '@/components/checkout/CheckoutSuccessClient';
import MarketingConsentScripts from '@/components/MarketingConsentScripts';
import { CONSENT_EVENT_NAME } from '../consent';
import { TRACKING_READY_EVENT } from '../analytics';

const mount = (component: () => unknown) => {
  const first = harness.effects.length;
  component();
  for (const effect of harness.effects.slice(first)) {
    const cleanup = effect();
    if (typeof cleanup === 'function') harness.cleanups.push(cleanup);
  }
};
const receipt = () => CheckoutSuccessClient({
  locale: 'de', orderId: '11111111-1111-4111-8111-111111111111', initiallyPaid: true,
  totalAmount: 10, provider: 'stripe', currency: 'EUR',
});
const bridge = () => MarketingConsentScripts({
  googleAnalyticsEnabled: true, googleAnalyticsId: 'G-QATESTONLY',
  metaPixelEnabled: false, metaPixelId: '', tiktokPixelEnabled: false, tiktokPixelId: '',
});
const commands = () => (window.dataLayer ?? []).map(row => Array.from(row as ArrayLike<unknown>));
const events = (name: string) => commands().filter(row => row[0] === 'event' && row[1] === name);
const consent = (mode: 'necessary' | 'external') => {
  document.cookie = `apfel-consent=${mode}`;
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT_NAME, { detail: mode }));
};

beforeEach(() => {
  vi.useFakeTimers();
  harness.effects.length = 0;
  harness.cleanups.length = 0;
  harness.pathname = '/de/checkout/success';
  vi.stubGlobal('window', Object.assign(new EventTarget(), {
    location: { origin: 'https://apfel-park.de', hostname: 'apfel-park.de', protocol: 'https:' },
    localStorage: { getItem: vi.fn(() => null) },
    setTimeout: (callback: () => void, delay: number) => setTimeout(callback, delay),
    clearTimeout: (timer: ReturnType<typeof setTimeout>) => clearTimeout(timer),
  }));
  vi.stubGlobal('document', {
    cookie: 'apfel-consent=external', referrer: 'https://apfel-park.de/de/cart?email=private@example.test',
    getElementById: vi.fn(() => null), createElement: vi.fn(() => ({})),
    head: { appendChild: vi.fn() },
  });
});
afterEach(() => {
  for (const cleanup of harness.cleanups) cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('actual receipt and tracking-bridge lifecycle', () => {
  it('queues the purchase when the bridge mounts after the old two-second window', async () => {
    mount(receipt);
    await vi.advanceTimersByTimeAsync(4_000);
    expect(events('purchase')).toHaveLength(0);
    mount(bridge);
    expect(events('purchase')).toHaveLength(1);
    expect(events('page_view')).toHaveLength(1);
  });
  it('initializes GA before the purchase even when the receipt consent listener mounted first', () => {
    document.cookie = 'apfel-consent=necessary';
    mount(receipt);
    mount(bridge);
    expect(window.gtag).toBeUndefined();
    consent('external');
    expect(events('purchase')).toHaveLength(1);
    expect(events('page_view')).toHaveLength(1);
  });
  it('does not grant consent through a readiness notification or resend a purchase after re-consent', () => {
    document.cookie = 'apfel-consent=necessary';
    mount(receipt);
    mount(bridge);
    window.dispatchEvent(new Event(TRACKING_READY_EVENT));
    expect(commands()).toHaveLength(0);
    consent('external');
    consent('necessary');
    consent('external');
    window.dispatchEvent(new Event(TRACKING_READY_EVENT));
    expect(events('purchase')).toHaveLength(1);
  });
  it('does not queue any page/purchase events on excluded private routes', () => {
    harness.pathname = '/admin/orders';
    mount(receipt);
    mount(bridge);
    expect(events('purchase')).toHaveLength(0);
    expect(events('page_view')).toHaveLength(0);
  });
  it('preserves transaction identity and strips sensitive page/referrer parameters', () => {
    mount(bridge);
    mount(receipt);
    const event = events('purchase')[0][2] as Record<string, unknown>;
    expect(event.transaction_id).toBe('11111111-1111-4111-8111-111111111111');
    expect(event.value).toBe(10);
    expect(event.page_location).not.toContain('private-test');
    expect(event.page_referrer).not.toContain('private@example');
    expect(event.page_location).not.toContain('order_id=');
  });
  it('removes the receipt listener after unmount', () => {
    mount(receipt);
    for (const cleanup of harness.cleanups.splice(0)) cleanup();
    mount(bridge);
    expect(events('purchase')).toHaveLength(0);
  });
  it('never treats a readiness notification as a payment confirmation', () => {
    mount(() => CheckoutSuccessClient({ locale: 'de', orderId: 'pending-order', initiallyPaid: false, totalAmount: 10 }));
    mount(bridge);
    window.dispatchEvent(new Event(TRACKING_READY_EVENT));
    expect(events('purchase')).toHaveLength(0);
  });
  it('keeps the paid receipt safe if the bridge throws and retries only on a later ready signal', () => {
    window.apfelTrack = vi.fn(() => { throw new Error('Optional tracker failed'); });
    expect(() => mount(receipt)).not.toThrow();
    const recovered = vi.fn();
    window.apfelTrack = recovered;
    window.dispatchEvent(new Event(TRACKING_READY_EVENT));
    window.dispatchEvent(new Event(TRACKING_READY_EVENT));
    expect(recovered).toHaveBeenCalledTimes(1);
    expect(recovered.mock.calls[0][2]).toBe('purchase-11111111-1111-4111-8111-111111111111');
  });
  it('does not duplicate page views or purchases when effects reconnect', () => {
    mount(bridge);
    mount(receipt);
    for (const cleanup of harness.cleanups.splice(0)) cleanup();
    for (const effect of [...harness.effects]) {
      const cleanup = effect();
      if (typeof cleanup === 'function') harness.cleanups.push(cleanup);
    }
    expect(events('page_view')).toHaveLength(1);
    expect(events('purchase')).toHaveLength(1);
  });
});
