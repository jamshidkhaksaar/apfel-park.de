import { afterEach, describe, expect, it, vi } from "vitest";

import { updateOrderFulfillment } from "@/app/admin/orders/actions";
import { query } from "../db";
import { markOrderCancelled } from "../checkout";

vi.mock("next/navigation", () => ({ redirect: (url: string) => { throw new Error(`redirect:${url}`); } }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/admin-auth", () => ({ canManageOrders: () => true }));
vi.mock("@/lib/admin-auth-server", () => ({
  createAdminServerClient: async () => ({ auth: { getUser: async () => ({ data: { user: { id: "admin-fixture" } }, error: null }) } }),
}));
vi.mock("@/lib/db", () => ({ query: vi.fn(), withTransaction: vi.fn() }));
vi.mock("@/lib/checkout", () => ({
  markOrderCancelled: vi.fn(), attachProviderReference: vi.fn(),
  getPaymentMode: vi.fn(), isOrderInProviderState: vi.fn(),
}));
vi.mock("@/lib/marketplaces", () => ({ enqueueMarketplaceJob: vi.fn() }));
vi.mock("@/lib/order-notifications", () => ({ notifyPaidOrderAdmin: vi.fn() }));

afterEach(() => { vi.clearAllMocks(); vi.unstubAllGlobals(); });

describe("admin cancellation of retryable Stripe PaymentIntents", () => {
  it.each(["payment_failed", "failed"])("blocks %s before cancellation or inventory release", async (providerStatus) => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network forbidden in cancellation tests")));
    vi.mocked(query).mockResolvedValueOnce({ rows: [{
      status: "pending", payment_status: "unpaid", provider: "stripe",
      provider_order_id: "pi_retryable", provider_session_id: null,
      provider_status: providerStatus, updated_at: "2026-09-04 00:00:00.123456+00",
    }] } as Awaited<ReturnType<typeof query>>);
    const form = new FormData();
    form.set("id", "11111111-1111-4111-8111-111111111111");
    form.set("status", "cancelled");
    await expect(updateOrderFulfillment(form)).rejects.toThrow("redirect:/admin/orders?error=provider_active");
    expect(markOrderCancelled).not.toHaveBeenCalled();
    expect(query).toHaveBeenCalledTimes(1);
    expect(fetch).not.toHaveBeenCalled();
  });
});
