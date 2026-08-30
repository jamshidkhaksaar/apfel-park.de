import { createHmac, timingSafeEqual } from "node:crypto";

const DEFAULT_TTL_SECONDS = 48 * 60 * 60;
const MINIMUM_SECRET_LENGTH = 32;

type CheckoutReturnTokenOptions = {
  secret?: string;
  nowSeconds?: number;
  ttlSeconds?: number;
};

const resolveSecret = (provided?: string): string => {
  const secret =
    provided?.trim() ||
    process.env.CHECKOUT_RETURN_SECRET?.trim() ||
    process.env.APP_SESSION_SECRET?.trim() ||
    "";

  if (secret.length < MINIMUM_SECRET_LENGTH) {
    throw new Error("Checkout return signing secret is not configured securely");
  }

  return secret;
};

const signatureFor = (orderId: string, expiresAt: number, secret: string): Buffer =>
  createHmac("sha256", secret).update(`checkout-return-v1:${orderId}:${expiresAt}`).digest();

export const createCheckoutReturnToken = (
  orderId: string,
  options: CheckoutReturnTokenOptions = {},
): string => {
  const secret = resolveSecret(options.secret);
  const nowSeconds = options.nowSeconds ?? Math.floor(Date.now() / 1000);
  const ttlSeconds = options.ttlSeconds ?? DEFAULT_TTL_SECONDS;
  if (!Number.isSafeInteger(nowSeconds) || !Number.isSafeInteger(ttlSeconds) || ttlSeconds <= 0) {
    throw new Error("Invalid checkout return token lifetime");
  }

  const expiresAt = nowSeconds + ttlSeconds;
  const signature = signatureFor(orderId, expiresAt, secret).toString("base64url");
  return `${expiresAt}.${signature}`;
};

export const verifyCheckoutReturnToken = (
  orderId: string,
  token: string | null | undefined,
  options: Omit<CheckoutReturnTokenOptions, "ttlSeconds"> = {},
): boolean => {
  try {
    if (!orderId || !token) return false;
    const [expiresRaw, encodedSignature, extra] = token.split(".");
    if (!expiresRaw || !encodedSignature || extra !== undefined) return false;

    const expiresAt = Number(expiresRaw);
    const nowSeconds = options.nowSeconds ?? Math.floor(Date.now() / 1000);
    if (!Number.isSafeInteger(expiresAt) || expiresAt < nowSeconds) return false;

    const received = Buffer.from(encodedSignature, "base64url");
    const expected = signatureFor(orderId, expiresAt, resolveSecret(options.secret));
    return received.length === expected.length && timingSafeEqual(received, expected);
  } catch {
    return false;
  }
};
