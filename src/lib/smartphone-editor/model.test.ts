import { describe, expect, it } from 'vitest';
import {
  newPhoneDocument,
  newPhoneEntry,
  copyNewPhonePhotos,
  entryImages,
  entryPayload,
  entryProblems,
  entryReadiness,
  validateDocument,
} from './model';

describe('smartphone workspace rules', () => {
  it('inherits AI origin only from the field source actually used by an entry', () => {
    const document = newPhoneDocument();
    document.shared = { title: 'AI shared title', description: 'AI shared description', aiGeneratedFields: ['title', 'description'] };
    const entry = document.entries[0];
    expect(entryPayload(document, entry).aiGeneratedFields).toEqual(['title', 'description']);
    entry.details = { title: 'Manual entry-specific title' };
    expect(entryPayload(document, entry).aiGeneratedFields).toEqual(['description']);
    entry.details = { title: 'Edited AI entry title', aiGeneratedFields: ['title'] };
    expect(entryPayload(document, entry).aiGeneratedFields).toEqual(['title', 'description']);
    entry.details = { title: 'Manual title', description: 'Manual description' };
    expect(entryPayload(document, entry).aiGeneratedFields).toEqual([]);
  });
  it('duplicates configuration but never identity, device evidence, or photos', () => {
    const source = newPhoneEntry();
    Object.assign(source, {
      condition: 'used',
      color: 'Black',
      storage: '256 GB',
      batteryHealth: 96,
      conditionNote: 'Scratched',
      defects: 'Frame',
      accessories: 'Cable',
      hasRealProductPhotos: true,
    });
    source.photos.forEach((photo, i) => (photo.url = `/uploads/${i}.webp`));
    const copy = newPhoneEntry(source);
    expect(copy.color).toBe(source.color);
    expect(copy.storage).toBe(source.storage);
    expect(copy.id).not.toBe(source.id);
    expect(copy.sku).not.toBe(source.sku);
    expect(copy.stock).toBe(1);
    expect(copy.batteryHealth).toBeNull();
    expect(copy.conditionNote).toBe('');
    expect(copy.defects).toBe('');
    expect(copy.accessories).toBe('');
    expect(copy.hasRealProductPhotos).toBe(false);
    expect(entryImages(copy)).toEqual([]);
  });
  it('copies only new same-color photos while retaining destination slot identity', () => {
    const a = newPhoneEntry();
    a.color = 'Black';
    a.photos.forEach((photo, i) => (photo.url = `/uploads/${i}.webp`));
    const b = newPhoneEntry(a);
    const copied = copyNewPhonePhotos(a, b);
    expect(copied.photos.map((p) => p.id)).toEqual(b.photos.map((p) => p.id));
    expect(entryImages(copied)).toEqual(entryImages(a));
    expect(() => copyNewPhonePhotos(a, { ...b, color: 'White' })).toThrow();
    expect(() => copyNewPhonePhotos(a, { ...b, condition: 'used' })).toThrow();
  });
  it('moves the chosen cover to the front without changing slots or dropping replacements', () => {
    const e = newPhoneEntry();
    e.photos.forEach((photo, i) => (photo.url = `/uploads/${i}.webp`));
    e.photos[1].url = '/uploads/replacement.webp';
    e.coverId = e.photos[1].id;
    expect(entryImages(e)).toEqual([
      '/uploads/replacement.webp',
      '/uploads/0.webp',
      '/uploads/2.webp',
      '/uploads/3.webp',
    ]);
    expect(e.photos[0].url).toBe('/uploads/0.webp');
  });
  it('allows an incomplete draft but requires four distinct photos before publication', () => {
    const d = newPhoneDocument();
    expect(validateDocument(d)).toEqual(d);
    expect(
      entryProblems(d, d.entries[0]).some((p) => p.field === 'photos'),
    ).toBe(true);
    d.entries[0].photos.forEach((p) => (p.url = '/uploads/same.webp'));
    expect(
      entryProblems(d, d.entries[0]).some((p) => p.field === 'photos'),
    ).toBe(true);
  });
  it('keeps website readiness independent of Google and marketplace information', () => {
    const d = newPhoneDocument();
    d.shared = {
      title: 'iPhone',
      brand: 'Apple',
      model: 'iPhone',
      description: 'Tested device',
      category: 'smartphones',
    };
    const e = d.entries[0];
    e.price = 400;
    e.color = 'Black';
    e.storage = '128 GB';
    e.photos.forEach((p, i) => (p.url = `/uploads/${i}.webp`));
    expect(entryReadiness(d, e).store.ready).toBe(true);
    expect(entryReadiness(d, e).google.ready).toBe(false);
    expect(entryReadiness(d, e).amazon.ready).toBe(false);
  });
  it('rejects duplicate entry/slot IDs and invalid numeric facts', () => {
    const d = newPhoneDocument();
    d.entries.push(d.entries[0]);
    expect(() => validateDocument(d)).toThrow();
    d.entries.pop();
    d.entries[0].price = Infinity;
    expect(() => validateDocument(d)).toThrow();
  });
});
