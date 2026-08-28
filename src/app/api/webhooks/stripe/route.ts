import { NextRequest, NextResponse } from "next/server";

import {
  attachProviderReference,
  claimWebhookEvent,
  completeWebhookEvent,
  getOrderPaymentExpectation,
  isOrderInProviderState,
  markOrderCancelled,
  markOrderPaid,
  markOrderRefunded,
  releaseWebhookEventClaim,
  verifyStripeSignature,
} from "@/lib/checkout";
import { sendPurchaseTrackingEvents } from "@/lib/marketing";
import { notifyPaidOrderAdmin } from "@/lib/order-notifications";

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
      /** Charge fields, used by refund events. */
      amount_refunded?: number;
      refunded?: boolean;
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

  let event: StripeEvent;
  try {
    event = JSON.parse(payload) as StripeEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const session = event.data.object;
  const orderId = session.metadata?.order_id || session.client_reference_id || null;
  const isPaidEvent =
    (event.type === "checkout.session.completed" && session.payment_status === "paid") ||
    event.type === "payment_intent.succeeded";
  const sendOrderNotification = async () => {
    if (!orderId || !isPaidEvent) return false;
    const result = await notifyPaidOrderAdmin(orderId);
    return result.status === "failed";
  };


  /**
   * A paid event must carry the amount the order is actually for.
   *
   * Missing amount, currency, order id, or order lookup all fail closed.
   */
  const amountMatchesOrder = async (): Promise<boolean> => {
    const claimed = session.amount_total ?? session.amount;
    if (typeof claimed !== "number" || !orderId || typeof session.currency !== "string") return false;
    const expected = await getOrderPaymentExpectation(orderId);
    if (!expected) return false;
    if (claimed === expected.cents && session.currency.toUpperCase() === expected.currency) return true;
    console.error("Stripe webhook amount mismatch -- refusing to mark paid", {
      orderId,
      eventId: event.id,
      eventType: event.type,
      claimedCents: claimed,
      expectedCents: expected.cents,
      claimedCurrency: session.currency,
      expectedCurrency: expected.currency,
    });
    return false;
  };

  if (isPaidEvent && !(await amountMatchesOrder())) {
    return NextResponse.json({ error: "Stripe amount or currency mismatch" }, { status: 400 });
  }

  const claim = await claimWebhookEvent({ provider: "stripe", eventId: event.id, eventType: event.type, payload: event });
  if (claim.status === "processed") {
    if (await sendOrderNotification()) return NextResponse.json({ error: "Order notification delivery failed" }, { status: 503 });
    return NextResponse.json({ received: true, duplicate: true });
  }
  if (claim.status === "busy") {
    return NextResponse.json({ error: "Stripe event is already processing" }, { status: 503, headers: { "Retry-After": "5" } });
  }
  let notificationFailed = false;
  try {

  if (event.type === "checkout.session.completed" && session.payment_status === "paid") {
    const order = await markOrderPaid({
      orderId,
      provider: "stripe",
      providerSessionId: session.id,
      providerPaymentId: session.payment_intent || session.id,
      providerStatus: session.payment_status,
    });
    if (!order && !(await isOrderInProviderState({ provider: "stripe", orderId, providerSessionId: session.id, statuses: ["paid"], paymentStatuses: ["paid"] }))) {
      throw new Error("Stripe Checkout paid event did not match a local order");
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
    if (!order && !(await isOrderInProviderState({ provider: "stripe", orderId, providerOrderId: session.id, statuses: ["paid"], paymentStatuses: ["paid"] }))) {
      throw new Error("Stripe PaymentIntent paid event did not match a local order");
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

  // A failed confirmation is retryable on the same PaymentIntent, so keep the
  // order and its stock reservation intact. Releasing here could oversell the
  // product if the customer's next confirmation succeeds.
  if (
    orderId &&
    (event.type === "payment_intent.payment_failed" || event.type === "payment_intent.processing")
  ) {
    const attached = await attachProviderReference({
      orderId,
      provider: "stripe",
      providerOrderId: session.id,
      providerStatus: event.type === "payment_intent.processing" ? "processing" : "payment_failed",
    });
    if (!attached) throw new Error("Stripe PaymentIntent status event did not match a local order");
  }

  // Cancellation is terminal, so it is safe to release the reservation.
  if (event.type === "payment_intent.canceled") {
    const cancelledOrderId = await markOrderCancelled({
      orderId,
      provider: "stripe",
      providerOrderId: session.id,
      providerStatus: "canceled",
    });
    if (!cancelledOrderId && !(await isOrderInProviderState({ provider: "stripe", orderId, providerOrderId: session.id, statuses: ["cancelled"] }))) {
      throw new Error("Stripe PaymentIntent cancellation did not match a local order");
    }
  }

  // Stripe fires charge.refunded for both full and partial refunds; `refunded`
  // is true only when the whole charge is back with the customer.
  if (event.type === "charge.refunded") {
    const fullyRefunded = session.refunded === true
      || (typeof session.amount === "number" && session.amount_refunded === session.amount);
    const refundedCount = await markOrderRefunded({
      orderId,
      provider: "stripe",
      providerOrderId: session.payment_intent ?? null,
      providerStatus: fullyRefunded ? "refunded" : "partially_refunded",
      fullyRefunded,
    });
    const expectedPaymentStatus = fullyRefunded ? "refunded" : "partially_refunded";
    if (refundedCount === 0 && !(await isOrderInProviderState({ provider: "stripe", orderId, providerOrderId: session.payment_intent ?? null, paymentStatuses: [expectedPaymentStatus] }))) {
      throw new Error("Stripe refund did not match a local order");
    }
  }

  if (event.type === "checkout.session.expired") {
    const cancelledOrderId = await markOrderCancelled({
      orderId,
      provider: "stripe",
      providerSessionId: session.id,
      providerStatus: session.status || "expired",
    });
    if (!cancelledOrderId && !(await isOrderInProviderState({ provider: "stripe", orderId, providerSessionId: session.id, statuses: ["cancelled"] }))) {
      throw new Error("Stripe Checkout expiration did not match a local order");
    }
  }

  await completeWebhookEvent("stripe", event.id, claim.token);
  } catch (error) {
    await releaseWebhookEventClaim("stripe", event.id, claim.token, error);
    console.error("Stripe webhook processing failed", { eventId: event.id, eventType: event.type });
    return NextResponse.json({ error: "Stripe webhook processing failed" }, { status: 503 });
  }

  if (notificationFailed) {
    return NextResponse.json({ error: "Order notification delivery failed" }, { status: 503 });
  }

  return NextResponse.json({ received: true });
}

