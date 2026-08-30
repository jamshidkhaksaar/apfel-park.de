export const STRIPE_INTENT_STALE_STATUSES = [
  "stripe_intent_requesting",
  "stripe_intent_outcome_unknown",
  "requires_payment_method",
  "requires_confirmation",
  "requires_action",
  "payment_failed",
] as const;

export const STRIPE_CHECKOUT_STALE_STATUSES = [
  "stripe_checkout_requesting",
  "stripe_checkout_outcome_unknown",
  "checkout_created",
] as const;

export const PAYPAL_STALE_ORDER_STATUSES = [
  "paypal_order_requesting",
  "paypal_order_outcome_unknown",
  "CREATED",
  "PAYER_ACTION_REQUIRED",
  "APPROVED",
  "paypal_expiry_check",
] as const;

export const PROVIDER_RECONCILIATION_AGE_SECONDS = {
  stripeIntent: 2 * 60 * 60,
  stripeCheckout: 2 * 60 * 60,
  paypalOrder: 73 * 60 * 60,
} as const;

const stripeIntentStatuses = new Set<string>(STRIPE_INTENT_STALE_STATUSES);

export const isStripeIntentReconciliationStatus = (status: string): boolean =>
  stripeIntentStatuses.has(status);

export const classifyStripeCheckoutSession = ({
  status,
  paymentStatus,
}: {
  status?: string | null;
  paymentStatus?: string | null;
}): "protect" | "expire" | "release" | "investigate" => {
  if (status === "complete" || paymentStatus === "paid") return "protect";
  if (status === "expired") return "release";
  if (status === "open") return "expire";
  return "investigate";
};

export const classifyStripePaymentIntent = (
  status?: string | null,
): "protect" | "cancel" | "release" | "investigate" => {
  if (status === "succeeded" || status === "processing") return "protect";
  if (status === "canceled") return "release";
  if (
    status === "requires_payment_method"
    || status === "requires_confirmation"
    || status === "requires_action"
    || status === "requires_capture"
  ) return "cancel";
  return "investigate";
};

export const providerPaymentMatchesExpectation = (
  expected: { cents: number; currency: string } | null,
  providerCents: number | null | undefined,
  providerCurrency: string | null | undefined,
): boolean => Boolean(
  expected
  && typeof providerCents === "number"
  && Number.isSafeInteger(providerCents)
  && providerCents === expected.cents
  && providerCurrency?.toUpperCase() === expected.currency.toUpperCase()
);
