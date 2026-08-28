import { describe, expect, it } from "vitest";

import {
  buildPayPalDiscountedAmount,
  buildStripeCouponForm,
  getPaymentIntentAmount,
  paypalCaptureIdentityMatches,
  paypalCaptureRequestMatchesLocalOrder,

} from "../payment-coupon";

const cart = { currency: "EUR", subtotalAmount: 100, shippingAmount: 6.9, totalAmount: 96.9, totalAmountCents: 9690, discountAmount: 10, discountAmountCents: 1000, couponCode: "SAVE10" };

describe("provider coupon contracts", () => {
  it("builds PayPal's exact arithmetic breakdown", () => {
    expect(buildPayPalDiscountedAmount(cart)).toEqual({ currency_code: "EUR", value: "96.90", breakdown: { item_total: { currency_code: "EUR", value: "100.00" }, shipping: { currency_code: "EUR", value: "6.90" }, discount: { currency_code: "EUR", value: "10.00" }, tax_total: { currency_code: "EUR", value: "0.00" } } });
  });
  it("builds a one-time fixed Stripe coupon", () => {
    expect(Object.fromEntries(buildStripeCouponForm(cart, "order-1"))).toMatchObject({ duration: "once", amount_off: "1000", currency: "eur", name: "SAVE10", "metadata[order_id]": "order-1" });
  });
  it("uses the canonical total for PaymentIntent", () => expect(getPaymentIntentAmount(cart)).toBe(9690));
});

describe("paid provider identity and webhook processing", () => {
  it("requires PayPal order id, reference id, and custom id all to match", () => {
    expect(paypalCaptureIdentityMatches({ paypalOrderId: "pp-1", responseOrderId: "pp-1", referenceId: "local-1", customId: "local-1", localOrderId: "local-1" })).toBe(true);
    expect(paypalCaptureIdentityMatches({ paypalOrderId: "pp-1", responseOrderId: "pp-2", referenceId: "local-1", customId: "local-1", localOrderId: "local-1" })).toBe(false);
    expect(paypalCaptureIdentityMatches({ paypalOrderId: "pp-1", responseOrderId: "pp-1", referenceId: "local-1", customId: "other", localOrderId: "local-1" })).toBe(false);
    expect(paypalCaptureIdentityMatches({ paypalOrderId: "pp-1", responseOrderId: "pp-1", referenceId: "local-1", customId: undefined, localOrderId: "local-1" })).toBe(false);
  });
  it("rejects a PayPal capture before the provider call unless the local order is bound and eligible", () => {
    const eligible = { localProvider: "paypal", status: "pending", paymentStatus: "unpaid", storedProviderOrderId: "pp-1", paypalOrderId: "pp-1" };
    expect(paypalCaptureRequestMatchesLocalOrder(eligible)).toBe(true);
    expect(paypalCaptureRequestMatchesLocalOrder({ ...eligible, storedProviderOrderId: "pp-other" })).toBe(false);
    expect(paypalCaptureRequestMatchesLocalOrder({ ...eligible, localProvider: "stripe" })).toBe(false);
    expect(paypalCaptureRequestMatchesLocalOrder({ ...eligible, status: "cancelled" })).toBe(false);
    expect(paypalCaptureRequestMatchesLocalOrder({ ...eligible, paymentStatus: "paid" })).toBe(false);
  });

});
