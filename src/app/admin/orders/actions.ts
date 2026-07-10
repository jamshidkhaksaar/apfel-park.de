"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isAdminUser } from "@/lib/admin-auth";
import { createAdminServerClient } from "@/lib/admin-auth-server";
import { query } from "@/lib/db";
import { sanitizeInput } from "@/lib/security";

const ALLOWED_STATUSES = new Set(["pending", "paid", "shipped", "delivered", "cancelled"]);

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function updateOrderFulfillment(formData: FormData) {
  const adminClient = await createAdminServerClient();
  const {
    data: { user },
    error: authError,
  } = await adminClient.auth.getUser();

  if (authError || !isAdminUser(user)) {
    redirect("/admin/orders?error=auth");
  }

  const id = sanitizeInput(formData.get("id"));
  const nextStatus = sanitizeInput(formData.get("status")).toLowerCase();
  const hasTracking = formData.has("trackingId");
  const trackingId = sanitizeInput(formData.get("trackingId"));
  const returnTo = sanitizeInput(formData.get("returnTo"));

  if (!UUID_PATTERN.test(id) || !ALLOWED_STATUSES.has(nextStatus)) {
    redirect("/admin/orders?error=invalid");
  }

  if (hasTracking) {
    await query(
      `UPDATE orders
       SET status = $2,
           metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('trackingId', $3::text),
           updated_at = now()
       WHERE id = $1`,
      [id, nextStatus, trackingId || null],
    );
  } else {
    await query(`UPDATE orders SET status = $2, updated_at = now() WHERE id = $1`, [id, nextStatus]);
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);

  const target = returnTo === "detail" ? `/admin/orders/${id}?updated=1` : "/admin/orders?updated=1";
  redirect(target);
}
