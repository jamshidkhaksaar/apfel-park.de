export const buildStripePaymentReturnUrl = (
  origin: string,
  locale: "de" | "en",
  orderId: string,
): string => {
  const url = new URL(`/${locale}/checkout/success`, origin);
  url.searchParams.set("order_id", orderId);
  url.searchParams.set("provider", "stripe");
  return url.toString();
};
