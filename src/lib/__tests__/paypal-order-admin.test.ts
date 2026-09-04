import { describe, expect, it, vi } from "vitest";

import { inspectPayPalOrderForAdminCancellation } from "../paypal-order-admin";

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const input = {
  orderId: "PAYPAL-ORDER-123",
  clientId: "client-id",
  clientSecret: "client-secret",
  mode: "live" as const,
};

describe("PayPal admin order cancellation", () => {
  it("allows local cancellation when PayPal no longer has the expired order", async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ access_token: "access-token" }))
      .mockResolvedValueOnce(jsonResponse({ name: "RESOURCE_NOT_FOUND" }, 404));

    await expect(inspectPayPalOrderForAdminCancellation({ ...input, fetchImpl }))
      .resolves.toEqual({ outcome: "cancelable", providerStatus: "PAYPAL_ORDER_NOT_FOUND" });
  });

  it("protects a completed PayPal order from local cancellation", async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ access_token: "access-token" }))
      .mockResolvedValueOnce(jsonResponse({ status: "COMPLETED" }));

    await expect(inspectPayPalOrderForAdminCancellation({ ...input, fetchImpl }))
      .resolves.toEqual({ outcome: "protected", providerStatus: "COMPLETED" });
  });

  it("keeps an active PayPal approval flow blocked", async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ access_token: "access-token" }))
      .mockResolvedValueOnce(jsonResponse({ status: "PAYER_ACTION_REQUIRED" }));

    await expect(inspectPayPalOrderForAdminCancellation({ ...input, fetchImpl }))
      .resolves.toEqual({ outcome: "active", providerStatus: "PAYER_ACTION_REQUIRED" });
  });
});
