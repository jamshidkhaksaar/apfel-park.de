import type { Locale } from '@/lib/i18n';

export type LabelItem = {
  category?: string | null;
  condition?: string | null;
  color?: string | null;
  storage?: string | null;
  priceCents?: number | null;
};

export type LabelDetails = {
  device: boolean;
  variant: string;
  condition: string;
  priceCents: number | null;
};

/** Only phones and tablets carry a meaningful colour/storage variant on a label. */
const deviceCategories = new Set(['smartphones', 'tablets']);

export const isDeviceCategory = (category?: string | null): boolean =>
  deviceCategories.has((category ?? '').trim().toLowerCase());

export const labelCondition = (condition: string | null | undefined, locale: Locale): string => {
  const value = (condition ?? '').trim().toLowerCase();
  if (['new', 'sealed', 'new_sealed'].includes(value)) return locale === 'de' ? 'Neu & versiegelt' : 'New & sealed';
  if (['open_box', 'open-box', 'unboxed', 'openbox'].includes(value)) return 'Open Box';
  if (value.startsWith('used')) return 'A+';
  return value ? (condition ?? '').trim() : '';
};

export const formatLabelPrice = (cents: number | null, locale: Locale): string =>
  cents === null
    ? ''
    : new Intl.NumberFormat(locale === 'de' ? 'de-DE' : 'en-GB', {
        style: 'currency',
        currency: 'EUR',
      }).format(cents / 100);

export const labelDetails = (item: LabelItem, locale: Locale): LabelDetails => {
  const device = isDeviceCategory(item.category);
  const price = item.priceCents;
  return {
    device,
    // Accessories only need the price: storage and colour are device attributes.
    variant: device
      ? [item.color, item.storage].map((value) => (value ?? '').trim()).filter(Boolean).join(' · ')
      : '',
    condition: device ? labelCondition(item.condition, locale) : '',
    priceCents: typeof price === 'number' && Number.isSafeInteger(price) && price >= 0 ? price : null,
  };
};
