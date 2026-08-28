import { createHash } from "node:crypto";

type CheckoutFingerprintInput = {
  provider: string;
  locale: string;
  customer: {
    email: string;
    name: string;
    phone?: string | null;
    address?: { line1?: string | null; line2?: string | null; postalCode?: string | null; city?: string | null; country?: string | null } | null;
  };
  cart: {
    shippingMethod: string;
    currency: string;
    subtotalAmountCents: number;
    shippingAmountCents: number;
    totalAmountCents: number;
    vatAmountCents: number;
    couponCode?: string | null;
    campaignId?: string | null;
    discountAmountCents?: number | null;
    items: Array<{
      productId: string;
      sku?: string | null;
      variantColor?: string | null;
      variantStorage?: string | null;
      quantity: number;
      unitAmountCents: number;
      lineAmountCents: number;
    }>;
  };
};

const text = (value: string | null | undefined) => value?.trim() || null;

export const createCheckoutFingerprint = (input: CheckoutFingerprintInput): string => {
  const items = input.cart.items.map((item) => ({
    productId: item.productId,
    sku: text(item.sku),
    variantColor: text(item.variantColor),
    variantStorage: text(item.variantStorage),
    quantity: item.quantity,
    unitAmountCents: item.unitAmountCents,
    lineAmountCents: item.lineAmountCents,
  })).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  const address = input.customer.address ? {
    line1: text(input.customer.address.line1),
    line2: text(input.customer.address.line2),
    postalCode: text(input.customer.address.postalCode),
    city: text(input.customer.address.city),
    country: text(input.customer.address.country)?.toUpperCase() || null,
  } : null;
  const canonical = {
    provider: input.provider,
    locale: input.locale,
    customer: {
      email: input.customer.email.trim().toLowerCase(),
      name: input.customer.name.trim(),
      phone: text(input.customer.phone),
      address,
    },
    cart: {
      shippingMethod: input.cart.shippingMethod,
      currency: input.cart.currency.toUpperCase(),
      subtotalAmountCents: input.cart.subtotalAmountCents,
      shippingAmountCents: input.cart.shippingAmountCents,
      totalAmountCents: input.cart.totalAmountCents,
      vatAmountCents: input.cart.vatAmountCents,
      couponCode: text(input.cart.couponCode)?.toUpperCase() || null,
      campaignId: text(input.cart.campaignId),
      discountAmountCents: input.cart.discountAmountCents ?? 0,
      items,
    },
  };
  return createHash("sha256").update(JSON.stringify(canonical)).digest("hex");
};
