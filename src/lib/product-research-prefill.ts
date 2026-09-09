import type { ProductResearchResult } from '@/lib/product-research-core';

/** Research may suggest a fresh internal SKU, but never replaces an existing one
 * or creates stock offers from manufacturer colour/storage options.
 */
export const researchOfferPatch = <T>(current: { sku: string; variants: T }, research: ProductResearchResult): { sku: string; variants: T } => ({
  sku: current.sku || research.skuSuggestion || '',
  variants: current.variants,
});

export const hasReviewedResearchSources = (research: ProductResearchResult): boolean =>
  Array.isArray(research.researchSources) && research.researchSources.length > 0 && research.researchSources.every(source => {
    try { const url = new URL(source.url); return url.protocol === 'https:' && !url.username && !url.password; }
    catch { return false; }
  });

/** Keep original cover and variant image indices unchanged. */
export const mergeResearchGallery = (owned: string[], licensed: string[], condition: string): string[] => [
  ...owned,
  ...(condition === 'new' ? [...new Set(licensed)].filter(url => !owned.includes(url)) : []),
];
