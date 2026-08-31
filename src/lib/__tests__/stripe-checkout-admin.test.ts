import { describe, expect, it, vi } from "vitest";

import { expireStripeCheckoutSessionForAdmin } from "../stripe-checkout-admin";

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

describe("admin Stripe Checkout expiration", () => {
  it("expires an open Checkout Session before allowing local cancellation", async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ status: "open", payment_status: "unpaid" }))
      .mockResolvedValueOnce(jsonResponse({ status: "expired", payment_status: "unpaid" }));

    await expect(expireStripeCheckoutSessionForAdmin({
      sessionId: "cs_test_123",
      orderId: "12345678-1234-1234-1234-123456789012",
      secretKey: "sk_test_secret",
      fetchImpl,
    })).resolves.toEqual({ outcome: "expired", providerStatus: "expired" });

    expect(fetchImpl).toHaveBeenNthCalledWith(
      2,
      "https://api.stripe.com/v1/checkout/sessions/cs_test_123/expire",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Idempotency-Key": "admin_expire_12345678-1234-1234-1234-123456789012",
        }),
      }),
    );
  });

  it("does not expire a completed or paid Checkout Session", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({ status: "complete", payment_status: "paid" }),
    );

    await expect(expireStripeCheckoutSessionForAdmin({
      sessionId: "cs_test_paid",
      orderId: "12345678-1234-1234-1234-123456789012",
      secretKey: "sk_test_secret",
      fetchImpl,
    })).resolves.toEqual({ outcome: "protected", providerStatus: "complete" });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("treats an already expired Checkout Session as safely cancellable", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({ status: "expired", payment_status: "unpaid" }),
    );

    await expect(expireStripeCheckoutSessionForAdmin({
      sessionId: "cs_test_expired",
      orderId: "12345678-1234-1234-1234-123456789012",
      secretKey: "sk_test_secret",
      fetchImpl,
    })).resolves.toEqual({ outcome: "expired", providerStatus: "expired" });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
