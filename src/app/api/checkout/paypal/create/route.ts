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

type PayPalCreatePayload = {
  items?: CartInputItem[];
  customer?: CustomerDetails;
  shippingMethod?: string;
  locale?: "de" | "en";
  idempotencyKey?: string;
  conditionConsent?: boolean;
  termsConsent?: boolean;
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
  try {
    const payload = (await request.json()) as PayPalCreatePayload;
    const locale = payload.locale === "en" ? "en" : "de";
    const shippingMethod = normalizeShippingMethod(payload.shippingMethod);
    const customer = normalizeCheckoutCustomer(payload.customer, shippingMethod, locale);
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

    const token = await getAccessToken();
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

    const origin = getCheckoutBaseUrl();
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
            amount: {
              currency_code: cart.currency,
              value: cart.totalAmount.toFixed(2),
              breakdown: {
                item_total: { currency_code: cart.currency, value: cart.subtotalAmount.toFixed(2) },
                shipping: { currency_code: cart.currency, value: cart.shippingAmount.toFixed(2) },
                tax_total: { currency_code: cart.currency, value: "0.00" },
              },
            },
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
              return_url: `${origin}/${locale}/checkout/success?order_id=${order.id}&provider=paypal`,
              cancel_url: `${origin}/${locale}/checkout/cancel?order_id=${order.id}&provider=paypal`,
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
    if (!response.ok || !data.id) {
      await markOrderCancelled({
        provider: "paypal",
        orderId: order.id,
        providerStatus: "order_creation_failed",
      });
      return NextResponse.json(
        { success: false, error: data.message || "PayPal order could not be created" },
        { status: 502 },
      );
    }

    await attachProviderReference({
      orderId: order.id,
      provider: "paypal",
      providerOrderId: data.id,
      providerStatus: data.status || "CREATED",
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      paypalOrderId: data.id,
      approveUrl: data.links?.find((link) => link.rel === "payer-action" || link.rel === "approve")?.href ?? null,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "PayPal checkout could not be started" },
      { status: 400 },
    );
  }
}
