/**
 * The delivery date Google Customer Reviews should assume for an order.
 *
 * Google sends its survey a few days *after* this date, so the number is not
 * cosmetic: too early and every customer is asked to rate an order that has not
 * arrived. It is therefore derived from the delivery promise the shop actually
 * makes rather than picked -- /delivery-returns and the Offer schema both state
 * 1 to 3 business days for shipping inside Germany, so the upper bound is used.
 *
 * Pickup orders are ready the same day, but the customer decides when to come
 * in, so two business days pass before the survey is allowed to go out.
 *
 * Sunday is the only day skipped: the shop trades Monday to Saturday and no
 * German carrier delivers on a Sunday either.
 */
const SHIPPING_BUSINESS_DAYS = 3;
const PICKUP_BUSINESS_DAYS = 2;

export const estimatedDeliveryDate = (placedAt: Date, shippingMethod: string | null): string => {
  const businessDays = shippingMethod === "shipping" ? SHIPPING_BUSINESS_DAYS : PICKUP_BUSINESS_DAYS;
  // Work in UTC date parts so the result cannot shift a day with the server
  // timezone or across a daylight-saving change.
  const date = new Date(
    Date.UTC(placedAt.getUTCFullYear(), placedAt.getUTCMonth(), placedAt.getUTCDate()),
  );
  let added = 0;
  while (added < businessDays) {
    date.setUTCDate(date.getUTCDate() + 1);
    if (date.getUTCDay() !== 0) added += 1;
  }
  return date.toISOString().slice(0, 10);
};

/**
 * Google wants an ISO 3166-1 alpha-2 code. Checkout submits "DE" today, but an
 * order predating that, or one from a payment provider, may carry something
 * else -- and a malformed code makes Google reject the whole opt-in, so
 * anything unexpected falls back to the country the shop ships from.
 */
export const deliveryCountryCode = (stored: unknown): string => {
  const value = typeof stored === "string" ? stored.trim().toUpperCase() : "";
  return /^[A-Z]{2}$/.test(value) ? value : "DE";
};

/**
 * The shop-facing delivery promise shown on the product page.
 *
 * "Lieferung bis Do., 28.08." reads as a commitment; "1–3 Werktage" reads as a
 * disclaimer, which is why German electronics retailers lead with the date.
 * Distinct from `estimatedDeliveryDate` above: that one feeds Google Customer
 * Reviews and deliberately skips only Sunday, whereas a customer-facing arrival
 * date must not land on a Saturday the carrier will not deliver on.
 *
 * Public holidays are not modelled, so the copy says "bis"/"by" rather than
 * promising an exact day.
 */
const CUSTOMER_CUTOFF_HOUR = 15;

export const addBusinessDays = (from: Date, days: number): Date => {
  const date = new Date(from);
  let remaining = days;
  while (remaining > 0) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) remaining -= 1;
  }
  return date;
};

export const deliveryEstimate = (
  locale: "de" | "en",
  { maxBusinessDays = SHIPPING_BUSINESS_DAYS, now = new Date() }: { maxBusinessDays?: number; now?: Date } = {},
): string => {
  // Past the cut-off the parcel goes out tomorrow, so shift the whole window.
  const offset = now.getHours() >= CUSTOMER_CUTOFF_HOUR ? 1 : 0;
  const target = addBusinessDays(now, maxBusinessDays + offset);
  const formatted = new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  }).format(target);
  return locale === "de" ? `Lieferung bis ${formatted}` : `Delivery by ${formatted}`;
};
