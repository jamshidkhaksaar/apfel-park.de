const MAX_PAYPAL_WEBHOOK_BYTES = 1024 * 1024;
const PAYPAL_CERT_HOSTS = new Set([
  "api.paypal.com",
  "api.sandbox.paypal.com",
  "www.paypal.com",
  "www.sandbox.paypal.com",
]);

export const validatePayPalWebhookEnvelope = ({
  headers,
  bodyBytes,
  eventId,
  eventType,
}: {
  headers: Headers;
  bodyBytes: number;
  eventId: unknown;
  eventType: unknown;
}): boolean => {
  if (!Number.isFinite(bodyBytes) || bodyBytes <= 0 || bodyBytes > MAX_PAYPAL_WEBHOOK_BYTES) return false;
  if (typeof eventId !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(eventId)) return false;
  if (typeof eventType !== "string" || !/^[A-Z0-9._-]{1,160}$/.test(eventType)) return false;
  const required = [
    "paypal-auth-algo",
    "paypal-cert-url",
    "paypal-transmission-id",
    "paypal-transmission-sig",
    "paypal-transmission-time",
  ];
  if (required.some((name) => !headers.get(name)?.trim())) return false;
  try {
    const cert = new URL(headers.get("paypal-cert-url") as string);
    return cert.protocol === "https:" && PAYPAL_CERT_HOSTS.has(cert.hostname);
  } catch {
    return false;
  }
};
