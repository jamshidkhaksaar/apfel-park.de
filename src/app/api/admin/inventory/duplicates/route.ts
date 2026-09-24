import { NextRequest, NextResponse } from 'next/server';

import { canManageProducts } from '@/lib/admin-auth';
import { query } from '@/lib/db';
import { inventoryDuplicatePredicate, inventoryDuplicateReason } from '@/lib/inventory-duplicates';
import { readSessionUserFromRequest } from '@/lib/session';

export async function GET(request: NextRequest) {
  const user = await readSessionUserFromRequest(request);
  if (!canManageProducts(user)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const productId = request.nextUrl.searchParams.get('productId') ?? '';
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId)) {
    return NextResponse.json({ error: 'Invalid product' }, { status: 400 });
  }

  try {
    const result = await query(
      `SELECT candidate.id, candidate.title, candidate.model, candidate.sku, candidate.stock,
              candidate.is_active, candidate.catalog_enabled, candidate.images,
              ${inventoryDuplicateReason} AS reason
         FROM products anchor
         JOIN products candidate ON ${inventoryDuplicatePredicate}
        WHERE anchor.id = $1
        ORDER BY candidate.is_active DESC, candidate.updated_at DESC, candidate.title ASC`,
      [productId],
    );
    return NextResponse.json({ items: result.rows.map((row) => ({
      id: String(row.id),
      title: String(row.title),
      model: row.model ? String(row.model) : null,
      sku: row.sku ? String(row.sku) : null,
      stock: Number(row.stock ?? 0),
      active: Boolean(row.is_active),
      catalogEnabled: Boolean(row.catalog_enabled),
      image: Array.isArray(row.images) ? row.images.find((image: unknown) => typeof image === 'string' && image.trim()) ?? null : null,
      reason: String(row.reason),
    })) });
  } catch (error) {
    console.error('[Admin inventory] Duplicate lookup failed:', error);
    return NextResponse.json({ error: 'Similar products could not be loaded' }, { status: 500 });
  }
}
