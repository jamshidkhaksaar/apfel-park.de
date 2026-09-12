import { describe, expect, it, vi } from "vitest";

import { inspectPayPalOrderForAdminCancellation } from "../paypal-order-admin";

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const input = {
  orderId: "PAYPAL-ORDER-123",
  localOrderId: "11111111-1111-4111-8111-111111111111",
  clientId: "client-id",
  clientSecret: "client-secret",
  mode: "live" as const,
};

describe("PayPal admin order cancellation", () => {
  it.each(["live", "sandbox"] as const)("accepts bound VOIDED only on the selected %s endpoint", async (mode) => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ access_token: "access-token" }))
      .mockResolvedValueOnce(jsonResponse({ id: input.orderId, status: "VOIDED", purchase_units: [{ custom_id: input.localOrderId, reference_id: input.localOrderId }] }));
    await expect(inspectPayPalOrderForAdminCancellation({ ...input, mode, fetchImpl }))
      .resolves.toEqual({ outcome: "cancelable", providerStatus: "VOIDED" });
    const base = mode === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
    expect(fetchImpl).toHaveBeenNthCalledWith(2, `${base}/v2/checkout/orders/${input.orderId}`, expect.any(Object));
  });
  it.each(["CREATED", "APPROVED"])("retains active %s", async (status) => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(jsonResponse({ access_token: "access-token" }))
      .mockResolvedValueOnce(jsonResponse({ status }));
    await expect(inspectPayPalOrderForAdminCancellation({ ...input, fetchImpl })).resolves.toEqual({ outcome: "active", providerStatus: status });
  });
  it.each([{}, { status: "UNKNOWN" }, { status: null }, { status: 42 }, { status: ["VOIDED"] }, null])("fails closed for malformed/unknown snapshot %j", async (body) => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(jsonResponse({ access_token: "access-token" }))
      .mockResolvedValueOnce(jsonResponse(body));
    await expect(inspectPayPalOrderForAdminCancellation({ ...input, fetchImpl })).rejects.toThrow();
  });
  it.each([401, 403, 404, 500])("fails closed for HTTP %s", async (status) => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(jsonResponse({ access_token: "access-token" }))
      .mockResolvedValueOnce(jsonResponse({ name: "NONCANONICAL_ERROR" }, status));
    await expect(inspectPayPalOrderForAdminCancellation({ ...input, fetchImpl })).rejects.toThrow();
  });
  it("fails closed for invalid JSON", async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(jsonResponse({ access_token: "access-token" }))
      .mockResolvedValueOnce(new Response("not-json"));
    await expect(inspectPayPalOrderForAdminCancellation({ ...input, fetchImpl })).rejects.toThrow();
  });
  it("fails closed for authentication failure before lookup", async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(jsonResponse({ message: "unauthorized" }, 401));
    await expect(inspectPayPalOrderForAdminCancellation({ ...input, fetchImpl })).rejects.toThrow("unauthorized");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
  it("fails closed for lookup network failure", async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(jsonResponse({ access_token: "access-token" }))
      .mockRejectedValueOnce(new Error("network failure"));
    await expect(inspectPayPalOrderForAdminCancellation({ ...input, fetchImpl })).rejects.toThrow("network failure");
  });
  it.each([
    { id: "WRONG-ORDER", purchase_units: [{ custom_id: input.localOrderId }] },
    { purchase_units: [{ custom_id: input.localOrderId }] },
    { id: input.orderId, purchase_units: [{ custom_id: "unrelated-order" }] },
    { id: input.orderId, purchase_units: [{ reference_id: input.localOrderId }] },
    { id: input.orderId },
    { id: input.orderId, purchase_units: [] },
    { id: input.orderId, purchase_units: null },
    { id: input.orderId, purchase_units: [{ custom_id: input.localOrderId }, { custom_id: "other" }] },
  ])("rejects VOIDED with missing or mismatched binding: %j", async (identity) => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ access_token: "access-token" }))
      .mockResolvedValueOnce(jsonResponse({ status: "VOIDED", ...identity }));
    await expect(inspectPayPalOrderForAdminCancellation({ ...input, fetchImpl }))
      .rejects.toThrow("PayPal order identity mismatch");
  });
  it.each([
    { captures: [{ status: "COMPLETED" }] },
    { captures: [{ status: "PENDING" }] },
    null, {}, [], "", false, 0,
    { captures: [] }, { captures: null }, { authorizations: [] },
  ].map((payments) => ({ payments })))("rejects bound VOIDED with any payments property: %j", async ({ payments }) => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ access_token: "access-token" }))
      .mockResolvedValueOnce(jsonResponse({
        id: input.orderId, status: "VOIDED",
        purchase_units: [{ custom_id: input.localOrderId, payments }],
      }));
    await expect(inspectPayPalOrderForAdminCancellation({ ...input, fetchImpl }))
      .rejects.toThrow("PayPal order contains payment evidence");
  });

  it("rejects ambiguous lookup absence, including inaccessible merchant orders", async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ access_token: "access-token" }))
      .mockResolvedValueOnce(jsonResponse({ name: "RESOURCE_NOT_FOUND" }, 404));

    await expect(inspectPayPalOrderForAdminCancellation({ ...input, fetchImpl }))
      .rejects.toThrow("PayPal order lookup failed");
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
