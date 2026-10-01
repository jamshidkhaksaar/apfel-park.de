import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, expect, it, vi } from 'vitest';

import CheckoutPage from '@/app/(site)/[lang]/checkout/page';
import CheckoutClient from '@/components/checkout/CheckoutClient';
import { getDictionary } from '../i18n';

vi.mock('../coupon-repository', () => ({ hasActiveCouponCampaign: async () => false }));
vi.mock('../payment-availability.server', () => ({ isPayPalConfigured: () => false }));
vi.mock('@/components/checkout/cart', () => ({
  subscribeStoredCart: () => () => {},
  readStoredCart: () => [],
  getServerCartSnapshot: () => [],
  writeStoredCart: vi.fn(),
}));
afterEach(() => vi.unstubAllEnvs());

it.each(['de', 'en'])('passes only the trimmed dedicated runtime browser key to %s checkout', async (lang) => {
  vi.stubEnv('GOOGLE_PLACES_BROWSER_API_KEY', ' MOCKED ');
  const page = await CheckoutPage({ params: Promise.resolve({ lang }), searchParams: Promise.resolve({}) });
  expect(page.props.children.props.children.props.googlePlacesApiKey).toBe('MOCKED');
  vi.stubEnv('GOOGLE_PLACES_BROWSER_API_KEY', '  ');
  const absent = await CheckoutPage({ params: Promise.resolve({ lang }), searchParams: Promise.resolve({}) });
  expect(absent.props.children.props.children.props.googlePlacesApiKey).toBeNull();
});

it.each(['de', 'en'])('uses the existing street input without standalone Google controls (%s)', (locale) => {
  const render = (shipping: 'germany' | 'pickup', key?: string): string => renderToStaticMarkup(createElement(
    CheckoutClient, { locale: locale as 'de' | 'en', initialShippingMethod: shipping, ...{ googlePlacesApiKey: key } },
  ));
  expect(render('germany', 'MOCKED')).toContain('data-checkout-street-address');
  expect(render('germany', 'MOCKED')).not.toContain('data-google-address-search');
  expect(render('germany', 'MOCKED')).toContain('role="combobox"');
  expect(render('germany', 'MOCKED')).not.toMatch(/Enable Google|Disable Google|Adresssuche aktivieren/);
  expect(render('germany')).not.toContain('data-google-address-search');
  expect(render('pickup', 'MOCKED')).not.toContain('data-google-address-search');
  expect(render('germany', 'MOCKED')).toMatch(/autoComplete="address-line2"/i);
});

it.each(['de', 'en'])('discloses optional address input processing in default privacy content (%s)', (locale) => {
  const text = getDictionary(locale as 'de' | 'en').privacy.sections.flatMap(section => section.body).join(' ');
  expect(text).toContain('Google Places');
  expect(text).toContain(locale === 'de' ? 'Adresseingaben' : 'address input');
});
