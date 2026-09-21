import { describe, expect, it } from 'vitest';
import { photoReuseError } from './photo-reuse';
const offer = { brand: 'Apple', model: 'iPhone 12', color: 'Schwarz', condition: 'used' };
describe('photo reuse confirmation', () => {
  it('requires explicit confirmation for shared used photos', () => {
    expect(photoReuseError(offer, offer, false)).toBe('shared_photos_confirmation_required');
    expect(photoReuseError(offer, offer, true)).toBeNull();
  });
  it('never permits another color or model through confirmation', () => {
    for (const previous of [{...offer,color:'Weiß'}, {...offer,model:'iPhone 13'}, {...offer,brand:''}])
      expect(photoReuseError(offer, previous, true)).toBe('device_photo_reused');
  });
  it('allows existing new-device same-color sharing and normalizes text', () => {
    expect(photoReuseError({...offer,condition:'new'}, {...offer,condition:'new'}, false)).toBeNull();
    expect(photoReuseError(offer, {...offer,brand:' apple ',color:'schwarz'}, true)).toBeNull();
  });
});
