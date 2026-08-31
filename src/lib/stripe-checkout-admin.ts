import { classifyStripeCheckoutSession } from "./checkout-reconciliation";

type StripeCheckoutSession = {
  status?: string;
  payment_status?: string;
  error?: { message?: string };
};

export type StripeCheckoutExpirationResult =
  | { outcome: "expired"; providerStatus: string }
  | { outcome: "protected"; providerStatus: string };

const parseSession = async (response: Response): Promise<StripeCheckoutSession> => {
  try {
    return (await response.json()) as StripeCheckoutSession;
  } catch {
    return {};
  }
};

export async function expireStripeCheckoutSessionForAdmin({
  sessionId,
  orderId,
  secretKey,
  fetchImpl = fetch,
}: {
  sessionId: string;
  orderId: string;
  secretKey: string;
  fetchImpl?: typeof fetch;
}): Promise<StripeCheckoutExpirationResult> {
  const url = `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`;
  const headers = { Authorization: `Bearer ${secretKey}` };
  const lookup = await fetchImpl(url, {
    headers,
    signal: AbortSignal.timeout(15_000),
  });
  let session = await parseSession(lookup);
  if (!lookup.ok) {
    throw new Error(session.error?.message || "Stripe Checkout Session lookup failed");
  }

  let action = classifyStripeCheckoutSession({
    status: session.status,
    paymentStatus: session.payment_status,
  });
  if (action === "protect") {
    return { outcome: "protected", providerStatus: session.status || "complete" };
  }
  if (action === "release") {
    return { outcome: "expired", providerStatus: session.status || "expired" };
  }
  if (action !== "expire") {
    throw new Error(`Stripe Checkout Session has unsupported state ${session.status || "unknown"}`);
  }

  const expired = await fetchImpl(`${url}/expire`, {
    method: "POST",
    headers: {
      ...headers,
      "Idempotency-Key": `admin_expire_${orderId}`,
    },
    signal: AbortSignal.timeout(15_000),
  });
  session = await parseSession(expired);
  if (!expired.ok) {
    throw new Error(session.error?.message || "Stripe Checkout Session expiration failed");
  }

  action = classifyStripeCheckoutSession({
    status: session.status,
    paymentStatus: session.payment_status,
  });
  if (action === "release") {
    return { outcome: "expired", providerStatus: session.status || "expired" };
  }
  if (action === "protect") {
    return { outcome: "protected", providerStatus: session.status || "complete" };
  }
  throw new Error(`Stripe Checkout Session remained ${session.status || "unknown"}`);
}
