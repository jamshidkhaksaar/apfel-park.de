import { NextResponse, type NextRequest } from "next/server";

import { canManageProducts } from "@/lib/admin-auth";
import { createAdminServerClient } from "@/lib/admin-auth-server";
import { rejectCrossSiteAdminMutation } from "@/lib/admin-csrf";
import { withTransaction } from "@/lib/db";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const client = await createAdminServerClient();
  const { data: { user } } = await client.auth.getUser();
  if (!canManageProducts(user)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const csrf = rejectCrossSiteAdminMutation(request);
  if (csrf) return csrf;
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: 'Invalid product' }, { status: 400 });
  }
  try {
    const found = await withTransaction(async (db) => {
      const result = await db.query('UPDATE products SET is_active = false, updated_at = now() WHERE id = $1 RETURNING id', [id]);
      if (!result.rows.length) return false;
      await db.query(`UPDATE product_intake_runs SET stale_at = now(), stale_reason = 'Product deactivated', dispatch_status = 'stale'
        WHERE (origin_product_id = $1::uuid OR target_product_id = $1::uuid)
          AND status NOT IN ('applied', 'rejected', 'cancelled') AND stale_at IS NULL`, [id]);
      return true;
    });
    return found ? NextResponse.json({ success: true }) : NextResponse.json({ error: 'Product not found' }, { status: 404 });
  } catch (error) {
    console.error('Deactivate product failed:', error);
    return NextResponse.json({ error: 'Deactivation failed' }, { status: 500 });
  }
}
