import { describe, expect, it } from 'vitest';

import { isValidGtin, normalizeGtin, validatedGtin } from '../product-identifiers';

describe('product identifiers', () => {
  it.each([
    ['4006381333931', '4006381333931'],
    ['96385074', '96385074'],
    ['0 12345 67890 5', '012345678905'],
    ['1-234567-890128', '1234567890128'],
  ])('normalizes a valid barcode %s', (value, normalized) => {
    expect(normalizeGtin(value)).toBe(normalized);
    expect(validatedGtin(value)).toBe(normalized);
  });

  it.each(['4006381333932', '12345678', '1234', 'ABC4006381333931', ''])('rejects %s', (value) => {
    expect(isValidGtin(value)).toBe(false);
    expect(validatedGtin(value)).toBeNull();
  });
});
