/**
 * Thin-category protection.
 *
 * A top-level category with one or two sellable SKUs is thin content: it invites
 * demotion and wastes crawl budget. Below the threshold the page stays reachable
 * and keeps its links (`noindex, follow`) but leaves the sitemap, and it returns
 * to the index automatically once live stock crosses the line — no deploy.
 *
 * Laptops and spare parts are the deliberate exception: both are substantial,
 * curated service pages with unique copy and a repair/consultation funnel, so
 * they are indexed from their first sellable SKU.
 */
export const MIN_INDEXABLE_CATEGORY_SKUS = 3;

/** Categories whose landing content stands on its own even with a single SKU. */
export const ALWAYS_INDEXABLE_CATEGORIES = new Set(["laptops", "parts"]);

export const isCategoryIndexable = (activeCount: number, category?: string): boolean => {
  if (!Number.isFinite(activeCount)) return false;
  if (category && ALWAYS_INDEXABLE_CATEGORIES.has(category)) return activeCount > 0;
  return activeCount >= MIN_INDEXABLE_CATEGORY_SKUS;
};
