import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import ProductOfferContents from '../ProductOfferContents';
import ProductPurchaseFacts from '../ProductPurchaseFacts';

describe('offer details on the product page', () => {
  it('shows selected gift icons, USB support and explicit absence of a charger', () => {
    const html = renderToStaticMarkup(createElement(ProductOfferContents, { locale: 'en', chargerIncluded: false, usbPdSupported: true, items: [{ label: { de: 'Hülle', en: 'Case' }, included: true, icon: 'case', isGift: true }, { label: { de: 'Nicht gewählt', en: 'Not selected' }, included: false, isGift: true }] }));
    expect(html).toContain('Charger not included');
    expect(html).toContain('USB Power Delivery supported');
    expect(html).toContain('Case');
    expect(html).toContain('<svg');
    expect(html).not.toContain('Not selected');
  });
  it('does not infer included chargers from missing data', () => {
    expect(renderToStaticMarkup(createElement(ProductOfferContents, { locale: 'en' }))).toBe('');
  });
  it('displays A+ and the complete battery range', () => {
    const html = renderToStaticMarkup(createElement(ProductPurchaseFacts, { locale: 'en', condition: 'used', conditionNote: 'Near-new condition', batteryHealthRange: { min: 95, max: 100 }, hasRealProductPhotos: true }));
    expect(html).toContain('A+');
    expect(html).toContain('95–100%');
    expect(html).not.toContain('Used');
  });
});
