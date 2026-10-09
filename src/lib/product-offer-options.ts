import { sanitizeInput } from './security';
import type { LocalizedText, PackageContentItem } from './product-experience';

export const offerIcons = ['charger', 'usb', 'screen-protector', 'case', 'box', 'headphones', 'gift'] as const;
export type OfferIcon = (typeof offerIcons)[number];
export type BatteryHealthRange = { min: number; max: number };
export type ConditionNotePreset = { id: string; label: LocalizedText; condition: 'new' | 'open_box' | 'used'; text: LocalizedText };
export type GiftPreset = { id: string; label: LocalizedText; icon: OfferIcon };
export type OfferPresets = { revision: number; conditionNotes: ConditionNotePreset[]; gifts: GiftPreset[]; defaults: Partial<Record<'new' | 'open_box' | 'used', string>> };

export const validBatteryHealthRange = (value: unknown): value is BatteryHealthRange => {
  if (!value || typeof value !== 'object') return false;
  const { min, max } = value as BatteryHealthRange;
  return Number.isInteger(min) && Number.isInteger(max) && min >= 1 && max <= 100 && min <= max;
};
export const readBatteryHealthRange = (metadata: unknown, exact?: number | null): BatteryHealthRange | undefined => {
  if (exact != null || !metadata || typeof metadata !== 'object') return undefined;
  const range = (metadata as Record<string, unknown>).batteryHealthRange;
  return validBatteryHealthRange(range) ? range : undefined;
};
export const formatBatteryHealth = (exact?: number | null, range?: BatteryHealthRange): string | undefined =>
  validBatteryHealthRange(range) ? `${range.min}${range.min === range.max ? '' : `–${range.max}`}%` : exact == null ? undefined : `${exact}%`;
export const inferOfferIcon = (label: string): OfferIcon => {
  if (/ladegerät|ladegeraet|netzteil|adapter|charger/i.test(label)) return 'charger';
  if (/schutz.*(?:glas|display)|displayschutz|panzerglas|screen|protector/i.test(label)) return 'screen-protector';
  if (/hülle|hulle|h(ü|u)lle|case|cover/i.test(label)) return 'case';
  if (/usb|kabel|cable/i.test(label)) return 'usb';
  if (/kopfhörer|headphone|earpod|earbud/i.test(label)) return 'headphones';
  if (/verpackung|box|packaging/i.test(label)) return 'box';
  return 'gift';
};
export const packageItemIcon = (item: PackageContentItem): OfferIcon => item.icon ?? inferOfferIcon(`${item.label.de} ${item.label.en}`);

export const defaultOfferPresets = (): OfferPresets => ({
  revision: 0,
  defaults: { new: 'new-sealed', open_box: 'opened-box', used: 'grade-aplus' },
  conditionNotes: [
    { id: 'new-sealed', condition: 'new', label: { de: 'Neu & versiegelt', en: 'New & sealed' }, text: { de: 'Neu, originalverpackt und versiegelt.', en: 'New, in its original packaging and factory sealed.' } },
    { id: 'opened-box', condition: 'open_box', label: { de: 'Geöffnete Verpackung', en: 'Opened packaging' }, text: { de: 'Neu und unbenutzt. Die Originalverpackung wurde geöffnet; daher wird das Gerät als Open-Box angeboten.', en: 'New and unused. The original packaging has been opened, so the device is offered as Open-Box.' } },
    { id: 'grade-aplus', condition: 'used', label: { de: 'A+ – nahezu neuwertig', en: 'A+ – nearly new' }, text: { de: 'Zustand A+ (Wie neu): Optisch nahezu neuwertig, keine oder minimale Gebrauchsspuren. Technisch einwandfrei und vollständig geprüft.', en: 'A+ condition (like new): Nearly new appearance with no or minimal signs of wear. Fully functional and thoroughly checked.' } },
  ],
  gifts: [
    { id: 'charger', icon: 'charger', label: { de: 'Ladegerät', en: 'Charger' } },
    { id: 'protector', icon: 'screen-protector', label: { de: 'Displayschutz', en: 'Screen protector' } },
    { id: 'case', icon: 'case', label: { de: 'Schutzhülle', en: 'Protective case' } },
    { id: 'usb-cable', icon: 'usb', label: { de: 'USB-Ladekabel', en: 'USB charging cable' } },
  ],
});

const localized = (value: unknown, max: number): LocalizedText => {
  const source = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  return { de: sanitizeInput(typeof source.de === 'string' ? source.de : '').slice(0, max), en: sanitizeInput(typeof source.en === 'string' ? source.en : '').slice(0, max) };
};
export const sanitizeOfferPresets = (value: unknown): OfferPresets => {
  if (!value || typeof value !== 'object') throw new Error('invalid_presets');
  const source = value as OfferPresets;
  if (!Number.isInteger(source.revision) || source.revision < 0 || !Array.isArray(source.conditionNotes) || !Array.isArray(source.gifts) || source.conditionNotes.length > 60 || source.gifts.length > 60) throw new Error('invalid_presets');
  if ([...source.conditionNotes, ...source.gifts].some(row => !row || typeof row !== 'object' || Array.isArray(row))) throw new Error('invalid_presets');
  const id = (value: unknown) => typeof value === 'string' && /^[a-z0-9-]{1,80}$/i.test(value) ? value : '';
  const conditionNotes = source.conditionNotes.map(row => ({ id: id(row.id), condition: row.condition, label: localized(row.label, 120), text: localized(row.text, 1000) }));
  const gifts = source.gifts.map(row => ({ id: id(row.id), label: localized(row.label, 120), icon: row.icon }));
  if (conditionNotes.some(row => !row.id || !['new', 'used', 'open_box'].includes(row.condition) || (!row.label.de && !row.label.en) || (!row.text.de && !row.text.en)) || gifts.some(row => !row.id || (!row.label.de && !row.label.en) || !offerIcons.includes(row.icon)) || new Set(conditionNotes.map(row => row.id)).size !== conditionNotes.length || new Set(gifts.map(row => row.id)).size !== gifts.length) throw new Error('invalid_presets');
  const defaults: OfferPresets['defaults'] = {};
  for (const condition of ['new', 'open_box', 'used'] as const) {
    const match = conditionNotes.find(row => row.id === source.defaults?.[condition] && row.condition === condition);
    if (match) defaults[condition] = match.id;
  }
  return { revision: source.revision, conditionNotes, gifts, defaults };
};
