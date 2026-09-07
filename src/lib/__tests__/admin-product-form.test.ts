import { describe, expect, it } from 'vitest';
import { createEmptyVariant, parseFaqText, parseFeatureBullets, parseSpecs, productToForm } from '../admin-product-form';
import { createEmptyProductChannelFields, productChannelPayload } from '../product-channel-form';
import { formatSocialPublishMessage } from '../admin-product-messages';
import type { AdminProductRecord } from '../admin-product-types';

const product: AdminProductRecord = {
  id: 'phone', title: 'Phone', subtitle: '', description: 'Test phone', category: 'smartphones', condition: 'used',
  brand: 'Apple', model: 'iPhone', mpn: 'MPN', gtin: '123', sku: 'SKU', price: 99, compareAtPrice: 0, stock: 0,
  slug: 'phone', isActive: false, images: ['/photo.webp'], featureBullets: ['Tested'],
  specs: [{ label: 'Capacity', value: '256 GB', group: 'Storage' }, { label: 'Color', value: 'Blue', group: 'Storage' }],
  variants: [{ color: 'Blue', storage: '256 GB', stock: 0, price: 0, images: ['/variant.webp'] }],
  batteryHealth: 85, batteryDetails: { included: false, count: 0 }, chargerIncluded: false, usbPdSupported: false,
  packageWeightKg: 0, chargingPowerMinW: 0, faq: { de: [{ q: 'Garantie?', a: 'Ja.\nDetails.' }], en: [] },
  createdAt: '2026-01-01T00:00:00Z', isHomepageFeatured: false,
};

describe('extracted product form behavior', () => {
  it('preserves grouped specifications, variant photos, false flags and zero quantities', () => {
    const form = productToForm(product);
    expect(parseSpecs(form.specsText)).toEqual(product.specs);
    expect(form.variants).toEqual(product.variants);
    expect(form.stock).toBe('0');
    const channels = productChannelPayload(form.channelFields);
    expect(channels).toMatchObject({ packageWeightKg: 0, chargerIncluded: false, chargingPowerMinW: 0, usbPdSupported: false, batteryDetails: { included: false, count: 0 } });
    expect(parseFaqText(form.faqDeText)).toEqual(product.faq?.de);
  });
  it('keeps unknown channel values distinct from false or zero', () => {
    const empty = createEmptyProductChannelFields();
    expect(productChannelPayload(empty)).toMatchObject({ packageWeightKg: null, chargerIncluded: null, usbPdSupported: null, batteryDetails: {} });
    expect(productChannelPayload({ ...empty, packageWeightKg: 'not a number' }).packageWeightKg).toBeNull();
  });
  it('parses supported spec separators and skips malformed lines', () => {
    expect(parseSpecs('## Display\nSize: 6.1 inches\nResolution = 1080p\ninvalid\nColor – Blue\n')).toEqual([
      { label: 'Size', value: '6.1 inches', group: 'Display' }, { label: 'Resolution', value: '1080p', group: 'Display' }, { label: 'Color', value: 'Blue', group: 'Display' },
    ]);
    expect(parseFeatureBullets('  Tested\n\n Warranty  ')).toEqual(['Tested', 'Warranty']);
  });
  it('caps complete FAQ entries and retains multiline answers', () => {
    const text = Array.from({ length: 12 }, (_, i) => `Question ${i}\nFirst line\nSecond line`).join('\n\n');
    expect(parseFaqText(text)).toHaveLength(10);
    expect(parseFaqText('Incomplete question')).toEqual([]);
    expect(parseFaqText(text)[0].a).toBe('First line\nSecond line');
  });
  it('creates independent blank variants', () => {
    const first = createEmptyVariant(); first.color = 'Blue'; expect(createEmptyVariant().color).toBe('');
  });
  it('retains social success, partial failure and expired-token guidance', () => {
    expect(formatSocialPublishMessage([{ target: 'facebook', success: true }], 'en')).toContain('published to facebook');
    expect(formatSocialPublishMessage([{ target: 'facebook', success: true }, { target: 'instagram', success: false, error: 'Failure' }], 'en')).toContain('Failed: instagram: Failure');
    expect(formatSocialPublishMessage([{ target: 'facebook', success: false, error: 'Error validating access token: Session has expired' }], 'en')).toContain('expired');
  });
});
