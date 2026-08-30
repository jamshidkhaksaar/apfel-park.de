import { NextRequest, NextResponse } from "next/server";

import {
  attachProviderReference,
  buildConditionConsent,
  createPendingOrder,
  getCheckoutBaseUrl,
  getPaymentMode,
  markOrderCancelled,
  normalizeCheckoutCustomer,
  normalizeShippingMethod,
  validateCartItems,
  type CartInputItem,
  type CustomerDetails,
} from "@/lib/checkout";
import { applyCouponToValidatedCart } from "@/lib/coupon-repository";
import { buildPayPalDiscountedAmount } from "@/lib/payment-coupon";
import { consumePublicRateLimit } from "@/lib/public-rate-limit";
import { createCheckoutReturnToken } from "@/lib/checkout-return-token";
import { CHECKOUT_RETURN_COOKIE, createCheckoutReturnSession, getCheckoutReturnCookieOptions } from "@/lib/checkout-return-session";

type PayPalCreatePayload = {
  items?: CartInputItem[];
  customer?: CustomerDetails;
  shippingMethod?: string;
  locale?: "de" | "en";
  idempotencyKey?: string;
  conditionConsent?: boolean;
  termsConsent?: boolean;
  couponCode?: string;
};

const getPayPalBaseUrl = () =>
  getPaymentMode() === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

const getAccessToken = async () => {
  const clientId = process.env.PAYPAL_CLIENT_ID?.trim();
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) throw new Error("PayPal is not configured");

  const response = await fetch(`${getPayPalBaseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    signal: AbortSignal.timeout(10000),
  });

  const data = (await response.json()) as { access_token?: string; error_description?: string };
  if (!response.ok || !data.access_token) {
    throw new Error(data.error_description || "Could not authenticate with PayPal");
  }
  return data.access_token;
};

export async function POST(request: NextRequest) {
  const limit = await consumePublicRateLimit(request.headers, "checkout_create", 8, 15 * 60);
  if (!limit.allowed) return NextResponse.json({ success: false, error: "Too many checkout attempts" }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });
  let pendingOrderId: string | null = null;
  let providerRequestStarted = false;
  let remoteOrderId: string | null = null;
  try {
    const payload = (await request.json()) as PayPalCreatePayload;
    const locale = payload.locale === "en" ? "en" : "de";
    const shippingMethod = normalizeShippingMethod(payload.shippingMethod);
    const customer = normalizeCheckoutCustomer(payload.customer, shippingMethod, locale);
    let cart = await validateCartItems(payload.items ?? [], shippingMethod);
    if(payload.couponCode?.trim()){const applied=await applyCouponToValidatedCart(payload.couponCode,cart);if(!applied.ok)return NextResponse.json({success:false,error:applied.error},{status:400});cart=applied.cart;}

    const hasNonNewItems = cart.items.some((line) => line.condition !== "new");
    if (hasNonNewItems && payload.conditionConsent !== true) {
      return NextResponse.json(
        {
          success: false,
          error:
            locale === "de"
              ? "Bitte bestätigen Sie den Gerätezustand der Open-Box-/Gebrauchtartikel."
              : "Please confirm the device condition of the open-box/used items.",
        },
        { status: 400 },
      );
    }

    // §312j BGB: the order may only be placed after the customer accepted the
    // AGB and the Widerrufsbelehrung; the client checkbox alone is not enough.
    if (payload.termsConsent !== true) {
      return NextResponse.json(
        {
          success: false,
          error:
            locale === "de"
              ? "Bitte akzeptieren Sie die AGB und die Widerrufsbelehrung."
              : "Please accept the terms and conditions and the withdrawal policy.",
        },
        { status: 400 },
      );
    }

    const order = await createPendingOrder({
      cart,
      customer,
      provider: "paypal",
      locale,
      idempotencyKey: payload.idempotencyKey,
      consentMode: request.cookies.get("apfel-consent")?.value ?? null,
      conditionConsent: buildConditionConsent(cart, true),
      termsConsentAt: new Date().toISOString(),
    });
    pendingOrderId = order.id;
    const returnToken = createCheckoutReturnToken(order.id);
    const token = await getAccessToken();

    const origin = getCheckoutBaseUrl();
    if (!(await attachProviderReference({ orderId: order.id, provider: "paypal", providerStatus: "paypal_order_requesting" }))) throw new Error("PayPal request state could not be recorded");
    providerRequestStarted = true;
    const response = await fetch(`${getPayPalBaseUrl()}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "PayPal-Request-Id": order.id,
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: order.id,
            invoice_id: order.orderNumber ? `A-${order.orderNumber}` : order.id,
            custom_id: order.id,
            amount: buildPayPalDiscountedAmount(cart),
            items: cart.items.map((item) => ({
              name: item.title.slice(0, 127),
              sku: item.sku || item.productId,
              quantity: String(item.quantity),
              category: "PHYSICAL_GOODS",
              unit_amount: { currency_code: cart.currency, value: item.unitAmount.toFixed(2) },
            })),
          },
        ],
        payment_source: {
          paypal: {
            experience_context: {
              brand_name: "Apfel Park",
              locale: locale === "de" ? "de-DE" : "en-US",
              landing_page: "LOGIN",
              user_action: "PAY_NOW",
              return_url: `${origin}/api/checkout/return/${locale}?order_id=${order.id}&provider=paypal&return_token=${encodeURIComponent(returnToken)}`,
              cancel_url: `${origin}/${locale}/checkout/cancel`,
            },
          },
        },
      }),
      signal: AbortSignal.timeout(10000),
    });

    const data = (await response.json()) as {
      id?: string;
      status?: string;
      links?: Array<{ href: string; rel: string }>;
      message?: string;
    };
    remoteOrderId = data.id ?? null;
    if (!response.ok || !data.id) {
      const indeterminate = response.status >= 500 || response.ok || Boolean(data.id);
      if (indeterminate) {
        const attached = await attachProviderReference({ orderId: order.id, provider: "paypal", providerOrderId: data.id ?? null, providerStatus: "paypal_order_outcome_unknown" });
        if (!attached) throw new Error("Indeterminate PayPal order could not be recorded");
      } else {
        await markOrderCancelled({ provider: "paypal", orderId: order.id, providerStatus: "order_creation_failed" });
      }
      return NextResponse.json(
        { success: false, error: data.message || "PayPal order could not be created" },
        { status: indeterminate ? 503 : 502 },
      );
    }

    const attached = await attachProviderReference({
      orderId: order.id,
      provider: "paypal",
      providerOrderId: data.id,
      providerStatus: data.status || "CREATED",
    });
    if (!attached) throw new Error("PayPal order could not be bound to the local order");

    const result = NextResponse.json({
      success: true,
      orderId: order.id,
      paypalOrderId: data.id,
      approveUrl: data.links?.find((link) => link.rel === "payer-action" || link.rel === "approve")?.href ?? null,
    });
    result.cookies.set(CHECKOUT_RETURN_COOKIE, createCheckoutReturnSession(order.id, returnToken, data.id), getCheckoutReturnCookieOptions());
    return result;
  } catch (error) {
    if (pendingOrderId) {
      try {
        if (remoteOrderId) {
          if (!(await attachProviderReference({ orderId: pendingOrderId, provider: "paypal", providerOrderId: remoteOrderId, providerStatus: "provider_response_recovered" }))) throw new Error("PayPal response binding conflict");
        } else if (!providerRequestStarted) {
          await markOrderCancelled({ provider: "paypal", orderId: pendingOrderId, providerStatus: "provider_request_failed" });
        } else {
          if (!(await attachProviderReference({ orderId: pendingOrderId, provider: "paypal", providerStatus: "paypal_order_outcome_unknown" }))) throw new Error("PayPal unknown outcome could not be recorded");
        }
      } catch (cleanupError) {
        console.error("PayPal checkout recovery failed", { orderId: pendingOrderId, error: cleanupError instanceof Error ? cleanupError.message : "recovery failed" });
      }
    }
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "PayPal checkout could not be started" },
      { status: 400 },
    );
  }
}
