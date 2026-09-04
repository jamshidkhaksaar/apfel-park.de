import { query } from '@/lib/db';

export type PublicProductRouteResolution =
  | { kind: 'active' }
  | { kind: 'redirect'; slug: string }
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
  return { kind: 'missing' };
};
