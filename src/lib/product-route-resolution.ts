import { query } from '@/lib/db';
import { retiredProductTarget } from '@/lib/retired-product-redirect';

export type PublicProductRouteResolution =
  | { kind: 'active' }
  | { kind: 'redirect'; slug: string }
  /**
   * The product exists but no longer sells (removed or switched off). The
   * proxy sends visitors to the closest page that still sells the same thing:
   * permanently when removed, temporarily when only switched off.
   */
  | { kind: 'retired'; targets: { de: string; en: string }; permanent: boolean }
  | { kind: 'missing' };

export const internalMissingProductUrl = (
  internalAppUrl: string,
  locale: string,
): string => new URL(`/${locale}/__missing-product`, internalAppUrl).toString();

export const resolvePublicProductRoute = async (
  slug: string,
): Promise<PublicProductRouteResolution> => {
  const { rows } = await query(
    `SELECT 'active'::text AS kind, p.slug
       FROM products p
      WHERE p.slug = $1 AND p.is_active = true
     UNION ALL
     SELECT 'redirect'::text AS kind, p.slug
       FROM product_slug_history h
       JOIN products p ON p.id = h.product_id
      WHERE h.old_slug = $1 AND p.is_active = true
     ORDER BY kind
     LIMIT 1`,
    [slug],
  );
  const row = rows[0] as { kind?: string; slug?: string } | undefined;
  if (row?.kind === 'active') return { kind: 'active' };
  if (row?.kind === 'redirect' && row.slug) {
    return { kind: 'redirect', slug: row.slug };
  }
  // Loaded on demand: src/proxy.ts imports this module for
  // internalMissingProductUrl and must not bundle the whole catalogue module.
  const { getRetiredProductBySlug } = await import('@/lib/products');
  const retired = await getRetiredProductBySlug(slug);
  if (retired) {
    return {
      kind: 'retired',
      targets: { de: retiredProductTarget(retired, 'de'), en: retiredProductTarget(retired, 'en') },
      permanent: retired.deleted,
    };
  }
  return { kind: 'missing' };
};
