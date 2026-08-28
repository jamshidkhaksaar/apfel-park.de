"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { canManageOrders } from "@/lib/admin-auth";
import { createAdminServerClient } from "@/lib/admin-auth-server";
import { query } from "@/lib/db";
import { enqueueMarketplaceJob } from "@/lib/marketplaces";
import { notifyPaidOrderAdmin } from "@/lib/order-notifications";
import { sanitizeInput } from "@/lib/security";
import { validateAdminOrderTransition } from "@/lib/admin-order-transition";
import { markOrderCancelled } from "@/lib/checkout";

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
  const currentResult = await query(
    `SELECT status, payment_status, provider, provider_order_id, provider_session_id, provider_status, updated_at FROM orders WHERE id = $1 LIMIT 1`,
    [id],
  );
  const current = currentResult.rows[0] as { status?: string; payment_status?: string; provider?: "stripe" | "paypal"; provider_order_id?: string | null; provider_session_id?: string | null; provider_status?: string | null; updated_at?: string | null } | undefined;
  if (!current) redirect("/admin/orders?error=not-found");
  const decision = validateAdminOrderTransition({
    currentStatus: current.status ?? "",
    paymentStatus: current.payment_status ?? "",
    nextStatus,
    providerOrderId: current.provider_order_id,
    providerSessionId: current.provider_session_id,
    providerStatus: current.provider_status,
  });
  if (!decision.allowed) redirect(`/admin/orders?error=${decision.reason}`);

  if (decision.mode === "cancel") {
    if (current.provider !== "stripe" && current.provider !== "paypal") redirect("/admin/orders?error=invalid-provider");
    const cancelledOrderId = await markOrderCancelled({
      orderId: id,
      provider: current.provider,
      providerOrderId: current.provider_order_id,
      providerSessionId: current.provider_session_id,
      providerStatus: "cancelled_by_admin",
      expectedStatus: current.status,
      expectedPaymentStatus: current.payment_status,
      expectedProviderStatus: current.provider_status,
      expectedProviderOrderId: current.provider_order_id,
      expectedProviderSessionId: current.provider_session_id,
      expectedUpdatedAt: current.updated_at,
    });
    if (!cancelledOrderId) redirect("/admin/orders?error=conflict");
  } else if (decision.mode === "fulfillment") {
    const update = await query(
      `UPDATE orders
       SET status = $2,
           metadata = CASE WHEN $3::text IS NULL THEN metadata
                           ELSE COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('trackingId', $3::text) END,
           updated_at = now()
       WHERE id = $1 AND payment_status = $4 AND status = $5
       RETURNING id`,
      [id, nextStatus, hasTracking ? trackingId || null : null, current.payment_status, current.status],
    );
    if (!update.rows[0]) redirect("/admin/orders?error=conflict");
    if (trackingId) {
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
