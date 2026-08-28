import { NextRequest, NextResponse } from "next/server";

import {
  attachProviderReference,
  buildConditionConsent,
  createPendingOrder,
  getCheckoutBaseUrl,
  markOrderCancelled,
  normalizeCheckoutCustomer,
  normalizeShippingMethod,
  validateCartItems,
  type CartInputItem,
  type CustomerDetails,
} from "@/lib/checkout";
import { applyCouponToValidatedCart } from "@/lib/coupon-repository";
import { buildStripeCouponForm } from "@/lib/payment-coupon";
import { consumePublicRateLimit } from "@/lib/public-rate-limit";

const stripeRequestId = (response: Response) => response.headers.get("request-id") || undefined;

const STRIPE_API_URL = "https://api.stripe.com/v1/checkout/sessions";

type StripeCheckoutPayload = {
  items?: CartInputItem[];
  customer?: CustomerDetails;
  shippingMethod?: string;
  locale?: "de" | "en";
  idempotencyKey?: string;
  conditionConsent?: boolean;
  termsConsent?: boolean;
  couponCode?: string;
};

export async function POST(request: NextRequest) {
  const limit = await consumePublicRateLimit(request.headers, "checkout_create", 8, 15 * 60);
  if (!limit.allowed) return NextResponse.json({ success: false, error: "Too many checkout attempts" }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });
  let pendingOrderId: string | null = null;
  let providerRequestStarted = false;
  let remoteSessionId: string | null = null;
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
    if (!secretKey) {
      return NextResponse.json({ success: false, error: "Stripe is not configured" }, { status: 503 });
    }

    const payload = (await request.json()) as StripeCheckoutPayload;
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
      provider: "stripe",
      locale,
      idempotencyKey: payload.idempotencyKey,
      consentMode: request.cookies.get("apfel-consent")?.value ?? null,
      conditionConsent: buildConditionConsent(cart, true),
      termsConsentAt: new Date().toISOString(),
    });
    pendingOrderId = order.id;

    const origin = getCheckoutBaseUrl();
    const form = new URLSearchParams({
      mode: "payment",
      success_url: `${origin}/${locale}/checkout/success?order_id=${order.id}&provider=stripe&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/${locale}/checkout/cancel?order_id=${order.id}&provider=stripe`,
      customer_email: customer.email,
      client_reference_id: order.id,
      "metadata[order_id]": order.id,
      "metadata[order_number]": order.orderNumber ? String(order.orderNumber) : "",
      "automatic_tax[enabled]": "false",
      "payment_intent_data[metadata][order_id]": order.id,
    });

    if ((cart.discountAmountCents ?? 0) > 0) {
      const couponForm = buildStripeCouponForm(cart, order.id);
      const couponResponse = await fetch("https://api.stripe.com/v1/coupons", { method: "POST", headers: { Authorization: "Bearer " + secretKey, "Content-Type": "application/x-www-form-urlencoded", "Idempotency-Key": `coupon_${order.id}` }, body: couponForm, signal: AbortSignal.timeout(10_000) });
      const coupon = await couponResponse.json() as { id?: string; error?: { message?: string } };
      if (!couponResponse.ok || !coupon.id) { await markOrderCancelled({ provider: "stripe", orderId: order.id, providerStatus: "coupon_creation_failed" }); return NextResponse.json({ success: false, error: coupon.error?.message || "Discount could not be applied" }, { status: 502 }); }
      form.set("discounts[0][coupon]", coupon.id);
    }

    cart.items.forEach((item, index) => {
      form.set(`line_items[${index}][quantity]`, String(item.quantity));
      form.set(`line_items[${index}][price_data][currency]`, cart.currency.toLowerCase());
      form.set(`line_items[${index}][price_data][unit_amount]`, String(item.unitAmountCents));
      form.set(`line_items[${index}][price_data][product_data][name]`, item.title);
      form.set(`line_items[${index}][price_data][product_data][metadata][product_id]`, item.productId);
      if (item.sku) {
        form.set(`line_items[${index}][price_data][product_data][metadata][sku]`, item.sku);
      }
    });

    if (cart.shippingAmountCents > 0) {
      const index = cart.items.length;
      form.set(`line_items[${index}][quantity]`, "1");
      form.set(`line_items[${index}][price_data][currency]`, cart.currency.toLowerCase());
      form.set(`line_items[${index}][price_data][unit_amount]`, String(cart.shippingAmountCents));
      form.set(
        `line_items[${index}][price_data][product_data][name]`,
        locale === "de" ? "Versand innerhalb Deutschlands" : "Shipping within Germany",
      );
    }

    if (!(await attachProviderReference({ orderId: order.id, provider: "stripe", providerStatus: "stripe_checkout_requesting" }))) throw new Error("Stripe Checkout request state could not be recorded");
    providerRequestStarted = true;
    const response = await fetch(STRIPE_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "Idempotency-Key": order.id,
      },
      body: form,
      signal: AbortSignal.timeout(10000),
    });

    const data = (await response.json()) as { id?: string; url?: string; error?: { message?: string } };
    remoteSessionId = data.id ?? null;
    if (!response.ok || !data.id || !data.url) {
      console.error("Stripe Checkout Session failed", {
        orderId: order.id,
        status: response.status,
        requestId: stripeRequestId(response),
        error: data.error?.message || "missing session id or URL",
      });
      const indeterminate = response.status >= 500 || response.ok || Boolean(data.id);
      if (indeterminate) {
        const attached = await attachProviderReference({ orderId: order.id, provider: "stripe", providerSessionId: data.id ?? null, providerStatus: "stripe_checkout_outcome_unknown" });
        if (!attached) throw new Error("Indeterminate Stripe Checkout Session could not be recorded");
      } else {
        await markOrderCancelled({ provider: "stripe", orderId: order.id, providerStatus: "checkout_creation_failed" });
      }
      return NextResponse.json(
        { success: false, error: data.error?.message || "Stripe checkout could not be created" },
        { status: indeterminate ? 503 : 502 },
      );
    }

    const attached = await attachProviderReference({
      orderId: order.id,
      provider: "stripe",
      providerSessionId: data.id,
      providerStatus: "checkout_created",
    });
    if (!attached) throw new Error("Stripe Checkout Session could not be bound to the local order");

    return NextResponse.json({ success: true, checkoutUrl: data.url, orderId: order.id });
  } catch (error) {
    if (pendingOrderId) {
      try {
        if (remoteSessionId) {
          if (!(await attachProviderReference({ orderId: pendingOrderId, provider: "stripe", providerSessionId: remoteSessionId, providerStatus: "provider_response_recovered" }))) throw new Error("Stripe Checkout response binding conflict");
        } else if (!providerRequestStarted) {
          await markOrderCancelled({ provider: "stripe", orderId: pendingOrderId, providerStatus: "provider_request_failed" });
        } else {
          if (!(await attachProviderReference({ orderId: pendingOrderId, provider: "stripe", providerStatus: "stripe_checkout_outcome_unknown" }))) throw new Error("Stripe Checkout unknown outcome could not be recorded");
        }
      } catch (cleanupError) {
        console.error("Stripe Checkout recovery failed", { orderId: pendingOrderId, error: cleanupError instanceof Error ? cleanupError.message : "recovery failed" });
      }
    }
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Checkout could not be started" },
      { status: 400 },
    );
  }
}
