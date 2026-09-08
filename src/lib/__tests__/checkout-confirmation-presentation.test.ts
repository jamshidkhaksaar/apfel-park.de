import { createElement, useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ effects: [] as Array<() => void | (() => void)>, clearCart: vi.fn() }));
vi.mock('react', async (importOriginal) => ({
  ...await importOriginal<typeof import('react')>(), useState: vi.fn(),
  useEffect: (effect: () => void | (() => void)) => { mocks.effects.push(effect); },
}));
vi.mock('@/components/checkout/cart', () => ({ clearStoredCart: mocks.clearCart }));
import CheckoutSuccessClient from '@/components/checkout/CheckoutSuccessClient';

afterEach(() => {
  vi.mocked(useState).mockReset();
  mocks.effects.length = 0;
  mocks.clearCart.mockReset();
  vi.unstubAllGlobals();
});

const render = (paid: boolean, issue: boolean) => {
  vi.mocked(useState)
    .mockReturnValueOnce([paid, vi.fn()])
    .mockReturnValueOnce([issue, vi.fn()])
    .mockReturnValueOnce(['', vi.fn()]);
  return renderToStaticMarkup(createElement(CheckoutSuccessClient, {
    locale: 'de', provider: 'stripe', orderId: '11111111-1111-4111-8111-111111111111',
    orderNumber: 999999, initiallyPaid: paid, totalAmount: 10, shippingMethod: 'pickup',
  }));
};

describe('confirmation receipt presentation', () => {
  it('keeps the receipt but removes pickup/shipping promises for closed or failed confirmation', () => {
    const html = render(false, true);
    expect(html).toContain('Bitte prüfe deinen Bestellstatus.');
    expect(html).toContain('role="status" aria-live="polite" aria-atomic="true"');
    expect(html).toContain('#A-999999');
    expect(html).not.toContain('Wie es weitergeht');
    expect(html).not.toContain('sobald dein Gerät abholbereit ist');
  });
  it('retains the normal confirmed receipt and fulfilment information', () => {
    const html = render(true, false);
    expect(html).toContain('Danke für deine Bestellung.');
    expect(html).toContain('Wie es weitergeht');
  });
  it('does not call a pending order paid', () => {
    const html = render(false, false);
    expect(html).toContain('Wir warten auf die Zahlungsbestätigung.');
    expect(html).not.toContain('Danke für deine Bestellung.');
  });
  it('keeps a confirmed receipt working when optional browser cart cleanup throws', () => {
    mocks.clearCart.mockImplementation(() => { throw new Error('Storage denied'); });
    vi.stubGlobal('document', { cookie: 'apfel-consent=necessary' });
    vi.stubGlobal('window', { addEventListener: vi.fn(), removeEventListener: vi.fn() });
    const html = render(true, false);
    expect(html).toContain('Danke für deine Bestellung.');
    expect(() => {
      const cleanup = mocks.effects[0]();
      if (typeof cleanup === 'function') cleanup();
    }).not.toThrow();
    expect(mocks.clearCart).toHaveBeenCalledOnce();
  });
});
