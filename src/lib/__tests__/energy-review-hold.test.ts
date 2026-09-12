import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ProductTipsCard from '../../components/admin/ProductTipsCard';
import ProductTipsBadge from '../../components/admin/ProductTipsBadge';
import { requiresEnergyEvidenceReview } from '../product-evidence-hold';
import { evaluateProductChannelReadiness } from '../product-channel-readiness';
import { productMissingData } from '../product-missing-data';
import { eligibleGoogleFeedProducts } from '../google-feed-eligibility';
import type { Product } from '../products';

const valid = { title: 'Test accessory', description: 'A product description.', category: 'accessories', condition: 'new', brand: 'Acme', price: 20, stock: 1, sku: 'TEST-1', mpn: 'M123', identifierStatus: 'assigned' as const, images: ['/test.webp'] };

describe('energy evidence hold', () => {
  it.each(['de', 'en'] as const)('renders the hold notice in %s without an AI clearance action', locale => {
    const all = productMissingData({ ...valid, energyReviewRequired: true });
    const tips = { ...all, items: all.items.filter(item => item.code === 'energy_review') };
    const card = renderToStaticMarkup(createElement(ProductTipsCard, { tips, locale }));
    const badge = renderToStaticMarkup(createElement(ProductTipsBadge, { tips, locale }));
    expect(card).toContain(locale === 'de' ? 'Google-Veröffentlichung pausiert' : 'Google publication is on hold');
    expect(badge).toContain(locale === 'de' ? 'Google pausiert' : 'Google on hold');
    expect(badge).toContain('aria-expanded="false"');
    expect(card).not.toContain('<button');
  });
  it('projects only the explicit pending-review status', () => {
    expect(requiresEnergyEvidenceReview({ energyEvidenceReview: { status: 'needs_supplier_confirmation', privateNote: 'not exposed' } })).toBe(true);
    for (const value of [undefined, null, [], {}, { energyEvidenceReview: { status: 'resolved' } }]) expect(requiresEnergyEvidenceReview(value)).toBe(false);
  });
  it('blocks Google even when other facts and the selection checkbox are valid', () => {
    expect(evaluateProductChannelReadiness(valid).google.ready).toBe(true);
    const result = evaluateProductChannelReadiness({ ...valid, energyReviewRequired: true });
    expect(result.google.ready).toBe(false);
    expect(result.store.ready).toBe(true);
  });
  it('keeps held records out of online/local feed eligibility', () => {
    const ordinary = { ...valid, googleFeedEnabled: true } as Product;
    const held = { ...ordinary, energyReviewRequired: true };
    expect(eligibleGoogleFeedProducts([ordinary, held])).toEqual([ordinary]);
    expect(() => eligibleGoogleFeedProducts([held])).toThrow('all selected products failed readiness');
  });
  it('provides a bilingual manual-only action rather than AI reactivation', () => {
    const tips = productMissingData({ ...valid, energyReviewRequired: true });
    const hold = tips.items.find(item => item.code === 'energy_review');
    expect(hold?.messageDe).toContain('Google-Veröffentlichung pausiert');
    expect(hold?.message).toContain('ordinary save does not clear');
    expect(hold?.aiFillable).toBe(false);
    expect(tips.items.filter(item => item.message.includes('Energy-label evidence requires review'))).toHaveLength(0);
  });
});
