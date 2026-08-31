"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { canManageOrders } from "@/lib/admin-auth";
import { createAdminServerClient } from "@/lib/admin-auth-server";
import { validateAdminOrderTransition } from "@/lib/admin-order-transition";
import { query } from "@/lib/db";
import { enqueueMarketplaceJob } from "@/lib/marketplaces";
import { notifyPaidOrderAdmin } from "@/lib/order-notifications";
import { sanitizeInput } from "@/lib/security";
import { attachProviderReference, isOrderInProviderState, markOrderCancelled } from "@/lib/checkout";
import { expireStripeCheckoutSessionForAdmin } from "@/lib/stripe-checkout-admin";

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
  const orderPath = returnTo === "detail" ? `/admin/orders/${id}` : "/admin/orders";
  const redirectError = (reason: string): never => redirect(`${orderPath}?error=${reason}`);
  const decision = validateAdminOrderTransition({
    currentStatus: current.status ?? "",
    paymentStatus: current.payment_status ?? "",
    nextStatus,
    providerOrderId: current.provider_order_id,
    providerSessionId: current.provider_session_id,
    providerStatus: current.provider_status,
  });
  let remoteCancellation: { providerStatus: string; updatedAt: string } | null = null;
  if (!decision.allowed) {
    const providerSessionId = current.provider_session_id;
    const canExpireStripeCheckout = decision.reason === "provider_active"
      && nextStatus === "cancelled"
      && current.provider === "stripe"
      && Boolean(providerSessionId);
    if (!canExpireStripeCheckout) return redirectError(decision.reason);

    const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
    if (!secretKey || !providerSessionId) return redirectError("provider_cancel_failed");
    let expiration: Awaited<ReturnType<typeof expireStripeCheckoutSessionForAdmin>> | null = null;
    try {
      expiration = await expireStripeCheckoutSessionForAdmin({
        sessionId: providerSessionId,
        orderId: id,
        secretKey,
      });
    } catch (error) {
      console.error("Admin Stripe Checkout cancellation failed", {
        orderId: id,
        error: error instanceof Error ? error.message : "Stripe cancellation failed",
      });
    }
    if (!expiration) return redirectError("provider_cancel_failed");
    if (expiration.outcome === "protected") return redirectError("provider_paid");

    const snapshot = await attachProviderReference({
      orderId: id,
      provider: "stripe",
      providerSessionId,
      providerStatus: expiration.providerStatus,
    });
    if (!snapshot) {
      if (await isOrderInProviderState({ provider: "stripe", orderId: id, statuses: ["cancelled"] })) {
        revalidatePath("/admin/orders");
        revalidatePath(`/admin/orders/${id}`);
        redirect(`${orderPath}?updated=1`);
      }
      return redirectError("conflict");
    }
    remoteCancellation = { providerStatus: expiration.providerStatus, updatedAt: snapshot.updatedAt };
  }

  if ((decision.allowed && decision.mode === "cancel") || remoteCancellation) {
    if (current.provider !== "stripe" && current.provider !== "paypal") redirect("/admin/orders?error=invalid-provider");
    const cancelledOrderId = await markOrderCancelled({
      orderId: id,
      provider: current.provider,
      providerOrderId: current.provider_order_id,
      providerSessionId: current.provider_session_id,
      providerStatus: remoteCancellation?.providerStatus ?? "cancelled_by_admin",
      expectedStatus: current.status,
      expectedPaymentStatus: current.payment_status,
      expectedProviderStatus: remoteCancellation?.providerStatus ?? current.provider_status,
      expectedProviderOrderId: current.provider_order_id,
      expectedProviderSessionId: current.provider_session_id,
      expectedUpdatedAt: remoteCancellation?.updatedAt ?? current.updated_at,
    });
    if (!cancelledOrderId) {
      if (!(await isOrderInProviderState({ provider: current.provider, orderId: id, statuses: ["cancelled"] }))) {
        redirectError("conflict");
      }
    }
  } else if (decision.allowed && decision.mode === "fulfillment") {
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
    if (!update.rows[0]) redirectError("conflict");
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

  redirect(`${orderPath}?updated=1`);
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
