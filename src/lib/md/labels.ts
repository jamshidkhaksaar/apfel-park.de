/** Price, condition and availability wording shared by the markdown renderers. */

import type { Product } from '@/lib/products';

import type { MarkdownLocale } from './routes';

export const formatPrice = (locale: MarkdownLocale, value: number): string =>
  new Intl.NumberFormat(locale === 'de' ? 'de-DE' : 'en-US', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);

export const conditionLabel = (locale: MarkdownLocale, condition: Product['condition']): string => {
  if (locale === 'de') {
    return condition === 'new' ? 'Neu' : condition === 'open_box' ? 'Open Box' : 'Gebraucht';
  }
  return condition === 'new' ? 'New' : condition === 'open_box' ? 'Open box' : 'Used';
};

export const availabilityLabel = (locale: MarkdownLocale, product: Product): string => {
  const stock = product.stock ?? 0;
  const pickup = product.pickupStock ?? 0;
  if (locale === 'de') {
    if (stock > 0) return 'online verfügbar';
    if (pickup > 0) return 'im Laden verfügbar (Abholung)';
    return 'derzeit nicht verfügbar';
  }
  if (stock > 0) return 'available online';
  if (pickup > 0) return 'available for pickup';
  return 'currently unavailable';
};
