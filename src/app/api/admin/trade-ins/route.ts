import { NextResponse, type NextRequest } from "next/server";

import { canManageOrders } from "@/lib/admin-auth";
import { createAdminServerClient } from "@/lib/admin-auth-server";
import { rejectCrossSiteAdminMutation } from "@/lib/admin-csrf";
import { query } from "@/lib/db";
import { sanitizeInput } from "@/lib/security";

async function authorized() { const client = await createAdminServerClient(); const { data: { user } } = await client.auth.getUser(); return canManageOrders(user); }

export async function PATCH(request: NextRequest) {
  if (!(await authorized())) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const csrf = rejectCrossSiteAdminMutation(request, "Unauthorized"); if (csrf) return csrf;
  try {
    const payload = await request.json() as Record<string, unknown>; const id = String(payload.id ?? "");
    const status = String(payload.status ?? ""); const allowed = ["new","reviewing","quoted","accepted","declined","closed"];
    if (!/^[0-9a-f-]{36}$/i.test(id) || !allowed.includes(status)) return NextResponse.json({ success: false, error: "Invalid update" }, { status: 400 });
    const quote = payload.quoteAmount === null || payload.quoteAmount === "" ? null : Number(payload.quoteAmount); if (quote !== null && (!Number.isFinite(quote) || quote < 0)) return NextResponse.json({ success: false, error: "Invalid quote" }, { status: 400 });
    const result = await query(`UPDATE trade_in_requests SET status=$2,quote_amount=$3,admin_note=$4,updated_at=now() WHERE id=$1`, [id, status, quote, sanitizeInput(String(payload.adminNote ?? "")).slice(0, 3000) || null]);
    if (result.rowCount === 0) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) { console.error("Trade-in admin update failed:", error); return NextResponse.json({ success: false, error: "Update failed" }, { status: 500 }); }
}
