/**
 * Thin-category protection.
 *
 * A top-level category with one or two sellable SKUs is thin content: it invites
 * demotion and wastes crawl budget. Below the threshold the page stays reachable
 * and keeps its links (`noindex, follow`) but leaves the sitemap, and it returns
 * to the index automatically once live stock crosses the line — no deploy.
 */
export const MIN_INDEXABLE_CATEGORY_SKUS = 3;

export const isCategoryIndexable = (activeCount: number): boolean =>
  Number.isFinite(activeCount) && activeCount >= MIN_INDEXABLE_CATEGORY_SKUS;
