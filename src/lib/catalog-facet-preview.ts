import type { Locale } from './i18n';
import type { StoreCatalogCategory, StoreCatalogCollection, StoreCatalogFacets, StoreCatalogScope } from './products';

export type CatalogFacetPreview = { facets: StoreCatalogFacets; total: number };
const filterKeys = ['q','brand','storage','condition','atype','stock','pmin','pmax'] as const;

export const buildFacetPreviewUrl = (lang: Locale, scope: StoreCatalogScope, params: URLSearchParams): string => {
  const query = new URLSearchParams({lang,scopeCategory:scope.category});
  if (scope.subcategory) query.set('scopeSubcategory',scope.subcategory);
  if (scope.collection) query.set('scopeCollection',scope.collection);
  for (const key of filterKeys) {
    const value = params.get(key);
    if (value) query.set(key,value);
  }
  return `/api/store/facets?${query.toString()}`;
};

export const parseFacetPreviewScope = (params: URLSearchParams): StoreCatalogScope | null => {
  const category = params.get('scopeCategory') ?? 'all';
  const subcategory = params.get('scopeSubcategory') || undefined;
  const collection = params.get('scopeCollection') || undefined;
  if (!['all','smartphones','tablets','accessories','laptops','consoles','open-box-smartphones-tablets'].includes(category)) return null;
  if (subcategory && (category !== 'accessories' || !/^[a-z0-9-]{1,64}$/.test(subcategory))) return null;
  if (collection && !['iphone-17','iphone-16-pro-max','used-phones','used-iphones','samsung-phones','xiaomi-redmi-phones','phones-without-contract'].includes(collection)) return null;
  return {category:category as StoreCatalogCategory,...(subcategory?{subcategory}:{}),...(collection?{collection:collection as StoreCatalogCollection}:{})};
};

export const isCatalogFacetPreview = (value: unknown): value is CatalogFacetPreview => {
  if (!value || typeof value !== 'object') return false;
  const data=value as CatalogFacetPreview;
  if (!Number.isInteger(data.total) || data.total < 0 || !data.facets) return false;
  for (const key of ['brands','storages','conditions','accessoryTypes'] as const) {
    if (!Array.isArray(data.facets[key]) || !data.facets[key].every(option => option && typeof option.value==='string' && Number.isInteger(option.count) && option.count>=0)) return false;
  }
  return Number.isInteger(data.facets.inStock)
    && ['inStock','priceMin','priceMax'].every(key=>Number.isFinite(data.facets[key as 'inStock']) && data.facets[key as 'inStock']>=0)
    && data.facets.priceMin <= data.facets.priceMax;
};
