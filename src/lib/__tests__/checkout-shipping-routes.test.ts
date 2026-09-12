import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { POST as stripeIntent } from "@/app/api/checkout/stripe/intent/route";
import { POST as stripeCheckout } from "@/app/api/checkout/stripe/route";
import { POST as paypalCreate } from "@/app/api/checkout/paypal/create/route";
import { createPendingOrder, validateCartItems } from "../checkout";

vi.mock("@/lib/coupon-repository", () => ({ applyCouponToValidatedCart: vi.fn() }));
vi.mock("@/lib/checkout-return-token", () => ({ createCheckoutReturnToken: vi.fn() }));
vi.mock("@/lib/checkout-return-session", () => ({
  CHECKOUT_RETURN_COOKIE: "fixture", createCheckoutReturnSession: vi.fn(), getCheckoutReturnCookieOptions: vi.fn(),
}));
vi.mock("@/lib/public-rate-limit", () => ({
  consumePublicRateLimit: vi.fn().mockResolvedValue({ allowed: true }),
}));
vi.mock("@/lib/db", () => ({ query: vi.fn(), withTransaction: vi.fn() }));
vi.mock("@/lib/checkout", async (importOriginal) => ({
  ...await importOriginal<typeof import("../checkout")>(),
  validateCartItems: vi.fn().mockRejectedValue(new Error("test cart boundary")),
  createPendingOrder: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_fixture_only");
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network forbidden in shipping tests")));
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe.each([
  ["Stripe PaymentIntent", stripeIntent],
  ["Stripe Checkout", stripeCheckout],
  ["PayPal create", paypalCreate],
] as const)("%s shipping validation", (_name, post) => {
  it.each([
    { country: "FR", postalCode: "21109", error: "Germany" },
    { country: "DE", postalCode: "21A09", error: "delivery address" },
  ])("rejects $country / $postalCode before cart, order or provider work", async ({ country, postalCode, error }) => {
    const response = await post(new NextRequest("https://example.test/api/checkout", {
      method: "POST",
      body: JSON.stringify({
        locale: "en", shippingMethod: "germany",
        customer: { name: "Customer", email: "customer@example.com",
          address: { line1: "Teststraße 1", city: "Hamburg", country, postalCode } },
      }),
    }));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ success: false, error: expect.stringContaining(error) });
    expect(validateCartItems).not.toHaveBeenCalled();
    expect(createPendingOrder).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });
});
