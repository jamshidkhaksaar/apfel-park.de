import type { Product } from './products';

export const TRENDING_PRODUCT_COUNT = 8;

type TrendingCandidate = Pick<Product, 'id' | 'title' | 'model' | 'category' | 'price' | 'stock' | 'hasDiscount' | 'createdAt'>;
type SellableCard = Pick<Product, 'id' | 'price' | 'stock'>;

const isSellable = (product: SellableCard): boolean => Boolean(product.id)
  && Number.isFinite(product.stock) && (product.stock ?? 0) > 0
  && Number.isFinite(product.price) && product.price > 0;

/** A carousel is either eight distinct available offers or it is not shown. */
export const isCompleteTrendingSelection = (products: readonly SellableCard[]): boolean =>
  products.length === TRENDING_PRODUCT_COUNT
  && products.every(isSellable)
  && new Set(products.map(product => product.id)).size === TRENDING_PRODUCT_COUNT;

const categoryPriority: Record<Product['category'], number> = {
  smartphones: 5,
  tablets: 4,
  laptops: 3,
  consoles: 2,
  accessories: 1,
};

const fallbackScore = (product: TrendingCandidate): number => {
  let score = 0;
  // Model mentions on cases, cables and other compatible accessories are not
  // evidence of demand for those accessories. Only actual phones get this boost.
  if (product.category === 'smartphones') {
    const text = `${product.title} ${product.model ?? ''}`.toLowerCase();
    if (/iphone\s*17\b/.test(text)) score += 1_000;
    else if (/iphone\s*16\b/.test(text)) score += 700;
    else if (/iphone\s*15\b/.test(text)) score += 500;
    if (/pro\s*max/.test(text)) score += 120;
    else if (/\bpro\b/.test(text)) score += 90;
    if (/\bair\b/.test(text)) score += 60;
  }
  if (product.hasDiscount) score += 40;
  return score + Math.min(product.stock ?? 0, 10);
};

/**
 * Input must be the active public catalog, already hydrated from the inventory
 * ledger. Preserve valid saved picks (including explicitly selected accessories)
 * and fill gaps with device-first stock picks. Never modify the persisted cache.
 */
export const selectTrendingProducts = <T extends TrendingCandidate>(
  products: readonly T[],
  configuredIds: unknown,
  limit = TRENDING_PRODUCT_COUNT,
): T[] => {
  if (!Number.isInteger(limit) || limit < 1 || limit > TRENDING_PRODUCT_COUNT) return [];
  const byId = new Map<string, T>();
  for (const product of products) {
    if (isSellable(product) && !byId.has(product.id)) byId.set(product.id, product);
  }
  if (byId.size < limit) return [];

  const selected: T[] = [];
  const selectedIds = new Set<string>();
  for (const id of Array.isArray(configuredIds) ? configuredIds : []) {
    if (typeof id !== 'string' || selectedIds.has(id)) continue;
    const product = byId.get(id);
    if (!product) continue;
    selected.push(product);
    selectedIds.add(id);
    if (selected.length === limit) return selected;
  }
  const fallback = [...byId.values()].filter(product => !selectedIds.has(product.id));
  fallback.sort((a, b) => categoryPriority[b.category] - categoryPriority[a.category]
    || fallbackScore(b) - fallbackScore(a)
    || String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''))
    || a.id.localeCompare(b.id));
  return [...selected, ...fallback].slice(0, limit);
};
