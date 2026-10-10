import { cache } from 'react';
import { query } from './db';
import type { Product } from './products';
import { normalizeStorageValue } from './product-storage';

export type CatalogFamily = { id: string; name: string; color?: string; storage?: string };
export type StoreFamily = { offerCount: number; stock: number; pickupStock: number; colors: string[]; storages: string[]; productIds: string[]; priceVaries: boolean; newest?: string };

// Automatic model families are mandatory purchase choices, independent of
// optional presentation-section switches. Manual comparison families stay separate.
export const getStoreFamilyMemberships = cache(async (): Promise<Map<string, CatalogFamily>> => {
  const rows = (await query(`SELECT m.product_id,f.id AS family_id,f.name,m.option_values
    FROM product_family_members m JOIN product_families f ON f.id=m.family_id
    WHERE m.is_active=true AND f.is_active=true AND f.smartphone_model_key IS NOT NULL`)).rows;
  return new Map(rows.filter(row => typeof row.product_id === 'string' && typeof row.family_id === 'string').map(row => [row.product_id, {
    id: row.family_id, name: String(row.name), color: typeof row.option_values?.color === 'string' ? row.option_values.color : undefined, storage: typeof row.option_values?.storage === 'string' ? row.option_values.storage.replace(/^(\d+)$/, '$1 GB') : undefined,
  }]));
});

export const catalogProductKey = (product: Product): string => product.catalogFamily
  ? `${product.category}:family:${product.catalogFamily.id}` : `product:${product.id}`;

/** Call after filtering individual offers, before sorting/pagination. Never
 * rewrite a purchasable offer's stock, price, variants or product ID. */
export const groupStoreProducts = (products: readonly Product[]): Product[] => {
  const groups = new Map<string, Product[]>();
  for (const product of products) {
    const key = catalogProductKey(product);
    const group = groups.get(key) ?? []; group.push(product); groups.set(key, group);
  }
  return [...groups.values()].map(group => {
    if (!group[0].catalogFamily) return group[0];
    const available = group.filter(product => (product.stock ?? 0) > 0);
    const representative = [...(available.length ? available : group)].sort((a,b) => a.price-b.price || a.id.localeCompare(b.id))[0];
    const unique = (values: Array<string | undefined>) => [...new Set(values.filter((value): value is string => Boolean(value?.trim())))];
    return { ...representative, title: representative.catalogFamily!.name, storeFamily: {
      offerCount: group.length, stock: group.reduce((sum,p) => sum+Math.max(0,p.stock ?? 0),0), pickupStock: group.reduce((sum,p) => sum+Math.max(0,p.pickupStock ?? 0),0),
      colors: unique(group.map(p => p.catalogFamily?.color)),
      storages: unique(group.map(p => normalizeStorageValue(p.catalogFamily?.storage ?? '')?.label)).sort((a,b) => normalizeStorageValue(a)!.gb-normalizeStorageValue(b)!.gb),
      productIds: group.map(p => p.id), priceVaries: (available.length ? available : group).some(p => p.price !== representative.price),
      newest: group.map(p => p.createdAt).filter((value): value is string => Boolean(value)).sort().at(-1),
    } };
  });
};
