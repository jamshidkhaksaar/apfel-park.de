import { describe, expect, it } from 'vitest';
import { compareCatalogRecency } from './catalog-recency';
describe('catalog recency', () => {
  it('orders Date objects and ISO strings by time rather than weekday', () => {
    const newer = new Date('2026-09-21T12:00:00Z');
    const older = new Date('2026-09-17T12:00:00Z');
    expect(compareCatalogRecency(newer,older)).toBeLessThan(0);
    expect(compareCatalogRecency(newer.toISOString(),older.toISOString())).toBeLessThan(0);
    expect(compareCatalogRecency(undefined,newer)).toBeGreaterThan(0);
    expect(compareCatalogRecency('bad',null)).toBe(0);
  });
});
