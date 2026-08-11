import { describe, expect, it } from "vitest";

import { buildStripePaymentReturnUrl } from "@/lib/stripe";

describe("buildStripePaymentReturnUrl", () => {
  it("returns the embedded payment to the correct localized order confirmation", () => {
    expect(
      buildStripePaymentReturnUrl(
        "https://apfel-park.de",
        "de",
        "a7a617e2-d7bd-4d37-baaa-51a806523875",
      ),
    ).toBe(
      "https://apfel-park.de/de/checkout/success?order_id=a7a617e2-d7bd-4d37-baaa-51a806523875&provider=stripe",
    );
  });

  it("does not depend on whether the origin has a trailing slash", () => {
    expect(buildStripePaymentReturnUrl("https://apfel-park.de/", "en", "order-1")).toBe(
      "https://apfel-park.de/en/checkout/success?order_id=order-1&provider=stripe",
    );
  });
});
