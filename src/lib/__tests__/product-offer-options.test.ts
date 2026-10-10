import { describe, expect, it } from 'vitest';
import { defaultOfferPresets, formatBatteryHealth, readBatteryHealthRange, sanitizeOfferPresets, validBatteryHealthRange } from '../product-offer-options';
import { sanitizeProductExperienceProfile } from '../product-experience';
import { entryPayload, entryProblems, newPhoneDocument } from '../smartphone-editor/model';
import { validateAdminProductCondition } from '../admin-product-validation';
import { buildPayload, getMessages, validatePayload } from '../product-write-payload';

describe('offer notes, gifts and battery ranges', () => {
  it('saves a range without claiming an exact measured battery value', () => {
    const doc = newPhoneDocument();
    doc.shared = { title: 'iPhone 14 Pro Max', brand: 'Apple', model: 'iPhone 14 Pro Max', category: 'smartphones', description: 'A+ iPhone.' };
    Object.assign(doc.entries[0], { condition: 'used', color: 'Black', storage: '128 GB', price: 499, conditionNote: 'A+ condition.', batteryHealth: 95, batteryHealthMax: 100, hasRealProductPhotos: true });
    doc.entries[0].photos[0].url = '/uploads/product.webp';
    expect(entryProblems(doc, doc.entries[0])).toEqual([]);
    const payload = entryPayload(doc, doc.entries[0]);
    expect(payload).toMatchObject({ batteryHealth: null, batteryHealthRange: { min: 95, max: 100 } });
    expect(validatePayload(buildPayload(payload), getMessages(true))).toBeNull();
    expect(formatBatteryHealth(undefined, readBatteryHealthRange({ batteryHealthRange: { min: 95, max: 100 } }))).toBe('95–100%');
    expect(readBatteryHealthRange({ batteryHealthRange: { min: 95, max: 100 } }, 98)).toBeUndefined();
  });
  it.each([{ min: 100, max: 95 }, { min: 0, max: 100 }, { min: 95, max: 101 }, { min: 95.5, max: 100 }, { min: null, max: 100 }])('rejects invalid battery range %j', range => {
    expect(validBatteryHealthRange(range)).toBe(false);
  });
  it('rejects incomplete or invalid ranges even for new offers', () => {
    for (const batteryHealth of ['', '0', '95.5', '101']) {
      expect(validateAdminProductCondition({ condition: 'new', conditionNote: '', hasRealProductPhotos: false, imageCount: 0, batteryHealth, batteryHealthMax: '100', title: 'Phone', brand: 'Apple', model: 'Phone', locale: 'en' })).toMatch(/whole/);
    }
  });
  it('keeps controlled gift icons and snapshot names across profile sanitation', () => {
    const profile = sanitizeProductExperienceProfile({ packageContents: [{ label: { de: 'Hülle', en: 'Case' }, included: true, isGift: true, icon: 'case', presetId: 'case' }, { label: { de: 'Artikel', en: 'Item' }, icon: '<svg onload=alert(1)>' }] });
    expect(profile.packageContents[0]).toMatchObject({ icon: 'case', isGift: true, presetId: 'case' });
    expect(profile.packageContents[1].icon).toBeUndefined();
  });
  it('permits editable defaults while rejecting duplicate IDs and malformed presets', () => {
    const presets = defaultOfferPresets();
    presets.conditionNotes[2].text.en = 'Our A+ condition note';
    presets.gifts.push({ id: 'custom', icon: 'gift', label: { de: 'Geschenk', en: 'Custom gift' } });
    expect(sanitizeOfferPresets(presets)).toEqual(presets);
    expect(() => sanitizeOfferPresets({ ...presets, gifts: [...presets.gifts, presets.gifts[0]] })).toThrow('invalid_presets');
    expect(() => sanitizeOfferPresets({ ...presets, gifts: [null] })).toThrow('invalid_presets');
  });
});
