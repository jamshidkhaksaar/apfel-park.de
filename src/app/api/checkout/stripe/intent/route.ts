import { NextResponse, type NextRequest } from "next/server";

import {
  buildConditionConsent,
  createPendingOrder,
  attachProviderReference,
  markOrderCancelled,
  normalizeCheckoutCustomer,
  normalizeShippingMethod,
  validateCartItems,
  type CartInputItem,
  type CustomerDetails,
} from "@/lib/checkout";
import { applyCouponToValidatedCart } from "@/lib/coupon-repository";
import { getPaymentIntentAmount } from "@/lib/payment-coupon";
import { consumePublicRateLimit } from "@/lib/public-rate-limit";
import { createCheckoutReturnToken } from "@/lib/checkout-return-token";
import { CHECKOUT_RETURN_COOKIE, createCheckoutReturnSession, getCheckoutReturnCookieOptions } from "@/lib/checkout-return-session";

const stripeRequestId = (response: Response) => response.headers.get("request-id") || undefined;

export const dynamic = "force-dynamic";

const STRIPE_INTENT_URL = "https://api.stripe.com/v1/payment_intents";

type IntentPayload = {
  items?: CartInputItem[];
  customer?: CustomerDetails;
  shippingMethod?: string;
  locale?: "de" | "en";
  idempotencyKey?: string;
  conditionConsent?: boolean;
  termsConsent?: boolean;
  couponCode?: string;
};

/**
 * Creates a PaymentIntent for the embedded Payment Element.
 *
 * This is the on-site sibling of the hosted Checkout Session route: same
 * validation, same createPendingOrder call, same inventory reservation and the
 * same order id in metadata, so the existing Stripe webhook marks the order
 * paid without knowing which flow produced it. The Element gets card plus the
 * wallets (Apple Pay, Google Pay, Link) that automatic_payment_methods enables
 * for the account, without the redirect the hosted page requires.
 */
export async function POST(request: NextRequest) {
  const limit = await consumePublicRateLimit(request.headers, "checkout_create", 8, 15 * 60);
  if (!limit.allowed) return NextResponse.json({ success: false, error: "Too many checkout attempts" }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });
  let pendingOrderId: string | null = null;
  let providerRequestStarted = false;
  let remoteIntentId: string | null = null;
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
    if (!secretKey) {
      return NextResponse.json({ success: false, error: "Stripe is not configured" }, { status: 503 });
    }

    const payload = (await request.json()) as IntentPayload;
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
      provider: "stripe",
      locale,
      idempotencyKey: payload.idempotencyKey,
      consentMode: request.cookies.get("apfel-consent")?.value ?? null,
      conditionConsent: buildConditionConsent(cart, true),
      termsConsentAt: new Date().toISOString(),
    });
    pendingOrderId = order.id;
    const returnToken = createCheckoutReturnToken(order.id);

    const form = new URLSearchParams({
      amount: String(getPaymentIntentAmount(cart)),
      currency: cart.currency.toLowerCase(),
      "automatic_payment_methods[enabled]": "true",
      receipt_email: customer.email,
      description: `Apfel Park ${order.orderNumber ? `#A-${order.orderNumber}` : order.id}`,
      "metadata[order_id]": order.id,
      "metadata[order_number]": order.orderNumber ? String(order.orderNumber) : "",
    });

    if (!(await attachProviderReference({ orderId: order.id, provider: "stripe", providerStatus: "stripe_intent_requesting" }))) throw new Error("Stripe PaymentIntent request state could not be recorded");
    providerRequestStarted = true;
    const response = await fetch(STRIPE_INTENT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
        // Same key as the order, so a double submit reuses one intent.
        "Idempotency-Key": `pi_${order.id}`,
      },
      body: form.toString(),
      signal: AbortSignal.timeout(10_000),
    });

    const intent = (await response.json()) as {
      id?: string;
      client_secret?: string;
      error?: { message?: string };
    };
    remoteIntentId = intent.id ?? null;

    if (!response.ok || !intent.client_secret || !intent.id) {
      console.error("Stripe PaymentIntent failed", {
        orderId: order.id,
        status: response.status,
        requestId: stripeRequestId(response),
        error: intent.error?.message || "missing intent id or client secret",
      });
      const indeterminate = response.status >= 500 || response.ok || Boolean(intent.id);
      if (indeterminate) {
        const attached = await attachProviderReference({ orderId: order.id, provider: "stripe", providerOrderId: intent.id ?? null, providerStatus: "stripe_intent_outcome_unknown" });
        if (!attached) throw new Error("Indeterminate Stripe PaymentIntent could not be recorded");
      } else {
        await markOrderCancelled({ provider: "stripe", orderId: order.id, providerStatus: "intent_creation_failed" });
      }
      return NextResponse.json(
        { success: false, error: locale === "de" ? "Zahlung konnte nicht gestartet werden." : "Payment could not be started." },
        { status: indeterminate ? 503 : 502 },
      );
    }

    const attached = await attachProviderReference({
      orderId: order.id,
      provider: "stripe",
      providerOrderId: intent.id,
      providerStatus: "requires_payment_method",
    });
    if (!attached) throw new Error("Stripe PaymentIntent could not be bound to the local order");

    const result = NextResponse.json({
      success: true,
      clientSecret: intent.client_secret,
      orderId: order.id,
    });
    result.cookies.set(CHECKOUT_RETURN_COOKIE, createCheckoutReturnSession(order.id, returnToken), getCheckoutReturnCookieOptions());
    return result;
  } catch (error) {
    if (pendingOrderId) {
      try {
        if (remoteIntentId) {
          if (!(await attachProviderReference({ orderId: pendingOrderId, provider: "stripe", providerOrderId: remoteIntentId, providerStatus: "provider_response_recovered" }))) throw new Error("Stripe PaymentIntent response binding conflict");
        } else if (!providerRequestStarted) {
          await markOrderCancelled({ provider: "stripe", orderId: pendingOrderId, providerStatus: "provider_request_failed" });
        } else {
          if (!(await attachProviderReference({ orderId: pendingOrderId, provider: "stripe", providerStatus: "stripe_intent_outcome_unknown" }))) throw new Error("Stripe PaymentIntent unknown outcome could not be recorded");
        }
      } catch (cleanupError) {
        console.error("Stripe PaymentIntent recovery failed", { orderId: pendingOrderId, error: cleanupError instanceof Error ? cleanupError.message : "recovery failed" });
      }
    }
    console.error("Create payment intent failed", {
      error: error instanceof Error ? error.message : "Payment intent failed",
    });
    const message = error instanceof Error ? error.message : "Payment intent failed";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
