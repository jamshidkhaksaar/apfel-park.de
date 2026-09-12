import { evaluateProductChannelReadiness } from '@/lib/product-channel-readiness';
import type { Product } from '@/lib/products';

/** Keep online and local feeds on exactly the same eligibility policy. */
export const eligibleGoogleFeedProducts = (products: Product[]): Product[] => {
  const selected = products.filter(product => product.googleFeedEnabled !== false);
  const eligible = selected.filter(product => evaluateProductChannelReadiness(product).google.ready);
  if (selected.length > 0 && eligible.length === 0) {
    throw new Error('Google feed aborted: all selected products failed readiness checks.');
  }
  return eligible;
};
