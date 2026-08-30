import { verifyCheckoutReturnToken } from "@/lib/checkout-return-token";

export const CHECKOUT_RETURN_COOKIE = "apfel-checkout-return";
export const CHECKOUT_RETURN_MAX_AGE_SECONDS = 30 * 60;

export const getCheckoutReturnCookieOptions = (nodeEnv = process.env.NODE_ENV) => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: nodeEnv === "production",
  path: "/",
  maxAge: CHECKOUT_RETURN_MAX_AGE_SECONDS,
});

export const createCheckoutReturnSession = (
  orderId: string,
  token: string,
  paypalOrderId?: string | null,
): string => Buffer.from(JSON.stringify({ orderId, token, paypalOrderId: paypalOrderId || null }), "utf8").toString("base64url");

export const readCheckoutReturnSession = (
  value: string | null | undefined,
  options: { secret?: string; nowSeconds?: number } = {},
): { orderId: string; token: string; paypalOrderId: string | null } | null => {
  try {
    if (!value || value.length > 4096) return null;
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Record<string, unknown>;
    const orderId = typeof parsed.orderId === "string" ? parsed.orderId : "";
    const token = typeof parsed.token === "string" ? parsed.token : "";
    const paypalOrderId = typeof parsed.paypalOrderId === "string" ? parsed.paypalOrderId : null;
    if (!verifyCheckoutReturnToken(orderId, token, options)) return null;
    if (paypalOrderId && (paypalOrderId.length > 128 || !/^[A-Za-z0-9_-]+$/.test(paypalOrderId))) return null;
    return { orderId, token, paypalOrderId };
  } catch {
    return null;
  }
};
