import { describe, expect, it } from "vitest";

import { analyticsPageContext, analyticsPagePath } from "@/lib/analytics-url";

describe("analytics page path", () => {
  it("strips sensitive mixed-case query fields from the full URL and referrer", () => {
    const context = analyticsPageContext('/de/checkout/success', new URLSearchParams({
      returnToken: 'sensitive', PayerID: 'payer', EMAIL: 'buyer@example.com', customerName: 'Buyer', utm_source: 'google',
    }), 'https://apfel-park.de', 'https://payments.example/return?token=private#secret');
    expect(context).toEqual({
      page_path: '/de/checkout/success?utm_source=google',
      page_location: 'https://apfel-park.de/de/checkout/success?utm_source=google',
      page_referrer: 'https://payments.example/return',
    });
  });
  it('handles an absent or invalid referrer without breaking page views', () => {
    expect(analyticsPageContext('/de/store', new URLSearchParams(), 'https://apfel-park.de').page_referrer).toBe('');
    expect(analyticsPageContext('/de/store', new URLSearchParams(), 'https://apfel-park.de', 'javascript:alert(1)').page_referrer).toBe('');
  });
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
