import { NextResponse, type NextRequest } from 'next/server';

import { canManageProducts } from '@/lib/admin-auth';
import { rejectCrossSiteAdminMutation } from '@/lib/admin-csrf';
import { setInventoryCatalogEnabled } from '@/lib/inventory-catalog';
import { readSessionUserFromRequest } from '@/lib/session';

export async function PATCH(request: NextRequest) {
  const user = await readSessionUserFromRequest(request);
  if (!canManageProducts(user)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const csrf = rejectCrossSiteAdminMutation(request);
  if (csrf) return csrf;

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }); }
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  const { productId, catalogEnabled } = body as Record<string, unknown>;
  if (typeof productId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId) || typeof catalogEnabled !== 'boolean') {
    return NextResponse.json({ error: 'Invalid product or selection' }, { status: 400 });
  }
  try {
    const result = await setInventoryCatalogEnabled(productId, catalogEnabled);
    return result ? NextResponse.json(result) : NextResponse.json({ error: 'Product not found' }, { status: 404 });
  } catch (error) {
    console.error('[Inventory catalog] Update failed:', error);
    return NextResponse.json({ error: 'Could not update shop selection' }, { status: 500 });
  }
}
