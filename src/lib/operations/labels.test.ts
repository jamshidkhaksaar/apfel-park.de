import { describe, expect, it } from 'vitest';
import { formatLabelPrice, labelCondition, labelDetails } from './labels';

describe('operations labels', () => {
  it('shows colour, storage, condition and price for phones and tablets', () => {
    const details = labelDetails(
      { category: 'smartphones', color: 'Schwarz', storage: '256GB', condition: 'used', priceCents: 89900 },
      'de',
    );
    expect(details).toEqual({ device: true, variant: 'Schwarz · 256GB', condition: 'A+', priceCents: 89900 });
  });

  it('shows only the price for accessories', () => {
    const details = labelDetails(
      { category: 'accessories', color: 'Weiß', storage: '5000mAh', condition: 'new', priceCents: 2999 },
      'de',
    );
    expect(details.device).toBe(false);
    expect(details.variant).toBe('');
    expect(details.condition).toBe('');
    expect(formatLabelPrice(details.priceCents, 'de')).toContain('29,99');
  });

  it('keeps sealed and open-box conditions distinguishable', () => {
    expect(labelCondition('new', 'de')).toBe('Neu & versiegelt');
    expect(labelCondition('open_box', 'de')).toBe('Open Box');
    expect(labelCondition('used', 'en')).toBe('A+');
  });

  it('rejects malformed prices instead of printing NaN', () => {
    expect(labelDetails({ category: 'smartphones', priceCents: Number.NaN }, 'en').priceCents).toBeNull();
    expect(formatLabelPrice(null, 'en')).toBe('');
  });
});
