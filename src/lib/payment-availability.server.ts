/** Server-side configuration parity, not a guarantee of provider approval. */
export const isPayPalConfigured = (): boolean => Boolean(
  process.env.PAYPAL_CLIENT_ID?.trim() && process.env.PAYPAL_CLIENT_SECRET?.trim(),
);
