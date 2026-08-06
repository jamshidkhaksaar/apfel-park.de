import { NextResponse, type NextRequest } from "next/server";

import {
  buildConditionConsent,
  createPendingOrder,
  attachProviderReference,
  normalizeShippingMethod,
  validateCartItems,
  type CartInputItem,
  type CustomerDetails,
} from "@/lib/checkout";
import { isValidEmail, sanitizeInput } from "@/lib/security";

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
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
    if (!secretKey) {
      return NextResponse.json({ success: false, error: "Stripe is not configured" }, { status: 503 });
    }

    const payload = (await request.json()) as IntentPayload;
    const locale = payload.locale === "en" ? "en" : "de";
    const shippingMethod = normalizeShippingMethod(payload.shippingMethod);
    const customer = normalizeCustomer(payload.customer);
    const cart = await validateCartItems(payload.items ?? [], shippingMethod);

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

    const form = new URLSearchParams({
      amount: String(cart.totalAmountCents),
      currency: cart.currency.toLowerCase(),
      "automatic_payment_methods[enabled]": "true",
      receipt_email: customer.email,
      description: `Apfel Park ${order.orderNumber ? `#A-${order.orderNumber}` : order.id}`,
      "metadata[order_id]": order.id,
      "metadata[order_number]": order.orderNumber ? String(order.orderNumber) : "",
    });

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

    if (!response.ok || !intent.client_secret || !intent.id) {
      console.error("Stripe PaymentIntent failed:", intent.error?.message);
      return NextResponse.json(
        { success: false, error: locale === "de" ? "Zahlung konnte nicht gestartet werden." : "Payment could not be started." },
        { status: 502 },
      );
    }

    await attachProviderReference({
      orderId: order.id,
      provider: "stripe",
      providerOrderId: intent.id,
      providerStatus: "requires_payment_method",
    });

    return NextResponse.json({
      success: true,
      clientSecret: intent.client_secret,
      orderId: order.id,
    });
  } catch (error) {
    console.error("Create payment intent failed:", error);
    const message = error instanceof Error ? error.message : "Payment intent failed";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
