import { describe, expect, it } from "vitest";

import { analyticsPagePath } from "@/lib/analytics-url";

describe("analytics page path", () => {
  it("removes checkout capabilities and order identifiers", () => {
    const path = analyticsPagePath("/de/checkout/success", new URLSearchParams({
      order_id: "order-secret",
      return_token: "capability-secret",
      token: "paypal-secret",
      session_id: "stripe-secret",
      provider: "stripe",
      campaign: "summer",
    }));
    expect(path).toBe("/de/checkout/success?campaign=summer");
  });

  it("preserves ordinary storefront parameters", () => {
    expect(analyticsPagePath("/de/store", new URLSearchParams({ q: "iphone", page: "2" }))).toBe("/de/store?q=iphone&page=2");
  });
});
