export type PayPalAdminCancellationInspection =
  | { outcome: "cancelable"; providerStatus: string }
  | { outcome: "active"; providerStatus: string }
  | { outcome: "protected"; providerStatus: string };

type PayPalOrderSnapshot = {
  id?: string;
  purchase_units?: Array<{ custom_id?: string }>;
  status?: string;
  name?: string;
  message?: string;
};

const parseJson = async (response: Response): Promise<PayPalOrderSnapshot & { access_token?: string }> => {
  try {
    return (await response.json()) as PayPalOrderSnapshot & { access_token?: string };
  } catch {
    return {};
  }
};

export async function inspectPayPalOrderForAdminCancellation({
  orderId,
  localOrderId,
  clientId,
  clientSecret,
  mode,
  fetchImpl = fetch,
}: {
  orderId: string;
  localOrderId: string;
  clientId: string;
  clientSecret: string;
  mode: "live" | "sandbox";
  fetchImpl?: typeof fetch;
}): Promise<PayPalAdminCancellationInspection> {
  const baseUrl = mode === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
  const tokenResponse = await fetchImpl(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    signal: AbortSignal.timeout(15_000),
  });
  const tokenPayload = await parseJson(tokenResponse);
  if (!tokenResponse.ok || !tokenPayload.access_token) {
    throw new Error(tokenPayload.message || "PayPal authentication failed");
  }

  const lookup = await fetchImpl(
    `${baseUrl}/v2/checkout/orders/${encodeURIComponent(orderId)}`,
    {
      headers: { Authorization: `Bearer ${tokenPayload.access_token}` },
      signal: AbortSignal.timeout(15_000),
    },
  );
  const order = await parseJson(lookup);
  // Absence can mean wrong merchant credentials; it is not terminal evidence.
  if (!lookup.ok) {
    throw new Error(order.message || "PayPal order lookup failed");
  }

  const providerStatus = order.status || "UNKNOWN";
  if (providerStatus === "COMPLETED") {
    return { outcome: "protected", providerStatus };
  }
  if (providerStatus === "VOIDED") {
    // Checkout creates exactly one purchase unit with custom_id = local order UUID.
    if (!orderId || !localOrderId || order.id !== orderId
      || !Array.isArray(order.purchase_units) || order.purchase_units.length !== 1
      || order.purchase_units[0]?.custom_id !== localOrderId) {
      throw new Error("PayPal order identity mismatch");
    }
    // Even empty or malformed payments contradict capture-free terminal evidence.
    if ("payments" in order.purchase_units[0]) {
      throw new Error("PayPal order contains payment evidence");
    }
    return { outcome: "cancelable", providerStatus };
  }
  if (["CREATED", "PAYER_ACTION_REQUIRED", "APPROVED"].includes(providerStatus)) {
    return { outcome: "active", providerStatus };
  }
  throw new Error(`PayPal order has unsupported state ${providerStatus}`);
}
