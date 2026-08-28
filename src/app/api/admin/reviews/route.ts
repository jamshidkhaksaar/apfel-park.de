import { NextResponse, type NextRequest } from "next/server";

import { canManageProducts } from "@/lib/admin-auth";
import { createAdminServerClient } from "@/lib/admin-auth-server";
import { rejectCrossSiteAdminMutation } from "@/lib/admin-csrf";
import { withTransaction } from "@/lib/db";
import {
  deleteReviewMedia,
  demoteReviewMedia,
  promoteReviewMedia,
  rollbackDemotedReviewMedia,
  rollbackPromotedReviewMedia,
} from "@/lib/review-media";

export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest) {
  const adminClient = await createAdminServerClient();
  const { data: { user } } = await adminClient.auth.getUser();
  if (!canManageProducts(user)) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const csrf = rejectCrossSiteAdminMutation(request, "Unauthorized");
  if (csrf) return csrf;

  const rollbackState: { run: (() => Promise<void>) | null } = { run: null };
  try {
    const payload = await request.json() as { id?: string; status?: string };
    const id = typeof payload.id === "string" ? payload.id : "";
    const status = payload.status;
    if (!id || (status !== "approved" && status !== "rejected" && status !== "pending")) {
      return NextResponse.json({ success: false, error: "Invalid review update" }, { status: 400 });
    }

    const cleanup = await withTransaction(async (client): Promise<string[] | null> => {
      const existing = await client.query(`SELECT media_urls FROM product_reviews WHERE id=$1 FOR UPDATE`, [id]);
      if ((existing.rowCount ?? 0) === 0) return null;
      const media = Array.isArray(existing.rows[0]?.media_urls)
        ? existing.rows[0].media_urls.filter((value: unknown): value is string => typeof value === "string")
        : [];

      let nextMedia: string[];
      if (status === "approved") {
        const transition = await promoteReviewMedia(media);
        nextMedia = transition.values;
        rollbackState.run = () => rollbackPromotedReviewMedia(transition.moved);
      } else {
        const transition = await demoteReviewMedia(media);
        nextMedia = status === "pending" ? transition.values : [];
        rollbackState.run = () => rollbackDemotedReviewMedia(transition.moved);
        if (status === "rejected") media.splice(0, media.length, ...transition.values);
      }

      await client.query(
        `UPDATE product_reviews SET status=$2,media_urls=$3::text[],updated_at=now() WHERE id=$1`,
        [id, status, nextMedia],
      );
      return status === "rejected" ? media : [];
    });

    if (cleanup === null) return NextResponse.json({ success: false, error: "Review not found" }, { status: 404 });
    rollbackState.run = null;
    if (cleanup.length) await deleteReviewMedia(cleanup).catch((error) => console.error("Rejected review media cleanup failed:", error));
    return NextResponse.json({ success: true });
  } catch (error) {
    if (rollbackState.run) await rollbackState.run().catch((rollbackError) => console.error("Review media rollback failed:", rollbackError));
    console.error("Review moderation failed:", error);
    return NextResponse.json({ success: false, error: "Update failed" }, { status: 500 });
  }
}
