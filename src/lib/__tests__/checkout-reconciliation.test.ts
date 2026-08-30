import { describe, expect, it } from "vitest";

import {
  PAYPAL_STALE_ORDER_STATUSES,
  STRIPE_CHECKOUT_STALE_STATUSES,
  STRIPE_INTENT_STALE_STATUSES,
  classifyStripeCheckoutSession,
  classifyStripePaymentIntent,
  isStripeIntentReconciliationStatus,
  providerPaymentMatchesExpectation,
} from "@/lib/checkout-reconciliation";

describe("checkout reservation reconciliation policy", () => {
  it("includes normal abandoned embedded Stripe intents", () => {
    expect(STRIPE_INTENT_STALE_STATUSES).toContain("requires_payment_method");
    expect(STRIPE_INTENT_STALE_STATUSES).toContain("payment_failed");
    expect(isStripeIntentReconciliationStatus("requires_payment_method")).toBe(true);
    expect(isStripeIntentReconciliationStatus("stripe_intent_outcome_unknown")).toBe(true);
  });

  it("includes normal abandoned hosted Stripe and PayPal orders", () => {
    expect(STRIPE_CHECKOUT_STALE_STATUSES).toContain("checkout_created");
    expect(PAYPAL_STALE_ORDER_STATUSES).toContain("CREATED");
    expect(PAYPAL_STALE_ORDER_STATUSES).toContain("paypal_expiry_check");
  });

  it("never treats paid or processing states as stale cancellation candidates", () => {
    expect(STRIPE_INTENT_STALE_STATUSES).not.toContain("succeeded");
    expect(STRIPE_INTENT_STALE_STATUSES).not.toContain("processing");
    expect(STRIPE_CHECKOUT_STALE_STATUSES).not.toContain("complete");
    expect(PAYPAL_STALE_ORDER_STATUSES).not.toContain("COMPLETED");
  });

  it("protects completed sessions and succeeded or processing intents", () => {
    expect(classifyStripeCheckoutSession({ status: "complete", paymentStatus: "paid" })).toBe("protect");
    expect(classifyStripeCheckoutSession({ status: "expired", paymentStatus: "unpaid" })).toBe("release");
    expect(classifyStripeCheckoutSession({ status: "open", paymentStatus: "unpaid" })).toBe("expire");
    expect(classifyStripePaymentIntent("succeeded")).toBe("protect");
    expect(classifyStripePaymentIntent("processing")).toBe("protect");
    expect(classifyStripePaymentIntent("canceled")).toBe("release");
    expect(classifyStripePaymentIntent("requires_payment_method")).toBe("cancel");
  });

  it("matches paid provider amounts and currency exactly", () => {
    expect(providerPaymentMatchesExpectation({ cents: 84900, currency: "EUR" }, 84900, "eur")).toBe(true);
    expect(providerPaymentMatchesExpectation({ cents: 84900, currency: "EUR" }, 84899, "eur")).toBe(false);
    expect(providerPaymentMatchesExpectation({ cents: 84900, currency: "EUR" }, 84900, "usd")).toBe(false);
  });
});
