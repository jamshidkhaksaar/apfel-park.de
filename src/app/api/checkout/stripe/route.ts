import { NextRequest, NextResponse } from "next/server";

import {
  attachProviderReference,
  createPendingOrder,
  getCheckoutBaseUrl,
  normalizeShippingMethod,
  validateCartItems,
  type CartInputItem,
  type CustomerDetails,
} from "@/lib/checkout";
import { isValidEmail, sanitizeInput } from "@/lib/security";

const STRIPE_API_URL = "https://api.stripe.com/v1/checkout/sessions";

type StripeCheckoutPayload = {
  items?: CartInputItem[];
  customer?: CustomerDetails;
  shippingMethod?: string;
  locale?: "de" | "en";
  idempotencyKey?: string;
};

const normalizeCustomer = (customer?: CustomerDetails): CustomerDetails => {
  const name = sanitizeInput(customer?.name ?? "");
  const email = sanitizeInput(customer?.email ?? "").toLowerCase();
  const phone = customer?.phone ? sanitizeInput(customer.phone) : null;
  const address = customer?.address
    ? {
        line1: sanitizeInput(customer.address.line1 ?? ""),
        line2: sanitizeInput(customer.address.line2 ?? ""),
        postalCode: sanitizeInput(customer.address.postalCode ?? ""),
        city: sanitizeInput(customer.address.city ?? ""),
        country: sanitizeInput(customer.address.country ?? "DE") || "DE",
      }
    : null;

  if (!name || !isValidEmail(email)) {
    throw new Error("Valid customer name and email are required");
  }

  return { name, email, phone, address };
};

export async function POST(request: NextRequest) {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
    if (!secretKey) {
      return NextResponse.json({ success: false, error: "Stripe is not configured" }, { status: 503 });
    }

    const payload = (await request.json()) as StripeCheckoutPayload;
    const locale = payload.locale === "en" ? "en" : "de";
    const shippingMethod = normalizeShippingMethod(payload.shippingMethod);
    const customer = normalizeCustomer(payload.customer);
    const cart = await validateCartItems(payload.items ?? [], shippingMethod);
    const order = await createPendingOrder({
      cart,
      customer,
      provider: "stripe",
      locale,
      idempotencyKey: payload.idempotencyKey,
      consentMode: request.cookies.get("apfel-consent")?.value ?? null,
    });

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

    const response = await fetch(STRIPE_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form,
      signal: AbortSignal.timeout(10000),
    });

    const data = (await response.json()) as { id?: string; url?: string; error?: { message?: string } };
    if (!response.ok || !data.id || !data.url) {
      return NextResponse.json(
        { success: false, error: data.error?.message || "Stripe checkout could not be created" },
        { status: 502 },
      );
    }

    await attachProviderReference({
      orderId: order.id,
      provider: "stripe",
      providerSessionId: data.id,
      providerStatus: "checkout_created",
    });

    return NextResponse.json({ success: true, checkoutUrl: data.url, orderId: order.id });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Checkout could not be started" },
      { status: 400 },
    );
  }
}
