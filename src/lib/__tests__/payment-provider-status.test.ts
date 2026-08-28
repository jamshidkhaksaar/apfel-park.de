import { describe, expect, it } from "vitest";

import { resolveStripeConfiguration } from "../payment-provider-status";

describe("Stripe provider configuration", () => {
  it("treats secret plus webhook as ready for hosted Checkout", () => {
    expect(resolveStripeConfiguration({ secret: "sk_live_test", webhook: "whsec_test", publishable: "" })).toEqual({
      ready: true,
      webhookConfigured: true,
      publishableConfigured: false,
      checkoutMode: "hosted",
    });
  });

  it("reports embedded mode when the optional publishable key exists", () => {
    expect(resolveStripeConfiguration({ secret: "sk_live_test", webhook: "whsec_test", publishable: "pk_live_test" }).checkoutMode).toBe("embedded");
  });

  it("fails closed when the secret or webhook is missing", () => {
    expect(resolveStripeConfiguration({ secret: "", webhook: "whsec_test", publishable: "pk_live_test" }).ready).toBe(false);
    expect(resolveStripeConfiguration({ secret: "sk_live_test", webhook: "", publishable: "pk_live_test" }).ready).toBe(false);
  });
});
