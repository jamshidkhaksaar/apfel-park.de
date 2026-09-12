import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import PaymentBrandIcons from '../../components/PaymentBrandIcons';
import { isPayPalConfigured } from '../payment-availability.server';

afterEach(() => vi.unstubAllEnvs());
describe('payment brand configuration parity', () => {
  it.each([
    { id: '', secret: '', expected: false },
    { id: 'fixture-id', secret: '', expected: false },
    { id: '', secret: 'fixture-secret', expected: false },
    { id: ' ', secret: 'fixture-secret', expected: false },
    { id: ' fixture-id ', secret: ' fixture-secret ', expected: true },
  ])('advertises PayPal only for complete configuration: $expected', ({ id, secret, expected }) => {
    vi.stubEnv('PAYPAL_CLIENT_ID', id);
    vi.stubEnv('PAYPAL_CLIENT_SECRET', secret);
    const enabled = isPayPalConfigured();
    expect(enabled).toBe(expected);
    const html = renderToStaticMarkup(createElement(PaymentBrandIcons, { includePayPal: enabled }));
    expect(html.includes('aria-label="PayPal"')).toBe(expected);
    expect(html).not.toContain('fixture-id');
    expect(html).not.toContain('fixture-secret');
    expect(html).toContain('aria-label="Google Pay"');
  });
  it('keeps generic unconfigured callers opt-in', () => {
    expect(renderToStaticMarkup(createElement(PaymentBrandIcons))).not.toContain('aria-label="PayPal"');
  });
});
