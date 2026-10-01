import { describe, expect, it } from 'vitest';

import { mapGermanAddress, type GoogleAddressComponent } from '../google-places-address';

const fixture: GoogleAddressComponent[] = [
  { longText: '  Mönckebergstraße  ', types: ['political', 'route'] },
  { longText: '  7  a ', types: ['street_number'] },
  { longText: '20095', types: ['postal_code'] },
  { longText: ' Hamburg ', types: ['political', 'locality'] },
  { longText: 'Deutschland', shortText: 'DE', types: ['political', 'country'] },
];

describe('German Places address mapper', () => {
  it('maps current camelCase components, shuffled types and German street ordering', () => {
    expect(mapGermanAddress([...fixture].reverse())).toEqual({
      line1: 'Mönckebergstraße 7 a', postalCode: '20095', city: 'Hamburg',
    });
  });
  it.each(['street_number', 'postal_code', 'route', 'locality', 'country'])('rejects missing %s without partial updates', (type) => {
    expect(mapGermanAddress(fixture.filter((part) => !part.types.includes(type)))).toBeNull();
  });
  it.each(['AT', 'US'])('rejects foreign country %s', (country) => {
    expect(mapGermanAddress(fixture.map((part) => part.types.includes('country') ? { ...part, shortText: country } : part))).toBeNull();
  });
  it.each(['2009', '200951', '20 095', 'abcde'])('rejects invalid postcode %s', (postalCode) => {
    expect(mapGermanAddress(fixture.map((part) => part.types.includes('postal_code') ? { ...part, longText: postalCode } : part))).toBeNull();
  });
  it.each(['postal_town', 'administrative_area_level_3'])('falls back to %s', (type) => {
    expect(mapGermanAddress(fixture.map((part) => part.types.includes('locality') ? { ...part, types: ['political', type] } : part))?.city).toBe('Hamburg');
  });
});
