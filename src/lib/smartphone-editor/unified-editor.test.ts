import { describe, expect, it } from 'vitest';
import { newPhoneDocument, newPhoneEntry, entryImages, entryPayload, entryProblems, validateDocument } from './model';
import { setEntryPhotos, changeEntryColor } from './photos';
import { applyEditorResearch } from './research';

describe('unified product editing', () => {
  it('shares a color gallery across storage sizes while keeping commercial facts independent', () => {
    const d = newPhoneDocument();
    Object.assign(d.entries[0], { color: 'Black', storage: '128 GB', price: 399, stock: 3 });
    const two = { ...newPhoneEntry(d.entries[0]), storage: '256 GB', price: 499, stock: 8 };
    const white = { ...newPhoneEntry(), color: 'White', storage: '128 GB' };
    d.entries.push(two, white);
    const photos = d.entries[0].photos.map((p, i) => ({ ...p, url: i === 0 ? '/uploads/front.webp' : '' }));
    const result = setEntryPhotos(d, d.entries[0].id, photos, photos[0].id);
    expect(entryImages(result.entries[1])).toEqual(['/uploads/front.webp']);
    expect(result.entries[1]).toMatchObject({ price: 499, stock: 8, storage: '256 GB' });
    expect(entryImages(result.entries[2])).toEqual([]);
    expect(entryImages(newPhoneEntry(result.entries[0]))).toEqual(['/uploads/front.webp']);
    expect(new Set(result.entries.flatMap(e => e.photos.map(p => p.id))).size).toBe(12);
  });
  it('joins the destination color gallery and supports individual overrides and used photos', () => {
    const d = newPhoneDocument();
    Object.assign(d.entries[0], { color: 'Black' });
    d.entries[0].photos[0].url = '/uploads/black.webp';
    const white = { ...newPhoneEntry(), color: 'White' };
    white.photos[0].url = '/uploads/white.webp';
    const own = { ...newPhoneEntry(), color: 'White', individualPhotos: true };
    own.photos[0].url = '/uploads/own.webp';
    const used = { ...newPhoneEntry(), color: 'White', condition: 'used' as const, hasRealProductPhotos: true };
    used.photos[0].url = '/uploads/used.webp';
    d.entries.push(white, own, used);
    const moved = changeEntryColor(d, d.entries[0].id, 'white');
    expect(entryImages(moved.entries[0])).toEqual(['/uploads/white.webp']);
    const updated = setEntryPhotos(moved, white.id, white.photos.map((p, i) => ({ ...p, url: i ? '' : '/uploads/updated.webp' })), white.coverId);
    expect(entryImages(updated.entries[0])).toEqual(['/uploads/updated.webp']);
    expect(entryImages(updated.entries[2])).toEqual(['/uploads/own.webp']);
    expect(entryImages(updated.entries[3])).toEqual(['/uploads/used.webp']);
    expect(setEntryPhotos(updated, used.id, used.photos, used.coverId).entries[3].hasRealProductPhotos).toBe(true);
  });
  it('maps research into all supported pages without fabricating quantity or device condition', () => {
    const d = newPhoneDocument();
    d.pendingShared = { subtitle: 'An unsaved edit', energyLabel: { ficheEn: '/uploads/fiche.pdf' } };
    Object.assign(d.entries[0], { stock: 7, price: 480, condition: 'used', defects: 'Frame scratch', batteryHealth: 91 });
    const result = applyEditorResearch(d, { title: 'iPhone 14 Pro Max', subtitle: 'Researched subtitle', category: 'smartphones', countryOfOrigin: 'CN', features: ['OLED'], energyLabel: { efficiencyClass: 'B' }, variantSuggestions: [{ color: 'Black', storage: '256 GB' }], dimensions: { heightMm: 160.7 }, packageContents: [{ label: { de: 'Kabel', en: 'Cable' }, included: true }], refurbishmentSteps: [{ title: { de: 'Prüfung', en: 'Testing' }, description: { de: 'Prüfen', en: 'Check' } }], campaignSuggestion: { badge: { de: 'Angebot', en: 'Offer' }, message: { de: 'Details', en: 'Details' } }, gtinSuggestion: '123', mpnSuggestion: 'MPN' });
    expect(result.pendingShared).toMatchObject({ subtitle: 'Researched subtitle', countryOfOrigin: 'CN', featureBullets: ['OLED'], energyLabel: { efficiencyClass: 'B', ficheEn: '/uploads/fiche.pdf' } });
    expect(result.variantSuggestions).toHaveLength(1);
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0]).toMatchObject({ stock: 7, price: 480, condition: 'used', defects: 'Frame scratch', batteryHealth: 91, experience: { dimensions: { heightMm: 160.7 }, campaign: { badge: { en: 'Offer' } } } });
    expect(result.entries[0].details.gtin).toBeUndefined();
    expect(result.entries[0].details.mpn).toBeUndefined();
  });
  it('supports accessories without artificial storage requirements and more than four photos', () => {
    const d = newPhoneDocument();
    d.shared = { category: 'accessories', title: 'USB cable', description: 'USB cable' };
    d.entries[0].price = 12;
    d.entries[0].photos[0].url = '/uploads/cable.webp';
    d.entries[0].photos.push({ id: crypto.randomUUID(), url: '/uploads/cable-detail.webp' });
    expect(validateDocument(d)).toEqual(d);
    expect(entryProblems(d, d.entries[0])).toEqual([]);
    expect(entryPayload(d, d.entries[0]).category).toBe('accessories');
  });
});
