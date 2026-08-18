"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { canManageOrders } from "@/lib/admin-auth";
import { createAdminServerClient } from "@/lib/admin-auth-server";
import { query } from "@/lib/db";
import { enqueueMarketplaceJob } from "@/lib/marketplaces";
import { notifyPaidOrderAdmin } from "@/lib/order-notifications";
import { sanitizeInput } from "@/lib/security";

const ALLOWED_STATUSES = new Set(["pending", "paid", "shipped", "delivered", "cancelled"]);

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function updateOrderFulfillment(formData: FormData) {
  const adminClient = await createAdminServerClient();
  const {
    data: { user },
    error: authError,
  } = await adminClient.auth.getUser();

  if (authError || !canManageOrders(user)) {
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
    if (trackingId && (nextStatus === "shipped" || nextStatus === "delivered")) {
      const marketplaceOrders = await query(
        `SELECT marketplace, external_order_id FROM marketplace_orders WHERE order_id = $1`,
        [id],
      );
      await Promise.all(
        marketplaceOrders.rows.map((order: { marketplace: "amazon_de" | "ebay_de"; external_order_id: string }) =>
          enqueueMarketplaceJob(order.marketplace, "confirm_shipment", undefined, {
            externalOrderId: order.external_order_id,
            carrier: "other",
            trackingNumber: trackingId,
          }),
        ),
      );
    }
  } else {
    await query(`UPDATE orders SET status = $2, updated_at = now() WHERE id = $1`, [id, nextStatus]);
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);

  const target = returnTo === "detail" ? `/admin/orders/${id}?updated=1` : "/admin/orders?updated=1";
  redirect(target);
}

export async function resendOrderNotification(formData: FormData) {
  const adminClient = await createAdminServerClient();
  const {
    data: { user },
    error: authError,
  } = await adminClient.auth.getUser();

  if (authError || !canManageOrders(user)) {
    redirect("/admin/orders?error=auth");
  }

  const id = sanitizeInput(formData.get("id"));
  if (!UUID_PATTERN.test(id)) {
    redirect("/admin/orders?error=invalid");
  }

  const result = await notifyPaidOrderAdmin(id, { force: true });
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  redirect(
    result.status === "sent"
      ? `/admin/orders/${id}?notified=1`
      : `/admin/orders/${id}?notifyError=1`,
  );
}
