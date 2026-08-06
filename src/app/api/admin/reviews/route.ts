import { NextResponse, type NextRequest } from "next/server";

import { createAdminServerClient } from "@/lib/admin-auth-server";
import { canManageProducts } from "@/lib/admin-auth";
import { rejectCrossSiteAdminMutation } from "@/lib/admin-csrf";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Moderation endpoint. Reviews are held at status='pending' until an admin
 * approves them, because only approved reviews are shown and counted towards
 * the aggregateRating in the Product JSON-LD.
 */
export async function PATCH(request: NextRequest) {
  const adminClient = await createAdminServerClient();
  const {
    data: { user },
  } = await adminClient.auth.getUser();
  if (!canManageProducts(user)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const csrf = rejectCrossSiteAdminMutation(request, "Unauthorized");
  if (csrf) return csrf;

  try {
    const payload = (await request.json()) as { id?: string; status?: string };
    const id = typeof payload.id === "string" ? payload.id : "";
    const status = payload.status;
    if (!id || (status !== "approved" && status !== "rejected" && status !== "pending")) {
      return NextResponse.json({ success: false, error: "Invalid review update" }, { status: 400 });
    }

    const result = await query(
      `UPDATE product_reviews SET status = $2, updated_at = now() WHERE id = $1 RETURNING id`,
      [id, status],
    );
    if (result.rowCount === 0) {
      return NextResponse.json({ success: false, error: "Review not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Review moderation failed:", error);
    return NextResponse.json({ success: false, error: "Update failed" }, { status: 500 });
  }
}
