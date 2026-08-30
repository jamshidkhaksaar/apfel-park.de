import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

import { GET } from "@/app/api/checkout/return/[locale]/route";
import { CHECKOUT_RETURN_COOKIE, createCheckoutReturnSession } from "@/lib/checkout-return-session";
import { createCheckoutReturnToken } from "@/lib/checkout-return-token";

const secret = "test-secret-that-is-long-enough-for-hmac";
const orderId = "11111111-1111-4111-8111-111111111111";
let previousSecret: string | undefined;
let previousSiteUrl: string | undefined;

beforeEach(() => {
  previousSecret = process.env.CHECKOUT_RETURN_SECRET;
  previousSiteUrl = process.env.SITE_URL;
  process.env.CHECKOUT_RETURN_SECRET = secret;
  process.env.SITE_URL = "https://apfel-park.de";
});

afterEach(() => {
  if (previousSecret === undefined) delete process.env.CHECKOUT_RETURN_SECRET;
  else process.env.CHECKOUT_RETURN_SECRET = previousSecret;
  if (previousSiteUrl === undefined) delete process.env.SITE_URL;
  else process.env.SITE_URL = previousSiteUrl;
});

describe("checkout return exchange", () => {
  it("authorizes from the existing cookie and redirects to a clean success URL", async () => {
    const token = createCheckoutReturnToken(orderId, { secret, ttlSeconds: 600 });
    const request = new NextRequest(`https://apfel-park.de/api/checkout/return/de?order_id=${orderId}&provider=stripe`, {
      headers: { Cookie: `${CHECKOUT_RETURN_COOKIE}=${createCheckoutReturnSession(orderId, token)}` },
    });
    const response = await GET(request, { params: Promise.resolve({ locale: "de" }) });
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(`https://apfel-park.de/de/checkout/success?order_id=${orderId}&provider=stripe`);
    expect(request.url).not.toContain(token);
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("keeps the PayPal order token out of the clean redirect", async () => {
    const token = createCheckoutReturnToken(orderId, { secret, ttlSeconds: 600 });
    const request = new NextRequest(`https://apfel-park.de/api/checkout/return/de?order_id=${orderId}&provider=paypal&token=PAYPAL_ORDER_123`, {
      headers: { Cookie: `${CHECKOUT_RETURN_COOKIE}=${createCheckoutReturnSession(orderId, token, "PAYPAL_ORDER_123")}` },
    });
    const response = await GET(request, { params: Promise.resolve({ locale: "de" }) });
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(`https://apfel-park.de/de/checkout/success?order_id=${orderId}&provider=paypal`);
    expect(response.headers.get("location")).not.toContain("PAYPAL_ORDER_123");
    expect(request.url).not.toContain(token);
  });
});
