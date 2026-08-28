import { NextRequest, NextResponse } from "next/server";

import {
  claimWebhookEvent,
  completeWebhookEvent,
  getOrderPaymentExpectation,
  getPaymentMode,
  isOrderInProviderState,
  markOrderCancelled,
  markOrderPaid,
  releaseWebhookEventClaim,
} from "@/lib/checkout";
import { sendPurchaseTrackingEvents } from "@/lib/marketing";
import { notifyPaidOrderAdmin } from "@/lib/order-notifications";

type PayPalWebhookEvent = {
  id: string;
  event_type: string;
  resource?: {
    id?: string;
    status?: string;
    amount?: { value?: string; currency_code?: string };
    custom_id?: string;
    invoice_id?: string;
    supplementary_data?: {
      related_ids?: {
        order_id?: string;
      };
    };
    purchase_units?: Array<{
      reference_id?: string;
      custom_id?: string;
      payments?: { captures?: Array<{ id?: string; status?: string }> };
    }>;
  };
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
  const data = (await response.json()) as { access_token?: string };
  if (!response.ok || !data.access_token) throw new Error("Could not authenticate with PayPal");
  return data.access_token;
};

const verifyWebhook = async (request: NextRequest, body: PayPalWebhookEvent) => {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID?.trim();
  if (!webhookId) return false;

  const token = await getAccessToken();
  const response = await fetch(`${getPayPalBaseUrl()}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      auth_algo: request.headers.get("paypal-auth-algo"),
      cert_url: request.headers.get("paypal-cert-url"),
      transmission_id: request.headers.get("paypal-transmission-id"),
      transmission_sig: request.headers.get("paypal-transmission-sig"),
      transmission_time: request.headers.get("paypal-transmission-time"),
      webhook_id: webhookId,
      webhook_event: body,
    }),
    signal: AbortSignal.timeout(10000),
  });
  const data = (await response.json()) as { verification_status?: string };
  return response.ok && data.verification_status === "SUCCESS";
};

export async function POST(request: NextRequest) {
  if (!process.env.PAYPAL_WEBHOOK_ID?.trim()) {
    return NextResponse.json({ error: "PayPal webhook verification is not configured" }, { status: 503 });
  }

  const event = (await request.json()) as PayPalWebhookEvent;
  const verified = await verifyWebhook(request, event);
  if (!verified) {
    return NextResponse.json({ error: "Invalid PayPal webhook signature" }, { status: 400 });
  }

  const resource = event.resource;
  const orderId =
    resource?.custom_id ||
    resource?.purchase_units?.[0]?.reference_id ||
    resource?.purchase_units?.[0]?.custom_id ||
    null;
  const isPaidEvent = event.event_type === "PAYMENT.CAPTURE.COMPLETED";
  const sendOrderNotification = async () => {
    if (!orderId || !isPaidEvent) return false;
    const result = await notifyPaidOrderAdmin(orderId);
    return result.status === "failed";
  };

  const paypalOrderId = resource?.supplementary_data?.related_ids?.order_id || resource?.id || null;
  const capture = resource?.purchase_units?.[0]?.payments?.captures?.[0];
  if (isPaidEvent) {
    const expected = orderId ? await getOrderPaymentExpectation(orderId) : null;
    const capturedCents = resource?.amount?.value ? Math.round(Number(resource.amount.value) * 100) : null;
    if (!expected || capturedCents !== expected.cents || resource?.amount?.currency_code?.toUpperCase() !== expected.currency) {
      return NextResponse.json({ error: "PayPal amount or currency mismatch" }, { status: 400 });
    }
  }
  const claim = await claimWebhookEvent({ provider: "paypal", eventId: event.id, eventType: event.event_type, payload: event });
  if (claim.status === "processed") {
    if (await sendOrderNotification()) return NextResponse.json({ error: "Order notification delivery failed" }, { status: 503 });
    return NextResponse.json({ received: true, duplicate: true });
  }
  if (claim.status === "busy") {
    return NextResponse.json({ error: "PayPal event is already processing" }, { status: 503, headers: { "Retry-After": "5" } });
  }
  let notificationFailed = false;
  try {

  if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
    const order = await markOrderPaid({
      orderId,
      provider: "paypal",
      providerOrderId: paypalOrderId,
      providerPaymentId: capture?.id || resource?.id || paypalOrderId,
      providerStatus: capture?.status || resource?.status || "COMPLETED",
    });
    if (!order && !(await isOrderInProviderState({ provider: "paypal", orderId, providerOrderId: paypalOrderId, statuses: ["paid"], paymentStatuses: ["paid"] }))) {
      throw new Error("PayPal paid event did not match a local order");
    }

    if (order) {
      await sendPurchaseTrackingEvents(
        {
          eventId: `purchase-${order.id}`,
          orderId: order.id,
          email: order.customer_email,
          firstName: order.customer_name,
          value: Number(order.total_amount),
          currency: order.currency || "EUR",
          items: Array.isArray(order.items) ? order.items : [],
        },
        {
          consentMode: order.consent_mode,
          url: "https://apfel-park.de/checkout/success",
        },
      );
    }
    notificationFailed = await sendOrderNotification();
  }

  if (event.event_type === "CHECKOUT.ORDER.VOIDED" || event.event_type === "PAYMENT.CAPTURE.DENIED") {
    const cancelledOrderId = await markOrderCancelled({
      orderId,
      provider: "paypal",
      providerOrderId: paypalOrderId,
      providerStatus: resource?.status || event.event_type,
    });
    if (!cancelledOrderId && !(await isOrderInProviderState({ provider: "paypal", orderId, providerOrderId: paypalOrderId, statuses: ["cancelled"] }))) {
      throw new Error("PayPal cancellation event did not match a local order");
    }
  }

  await completeWebhookEvent("paypal", event.id, claim.token);
  } catch (error) {
    await releaseWebhookEventClaim("paypal", event.id, claim.token, error);
    console.error("PayPal webhook processing failed", { eventId: event.id, eventType: event.event_type });
    return NextResponse.json({ error: "PayPal webhook processing failed" }, { status: 503 });
  }

  if (notificationFailed) {
    return NextResponse.json({ error: "Order notification delivery failed" }, { status: 503 });
  }

  return NextResponse.json({ received: true });
}
