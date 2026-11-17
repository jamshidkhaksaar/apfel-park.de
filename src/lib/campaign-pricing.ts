/**
 * Black Friday campaign pricing — pure helpers, no I/O.
 *
 * Staff set a discount per product (percent or a euro amount) in the admin.
 * The discount is applied at read time while the sale is live; `products.price`
 * stays the regular price, so the price history never records campaign prices
 * and the regular price returns by itself when the campaign ends.
 *
 * The advertised reduction is always measured against the lowest price of the
 * previous 30 days (PAngV §11), never against an arbitrary strike price.
 */

export type CampaignDiscountType = 'percent' | 'amount';

export type CampaignDiscount = {
  type: CampaignDiscountType;
  value: number;
};

export type CampaignDeal = {
  /** Saving against the 30-day lowest price, rounded down to whole percent. */
  percent: number;
  /** Lowest price of the previous 30 days: the legally required reference. */
  referencePrice: number;
  /** Regular price before the campaign discount. */
  regularPrice: number;
};

export const MAX_PERCENT_DISCOUNT = 90;

const round2 = (value: number): number => Math.round(value * 100) / 100;

/** Validates one stored or submitted discount; anything odd is dropped. */
export const parseCampaignDiscount = (value: unknown): CampaignDiscount | null => {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as { type?: unknown; value?: unknown };
  const amount = typeof candidate.value === 'string' ? Number(candidate.value.replace(',', '.')) : candidate.value;
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) return null;
  if (candidate.type === 'percent') {
    if (amount > MAX_PERCENT_DISCOUNT) return null;
    return { type: 'percent', value: round2(amount) };
  }
  if (candidate.type === 'amount') {
    if (amount > 100000) return null;
    return { type: 'amount', value: round2(amount) };
  }
  return null;
};

export const parseCampaignDiscounts = (
  value: unknown,
  isValidId: (id: string) => boolean = () => true,
): Record<string, CampaignDiscount> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const result: Record<string, CampaignDiscount> = {};
  for (const [id, raw] of Object.entries(value as Record<string, unknown>)) {
    if (!isValidId(id)) continue;
    const discount = parseCampaignDiscount(raw);
    if (discount) result[id] = discount;
  }
  return result;
};

/**
 * Sale price for one regular price, or null when the discount would leave
 * nothing to pay (an amount larger than the price).
 */
export const applyCampaignDiscount = (price: number, discount: CampaignDiscount): number | null => {
  if (!Number.isFinite(price) || price <= 0) return null;
  const next = discount.type === 'percent'
    ? price * (1 - discount.value / 100)
    : price - discount.value;
  const rounded = round2(next);
  return rounded > 0 && rounded < price ? rounded : null;
};

/**
 * Saving against the reference price, rounded *down* so the badge can never
 * promise more than the customer actually saves.
 */
export const campaignSavingPercent = (salePrice: number, referencePrice: number): number => {
  if (!(referencePrice > 0) || salePrice >= referencePrice) return 0;
  return Math.floor(((referencePrice - salePrice) / referencePrice) * 100 + 1e-9);
};

/**
 * Deal facts for one price point, or null when there is no advertisable
 * reduction (for example when the price was already lower within 30 days).
 */
export const campaignDealFor = (
  regularPrice: number,
  salePrice: number,
  lowest30Days: number | undefined,
): CampaignDeal | null => {
  const referencePrice = round2(Math.min(regularPrice, lowest30Days ?? regularPrice));
  const percent = campaignSavingPercent(salePrice, referencePrice);
  if (percent < 1) return null;
  return { percent, referencePrice, regularPrice };
};

/**
 * Key of one price line in `product_price_history`. Must match
 * `public.product_price_variant_key()` in the 20261117 migration.
 */
export const productPriceKey = (variant?: { sku?: unknown; color?: unknown; storage?: unknown }): string => {
  if (!variant) return '';
  const sku = typeof variant.sku === 'string' ? variant.sku.trim() : '';
  if (sku) return sku;
  const color = typeof variant.color === 'string' ? variant.color.trim().toLowerCase() : '';
  const storage = typeof variant.storage === 'string' ? variant.storage.trim().toLowerCase() : '';
  return `${color}|${storage}`;
};

export const describeCampaignDiscount = (discount: CampaignDiscount, locale: 'de' | 'en'): string =>
  discount.type === 'percent'
    ? `−${discount.value.toLocaleString(locale === 'de' ? 'de-DE' : 'en-GB')} %`
    : `−${discount.value.toLocaleString(locale === 'de' ? 'de-DE' : 'en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
