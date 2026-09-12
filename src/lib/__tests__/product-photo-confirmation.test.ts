import { describe, expect, it } from 'vitest';
import { photoMembershipChanged } from '../product-photo-confirmation';

describe('photo confirmation membership', () => {
  it.each([
    { before: ['a', 'b'], after: ['b', 'a'], changed: false },
    { before: ['a'], after: ['a', 'b'], changed: true },
    { before: ['a', 'b'], after: ['a'], changed: true },
    { before: ['a'], after: ['b'], changed: true },
    { before: ['', 'a'], after: ['a', ''], changed: false },
    { before: [], after: ['a'], changed: true },
  ])('$before → $after', ({ before, after, changed }) => {
    const previous = [...before];
    expect(photoMembershipChanged(before, after)).toBe(changed);
    expect(before).toEqual(previous);
  });
});
