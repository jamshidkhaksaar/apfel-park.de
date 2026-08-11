import { NextRequest, NextResponse } from "next/server";

import {
  attachProviderReference,
  getOrderAmountCents,
  markOrderCancelled,
  markOrderPaid,
  recordWebhookEvent,
  verifyStripeSignature,
} from "@/lib/checkout";
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
      /** Checkout Session total, in cents. */
      amount_total?: number;
      /** PaymentIntent amount, in cents. */
      amount?: number;
      currency?: string;
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

  /**
   * A paid event must carry the amount the order is actually for.
   *
   * Fails open when the event carries no amount at all, so an unexpected
   * payload shape can never strand a real payment; it only refuses when an
   * amount is present and disagrees with the order.
   */
  const amountMatchesOrder = async (): Promise<boolean> => {
    const claimed = session.amount_total ?? session.amount;
    if (typeof claimed !== "number" || !orderId) return true;
    const expected = await getOrderAmountCents(orderId);
    if (expected === null) return true;
    if (claimed === expected) return true;
    console.error("Stripe webhook amount mismatch -- refusing to mark paid", {
      orderId,
      eventId: event.id,
      eventType: event.type,
      claimedCents: claimed,
      expectedCents: expected,
    });
    return false;
  };

  if (event.type === "checkout.session.completed" && session.payment_status === "paid" && (await amountMatchesOrder())) {
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
  if (event.type === "payment_intent.succeeded" && (await amountMatchesOrder())) {
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

  // A failed confirmation is retryable on the same PaymentIntent, so keep the
  // order and its stock reservation intact. Releasing here could oversell the
  // product if the customer's next confirmation succeeds.
  if (
    orderId &&
    (event.type === "payment_intent.payment_failed" || event.type === "payment_intent.processing")
  ) {
    await attachProviderReference({
      orderId,
      provider: "stripe",
      providerOrderId: session.id,
      providerStatus: event.type === "payment_intent.processing" ? "processing" : "payment_failed",
    });
  }

  // Cancellation is terminal, so it is safe to release the reservation.
  if (event.type === "payment_intent.canceled") {
    await markOrderCancelled({
      orderId,
      provider: "stripe",
      providerOrderId: session.id,
      providerStatus: "canceled",
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

