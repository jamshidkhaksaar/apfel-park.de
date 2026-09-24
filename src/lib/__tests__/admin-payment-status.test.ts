import { describe, expect, it } from "vitest";

import { getAdminPaymentStatus } from "../admin-payment-status";

describe("getAdminPaymentStatus", () => {
  it("shows the missing PayPal approval for an unpaid order", () => {
    const result = getAdminPaymentStatus({
      status: "pending", payment_status: "unpaid", provider: "paypal",
      provider_status: "PAYER_ACTION_REQUIRED",
    }, "en");
    expect(result.label).toBe("Unpaid · Awaiting PayPal approval");
  });

  it("shows a card decline for a failed order", () => {
    const result = getAdminPaymentStatus({
      status: "cancelled", payment_status: "failed", provider: "stripe",
      provider_status: "canceled", decline_code: "card_velocity_exceeded",
    }, "en");
    expect(result.label).toBe("Unpaid · Card declined");
    expect(result.detail).toBe("card velocity exceeded");
  });

  it("prioritizes a successful payment over an earlier decline", () => {
    const result = getAdminPaymentStatus({
      status: "paid", payment_status: "paid", provider: "stripe",
      provider_status: "succeeded", decline_code: "card_declined",
    }, "en");
    expect(result.label).toBe("Paid");
  });
});
