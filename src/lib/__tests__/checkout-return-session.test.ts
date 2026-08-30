import { describe, expect, it } from "vitest";

import {
  createCheckoutReturnSession,
  readCheckoutReturnSession,
} from "@/lib/checkout-return-session";
import { createCheckoutReturnToken } from "@/lib/checkout-return-token";

const secret = "test-secret-that-is-long-enough-for-hmac";
const orderId = "11111111-1111-4111-8111-111111111111";

describe("checkout return session", () => {
  it("exchanges a valid signed capability for an order-bound cookie value", () => {
    const token = createCheckoutReturnToken(orderId, { secret, nowSeconds: 1000, ttlSeconds: 600 });
    const value = createCheckoutReturnSession(orderId, token);
    expect(readCheckoutReturnSession(value, { secret, nowSeconds: 1200 })).toEqual({ orderId, token, paypalOrderId: null });
    expect(readCheckoutReturnSession(value, { secret, nowSeconds: 1700 })).toBeNull();
  });

  it("rejects malformed and order-tampered cookie values", () => {
    expect(readCheckoutReturnSession("malformed", { secret, nowSeconds: 1000 })).toBeNull();
  });
});
