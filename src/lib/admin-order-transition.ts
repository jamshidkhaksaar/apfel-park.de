export type AdminOrderTransitionInput = {
  currentStatus: string;
  paymentStatus: string;
  nextStatus: string;
  providerOrderId?: string | null;
  providerSessionId?: string | null;
  providerStatus?: string | null;
};

export type AdminOrderTransitionDecision =
  | { allowed: true; mode: "cancel" | "fulfillment" | "noop" }
  | { allowed: false; reason: "payment_required" | "refund_required" | "provider_active" | "invalid_transition" };

const TERMINAL_PROVIDER_STATUSES = new Set([
  "expired", "canceled", "cancelled", "voided", "denied",
  "provider_request_failed", "order_creation_failed", "checkout_creation_failed",
  "intent_creation_failed", "coupon_creation_failed", "no_remote_payment_intent",
  "stale_provider_outcome_expired", "canceled_by_reconciliation",
  "payment_failed", "failed",
]);

export const validateAdminOrderTransition = ({
  currentStatus,
  paymentStatus,
  nextStatus,
  providerOrderId,
  providerSessionId,
  providerStatus,
}: AdminOrderTransitionInput): AdminOrderTransitionDecision => {
  if (nextStatus === "paid") return { allowed: false, reason: "payment_required" };
  if (nextStatus === "cancelled") {
    if (paymentStatus === "paid") return { allowed: false, reason: "refund_required" };
    const normalizedProviderStatus = providerStatus?.toLowerCase().trim() ?? "";
    const providerBoundOrStarted = Boolean(providerOrderId || providerSessionId || normalizedProviderStatus);
    if (providerBoundOrStarted && !TERMINAL_PROVIDER_STATUSES.has(normalizedProviderStatus)) {
      return { allowed: false, reason: "provider_active" };
    }
    return currentStatus === "pending" && paymentStatus === "unpaid"
      ? { allowed: true, mode: "cancel" }
      : { allowed: false, reason: "invalid_transition" };
  }
  if (nextStatus === "pending") {
    return currentStatus === "pending" && paymentStatus === "unpaid"
      ? { allowed: true, mode: "noop" }
      : { allowed: false, reason: "invalid_transition" };
  }
  if (nextStatus === "shipped") {
    return paymentStatus === "paid" && (currentStatus === "paid" || currentStatus === "shipped")
      ? { allowed: true, mode: "fulfillment" }
      : { allowed: false, reason: "payment_required" };
  }
  if (nextStatus === "delivered") {
    return paymentStatus === "paid" && (currentStatus === "paid" || currentStatus === "shipped" || currentStatus === "delivered")
      ? { allowed: true, mode: "fulfillment" }
      : { allowed: false, reason: "payment_required" };
  }
  return { allowed: false, reason: "invalid_transition" };
};
