import { NextRequest, NextResponse } from "next/server";

import { getPaymentMode, markOrderPaid } from "@/lib/checkout";
import { sendPurchaseTrackingEvents } from "@/lib/marketing";

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
    const payload = (await request.json()) as { orderId?: string; paypalOrderId?: string };
    if (!payload.orderId || !payload.paypalOrderId) {
      return NextResponse.json({ success: false, error: "Missing order reference" }, { status: 400 });
    }

    const token = await getAccessToken();
    const response = await fetch(`${getPayPalBaseUrl()}/v2/checkout/orders/${payload.paypalOrderId}/capture`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "PayPal-Request-Id": `${payload.orderId}-capture`,
      },
      signal: AbortSignal.timeout(10000),
    });

    const data = (await response.json()) as {
      id?: string;
      status?: string;
      purchase_units?: Array<{
        reference_id?: string;
        custom_id?: string;
        payments?: { captures?: Array<{ id?: string; status?: string }> };
      }>;
      message?: string;
    };

    if (!response.ok || data.status !== "COMPLETED") {
      return NextResponse.json(
        { success: false, error: data.message || "PayPal payment was not completed" },
        { status: 400 },
      );
    }

    const purchaseUnit = data.purchase_units?.[0];
    if (purchaseUnit?.reference_id !== payload.orderId && purchaseUnit?.custom_id !== payload.orderId) {
      return NextResponse.json(
        { success: false, error: "PayPal payment does not match this order" },
        { status: 400 },
      );
    }

    const capture = purchaseUnit.payments?.captures?.[0];
    const order = await markOrderPaid({
      orderId: payload.orderId,
      provider: "paypal",
      providerOrderId: payload.paypalOrderId,
      providerPaymentId: capture?.id ?? data.id ?? payload.paypalOrderId,
      providerStatus: capture?.status ?? data.status,
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

    return NextResponse.json({ success: true, orderId: payload.orderId });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "PayPal capture failed" },
      { status: 400 },
    );
  }
}
