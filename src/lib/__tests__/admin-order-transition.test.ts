import { describe, expect, it } from "vitest";

import { validateAdminOrderTransition } from "../admin-order-transition";

describe("admin order transitions", () => {
  it("never allows a generic admin form to mark an order paid", () => {
    expect(validateAdminOrderTransition({ currentStatus: "pending", paymentStatus: "unpaid", nextStatus: "paid" })).toEqual({ allowed: false, reason: "payment_required" });
  });

  it("allows only unpaid pending orders to use the cancellation path", () => {
    expect(validateAdminOrderTransition({ currentStatus: "pending", paymentStatus: "unpaid", nextStatus: "cancelled" })).toEqual({ allowed: true, mode: "cancel" });
    expect(validateAdminOrderTransition({ currentStatus: "paid", paymentStatus: "paid", nextStatus: "cancelled" })).toEqual({ allowed: false, reason: "refund_required" });
  });

  it("rejects local cancellation while a provider payment is active or uncertain", () => {
    expect(validateAdminOrderTransition({ currentStatus: "pending", paymentStatus: "unpaid", nextStatus: "cancelled", providerOrderId: "pi_1", providerStatus: "requires_payment_method" })).toEqual({ allowed: false, reason: "provider_active" });
    expect(validateAdminOrderTransition({ currentStatus: "pending", paymentStatus: "unpaid", nextStatus: "cancelled", providerStatus: "stripe_checkout_outcome_unknown" })).toEqual({ allowed: false, reason: "provider_active" });
    expect(validateAdminOrderTransition({ currentStatus: "pending", paymentStatus: "unpaid", nextStatus: "cancelled", providerSessionId: "cs_1", providerStatus: "expired" })).toEqual({ allowed: true, mode: "cancel" });
  });

  it("requires verified payment before shipment or delivery", () => {
    expect(validateAdminOrderTransition({ currentStatus: "pending", paymentStatus: "unpaid", nextStatus: "shipped" }).allowed).toBe(false);
    expect(validateAdminOrderTransition({ currentStatus: "paid", paymentStatus: "paid", nextStatus: "shipped" })).toEqual({ allowed: true, mode: "fulfillment" });
    expect(validateAdminOrderTransition({ currentStatus: "shipped", paymentStatus: "paid", nextStatus: "delivered" })).toEqual({ allowed: true, mode: "fulfillment" });
  });
});
