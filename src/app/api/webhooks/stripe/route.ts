import { NextRequest, NextResponse } from "next/server";

import { markOrderCancelled, markOrderPaid, recordWebhookEvent, verifyStripeSignature } from "@/lib/checkout";
import { sendPurchaseTrackingEvents } from "@/lib/marketing";

type StripeEvent = {
  id: string;
  type: string;
  data: {
    object: {
      id: string;
      client_reference_id?: string;
      payment_status?: string;
      status?: string;
      payment_intent?: string;
      metadata?: Record<string, string>;
    };
  };
};

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: "Stripe webhook is not configured" }, { status: 503 });
  }

  const payload = await request.text();
  const signature = request.headers.get("stripe-signature") ?? "";
  if (!verifyStripeSignature(payload, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(payload) as StripeEvent;
  const isNew = await recordWebhookEvent({
    provider: "stripe",
    eventId: event.id,
    eventType: event.type,
    payload: event,
  });
  if (!isNew) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  const session = event.data.object;
  const orderId = session.metadata?.order_id || session.client_reference_id || null;

  if (event.type === "checkout.session.completed" && session.payment_status === "paid") {
    const order = await markOrderPaid({
      orderId,
      provider: "stripe",
      providerSessionId: session.id,
      providerPaymentId: session.payment_intent || session.id,
      providerStatus: session.payment_status,
    });

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
  }

  // The embedded Payment Element pays a PaymentIntent directly; there is no
  // Checkout Session, so the hosted-flow branch above never fires for it.
  if (event.type === "payment_intent.succeeded") {
    const order = await markOrderPaid({
      orderId,
      provider: "stripe",
      providerOrderId: session.id,
      providerPaymentId: session.id,
      providerStatus: "succeeded",
    });

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
  }

  // A failed intent must release the stock it reserved, otherwise an abandoned
  // attempt keeps the item unsellable.
  if (event.type === "payment_intent.payment_failed" || event.type === "payment_intent.canceled") {
    await markOrderCancelled({
      orderId,
      provider: "stripe",
      providerOrderId: session.id,
      providerStatus: event.type === "payment_intent.canceled" ? "canceled" : "payment_failed",
    });
  }

  if (event.type === "checkout.session.expired") {
    await markOrderCancelled({
      orderId,
      provider: "stripe",
      providerSessionId: session.id,
      providerStatus: session.status || "expired",
    });
  }

  return NextResponse.json({ received: true });
}

