import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { updateOrderFulfillment } from "@/app/admin/orders/actions";
import { query } from "../db";
import { attachProviderReference, getPaymentMode, isOrderInProviderState, markOrderCancelled } from "../checkout";

vi.mock("next/navigation", () => ({ redirect: (url: string) => { throw new Error(`redirect:${url}`); } }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/admin-auth", () => ({ canManageOrders: () => true }));
vi.mock("@/lib/admin-auth-server", () => ({
  createAdminServerClient: async () => ({ auth: { getUser: async () => ({ data: { user: { id: "admin-fixture" } }, error: null }) } }),
}));
vi.mock("@/lib/db", () => ({ query: vi.fn() }));
vi.mock("@/lib/checkout", () => ({
  markOrderCancelled: vi.fn(), attachProviderReference: vi.fn(),
  getPaymentMode: vi.fn(), isOrderInProviderState: vi.fn(),
}));
vi.mock("@/lib/security", () => ({ sanitizeInput: (value: unknown) => typeof value === "string" ? value.trim() : "" }));
vi.mock("@/lib/marketplaces", () => ({ enqueueMarketplaceJob: vi.fn() }));
vi.mock("@/lib/order-notifications", () => ({ notifyPaidOrderAdmin: vi.fn() }));

const localOrderId = "11111111-1111-4111-8111-111111111111";
const sourceToken = "2026-09-04 00:00:00.123456+00";
const attachedToken = "2026-09-04 00:00:00.654321+00";
const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const fetchMock = vi.fn<typeof fetch>();
const row = (paymentMode: unknown = "live") => ({
  status: "pending", payment_status: "unpaid", provider: "paypal",
  provider_order_id: "PAYPAL-ORDER-123", provider_session_id: null,
  provider_status: "CREATED", updated_at: sourceToken, metadata: { paymentMode },
});
const setRow = (value: object) => vi.mocked(query).mockResolvedValueOnce({ rows: [value] } as Awaited<ReturnType<typeof query>>);
const cancel = () => {
  const form = new FormData();
  form.set("id", localOrderId);
  form.set("status", "cancelled");
  return updateOrderFulfillment(form);
};
const expectReserved = () => {
  expect(attachProviderReference).not.toHaveBeenCalled();
  expect(markOrderCancelled).not.toHaveBeenCalled();
  expect(query).toHaveBeenCalledTimes(1);
};
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("PAYPAL_CLIENT_ID", "fixture-client");
  vi.stubEnv("PAYPAL_CLIENT_SECRET", "fixture-secret");
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockRejectedValue(new Error("Unexpected network request"));
  vi.mocked(getPaymentMode).mockReturnValue("live");
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("PayPal admin action cancellation", () => {
  it.each([
    ["ambiguous 404", { name: "RESOURCE_NOT_FOUND" }, 404, "provider_cancel_failed"],
    ["changed merchant credentials", { name: "NOT_AUTHORIZED" }, 403, "provider_cancel_failed"],
    ["remote capture before local settlement", { status: "COMPLETED" }, 200, "provider_paid"],
    ["still approved", { status: "APPROVED" }, 200, "provider_active"],
    ["unknown state", { status: "SURPRISE" }, 200, "provider_cancel_failed"],
    ["missing state", {}, 200, "provider_cancel_failed"],
    ["wrong provider id", { id: "WRONG", status: "VOIDED", purchase_units: [{ custom_id: localOrderId }] }, 200, "provider_cancel_failed"],
    ["wrong local binding", { id: "PAYPAL-ORDER-123", status: "VOIDED", purchase_units: [{ custom_id: "other" }] }, 200, "provider_cancel_failed"],
    ["missing identity", { status: "VOIDED" }, 200, "provider_cancel_failed"],
  ] as const)("retains reservation for %s", async (_name, payload, status, reason) => {
    setRow(row());
    fetchMock.mockResolvedValueOnce(jsonResponse({ access_token: "fixture-token" }))
      .mockResolvedValueOnce(jsonResponse(payload, status));
    await expect(cancel()).rejects.toThrow(`redirect:/admin/orders?error=${reason}`);
    expectReserved();
  });
  it.each(["COMPLETED", "PENDING"])("does not attach or cancel VOIDED with a %s capture", async (status) => {
    setRow(row());
    fetchMock.mockResolvedValueOnce(jsonResponse({ access_token: "fixture-token" }))
      .mockResolvedValueOnce(jsonResponse({
        id: "PAYPAL-ORDER-123", status: "VOIDED",
        purchase_units: [{ custom_id: localOrderId, payments: { captures: [{ status }] } }],
      }));
    // Make the unsafe path succeed so the test cannot pass on an attachment conflict.
    vi.mocked(attachProviderReference).mockResolvedValueOnce({ updatedAt: attachedToken });
    vi.mocked(markOrderCancelled).mockResolvedValueOnce(localOrderId);
    await expect(cancel()).rejects.toThrow("redirect:/admin/orders?error=provider_cancel_failed");
    expectReserved();
  });
  it.each([undefined, null, {}, { paymentMode: undefined }])("rejects absent persisted context %j before lookup", async (metadata) => {
    setRow({ ...row(), metadata });
    await expect(cancel()).rejects.toThrow("redirect:/admin/orders?error=provider_cancel_failed");
    expect(fetchMock).not.toHaveBeenCalled();
    expectReserved();
  });
  it("rejects an original live order under current sandbox configuration before lookup", async () => {
    setRow(row());
    vi.mocked(getPaymentMode).mockReturnValue("sandbox");
    await expect(cancel()).rejects.toThrow("redirect:/admin/orders?error=provider_cancel_failed");
    expect(fetchMock).not.toHaveBeenCalled();
    expectReserved();
  });
  it.each(["attachment", "cancellation"])("reports conflict when local state changes at %s", async (stage) => {
    setRow(row());
    fetchMock.mockResolvedValueOnce(jsonResponse({ access_token: "fixture-token" }))
      .mockResolvedValueOnce(jsonResponse({ id: "PAYPAL-ORDER-123", status: "VOIDED", purchase_units: [{ custom_id: localOrderId }] }));
    vi.mocked(attachProviderReference).mockResolvedValueOnce(stage === "attachment" ? null : { updatedAt: attachedToken });
    vi.mocked(markOrderCancelled).mockResolvedValueOnce(null);
    vi.mocked(isOrderInProviderState).mockResolvedValueOnce(false);
    await expect(cancel()).rejects.toThrow("redirect:/admin/orders?error=conflict");
    if (stage === "attachment") expect(markOrderCancelled).not.toHaveBeenCalled();
    else expect(markOrderCancelled).toHaveBeenCalledWith(expect.objectContaining({ expectedUpdatedAt: attachedToken }));
  });
  it("preserves the original microsecond text token on the existing local-only cancellation path", async () => {
    setRow({ ...row(), provider_order_id: null, provider_status: null });
    vi.mocked(markOrderCancelled).mockResolvedValueOnce(localOrderId);
    await expect(cancel()).rejects.toThrow("redirect:/admin/orders?updated=1");
    expect(markOrderCancelled).toHaveBeenCalledWith(expect.objectContaining({ expectedUpdatedAt: sourceToken }));
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("cancels only the bound VOIDED order using the exact attached timestamp token", async () => {
    setRow(row());
    fetchMock.mockResolvedValueOnce(jsonResponse({ access_token: "fixture-token" }))
      .mockResolvedValueOnce(jsonResponse({ id: "PAYPAL-ORDER-123", status: "VOIDED", purchase_units: [{ custom_id: localOrderId, reference_id: localOrderId }] }));
    vi.mocked(attachProviderReference).mockResolvedValueOnce({ updatedAt: attachedToken });
    vi.mocked(markOrderCancelled).mockResolvedValueOnce(localOrderId);
    await expect(cancel()).rejects.toThrow("redirect:/admin/orders?updated=1");
    expect(markOrderCancelled).toHaveBeenCalledWith(expect.objectContaining({
      orderId: localOrderId, providerStatus: "VOIDED", expectedProviderStatus: "VOIDED",
      expectedUpdatedAt: attachedToken, expectedStatus: "pending", expectedPaymentStatus: "unpaid",
      expectedProviderOrderId: "PAYPAL-ORDER-123", expectedProviderSessionId: null,
    }));
    expect(query).toHaveBeenCalledWith(expect.stringContaining("updated_at::text AS updated_at"), [localOrderId]);
    expect(query).toHaveBeenCalledWith(expect.stringContaining("metadata"), [localOrderId]);
  });
  it.each(["sandbox", null, "", "LIVE", "unknown"])("retains reservation without lookup for original mode %s", async (paymentMode) => {
    setRow(row(paymentMode));
    await expect(cancel()).rejects.toThrow("redirect:/admin/orders?error=provider_cancel_failed");
    expect(fetchMock).not.toHaveBeenCalled();
    expectReserved();
  });
});
