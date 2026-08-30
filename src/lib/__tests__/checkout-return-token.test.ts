import { describe, expect, it } from "vitest";

import {
  createCheckoutReturnToken,
  verifyCheckoutReturnToken,
} from "@/lib/checkout-return-token";

const secret = "test-secret-that-is-long-enough-for-hmac";
const orderId = "11111111-1111-4111-8111-111111111111";

describe("checkout return capability", () => {
  it("accepts a valid token only for its bound order", () => {
    const token = createCheckoutReturnToken(orderId, {
      secret,
      nowSeconds: 1_000,
      ttlSeconds: 3_600,
    });

    expect(verifyCheckoutReturnToken(orderId, token, { secret, nowSeconds: 2_000 })).toBe(true);
    expect(
      verifyCheckoutReturnToken("22222222-2222-4222-8222-222222222222", token, {
        secret,
        nowSeconds: 2_000,
      }),
    ).toBe(false);
  });

  it("rejects expired, malformed, and differently signed tokens", () => {
    const token = createCheckoutReturnToken(orderId, {
      secret,
      nowSeconds: 1_000,
      ttlSeconds: 60,
    });

    expect(verifyCheckoutReturnToken(orderId, token, { secret, nowSeconds: 1_061 })).toBe(false);
    expect(verifyCheckoutReturnToken(orderId, "not-a-token", { secret, nowSeconds: 1_001 })).toBe(false);
    expect(
      verifyCheckoutReturnToken(orderId, token, {
        secret: "another-test-secret-that-is-long-enough",
        nowSeconds: 1_001,
      }),
    ).toBe(false);
  });

  it("does not embed the order id in the capability", () => {
    const token = createCheckoutReturnToken(orderId, {
      secret,
      nowSeconds: 1_000,
      ttlSeconds: 60,
    });

    expect(token).not.toContain(orderId);
  });
});
