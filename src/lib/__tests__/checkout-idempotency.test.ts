import { describe, expect, it } from "vitest";

import { createCheckoutFingerprint } from "../checkout-idempotency";

const base = {
  provider: "stripe" as const,
  locale: "de" as const,
  customer: { email: "Buyer@Example.com", name: "Buyer", phone: null, address: null },
  cart: {
    shippingMethod: "pickup" as const,
    currency: "EUR",
    subtotalAmountCents: 10000,
    shippingAmountCents: 0,
    totalAmountCents: 9000,
    vatAmountCents: 1437,
    couponCode: "SAVE10",
    campaignId: "campaign-1",
    discountAmountCents: 1000,
    items: [
      { productId: "p1", sku: "SKU-1", variantColor: null, variantStorage: null, quantity: 1, unitAmountCents: 10000, lineAmountCents: 10000 },
    ],
  },
};

describe("createCheckoutFingerprint", () => {
  it("changes when an equal-total request changes product, customer, provider, or coupon", () => {
    const original = createCheckoutFingerprint(base);
    expect(createCheckoutFingerprint({ ...base, cart: { ...base.cart, items: [{ ...base.cart.items[0], productId: "p2", sku: "SKU-2" }] } })).not.toBe(original);
    expect(createCheckoutFingerprint({ ...base, customer: { ...base.customer, email: "other@example.com" } })).not.toBe(original);
    expect(createCheckoutFingerprint({ ...base, provider: "paypal" })).not.toBe(original);
    expect(createCheckoutFingerprint({ ...base, cart: { ...base.cart, couponCode: "OTHER" } })).not.toBe(original);
  });

  it("normalizes email and item order without changing identity", () => {
    const twoItems = { ...base, cart: { ...base.cart, items: [...base.cart.items, { ...base.cart.items[0], productId: "p2", sku: "SKU-2" }] } };
    const reordered = { ...twoItems, customer: { ...twoItems.customer, email: "buyer@example.com" }, cart: { ...twoItems.cart, items: [...twoItems.cart.items].reverse() } };
    expect(createCheckoutFingerprint(reordered)).toBe(createCheckoutFingerprint(twoItems));
  });
});
