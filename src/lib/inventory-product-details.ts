import { normalizeStorageValue, readProductStorage } from '@/lib/product-storage';
import type { ProductSpec, ProductVariant } from '@/lib/products';

const object = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
const text = (value: unknown): string => typeof value === 'string' ? value.trim() : '';
const localized = (value: unknown, fallback: unknown, locale: 'de' | 'en'): string => {
  const translations = object(value);
  return text(translations[locale]) || text(fallback) || text(translations.de) || text(translations.en);
};
const storageLabel = (value: string): string => normalizeStorageValue(value)?.label
  ?? (/^\d+$/.test(value) ? `${value}GB` : value);

/** Inventory variants describe the row's SKU, even when its quantity is zero. */
export const inventoryProductDetails = (row: Record<string, unknown>, locale: 'de' | 'en', scope: 'sku' | 'product' = 'sku'): { color: string | null; storage: string | null } => {
  const variants: ProductVariant[] = (Array.isArray(row.variants) ? row.variants : []).map(value => {
    const variant = object(value);
    return {
      sku: text(variant.sku),
      color: localized(variant.colorI18n ?? variant.color_i18n, variant.color, locale),
      storage: storageLabel(localized(variant.storageI18n ?? variant.storage_i18n, variant.storage, locale)),
    };
  });
  const matched = variants.filter(variant => variant.sku && variant.sku === text(row.sku));
  // A single variant is unambiguous; parent rows can summarize all their variants.
  const selected = scope === 'product' ? variants : matched.length ? matched : variants.length === 1 || !row.can_adjust || row.sku === row.product_sku ? variants : [];
  const specs: ProductSpec[] = (Array.isArray(row.specs) ? row.specs : []).flatMap(value => {
    const spec = object(value);
    return text(spec.label) && text(spec.value) ? [{ label: text(spec.label), value: text(spec.value) }] : [];
  });
  const evidence = object(object(row.import_metadata).evidence);
  const colors = [...new Set(selected.map(variant => variant.color).filter(Boolean))];
  const capacities = [...new Set(selected.map(variant => variant.storage).filter(Boolean))];
  const unrelatedVariant = variants.length > 1 && !selected.length;
  const category = row.category === 'smartphones' || row.category === 'tablets' || row.category === 'laptops' ? row.category : 'accessories';
  const color = colors.join(' / ') || (!unrelatedVariant ? specs.find(spec => /^(farbe|color|colour)$/i.test(spec.label))?.value || text(evidence.color) : '');
  const storage = capacities.join(' / ') || (!unrelatedVariant ? storageLabel(text(evidence.storage)) || readProductStorage({
    category, title: text(row.title), model: text(row.model), specs, variants: [], stock: 0,
  }).values.join(' / ') : '');
  return { color: color || null, storage: storage || null };
};
