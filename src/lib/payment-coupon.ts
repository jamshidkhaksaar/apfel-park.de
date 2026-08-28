type PaymentCart = {
  currency: string;
  subtotalAmount: number;
  shippingAmount: number;
  totalAmount: number;
  totalAmountCents: number;
  discountAmount?: number;
  discountAmountCents?: number;
  couponCode?: string;
};

type PayPalCaptureIdentity = {
  paypalOrderId: string;
  responseOrderId?: string;
  referenceId?: string;
  customId?: string;
  localOrderId: string;
};

type PayPalLocalOrderBinding = {
  localProvider?: string | null;
  status?: string | null;
  paymentStatus?: string | null;
  storedProviderOrderId?: string | null;
  paypalOrderId: string;
};

const amount = (currency: string, value: number) => ({ currency_code: currency, value: value.toFixed(2) });

export const buildPayPalDiscountedAmount = (cart: PaymentCart) => ({
  currency_code: cart.currency,
  value: cart.totalAmount.toFixed(2),
  breakdown: {
    item_total: amount(cart.currency, cart.subtotalAmount),
    shipping: amount(cart.currency, cart.shippingAmount),
    ...((cart.discountAmount ?? 0) > 0 ? { discount: amount(cart.currency, cart.discountAmount ?? 0) } : {}),
    tax_total: amount(cart.currency, 0),
  },
});

export const buildStripeCouponForm = (cart: PaymentCart, orderId: string) => new URLSearchParams({
  duration: "once",
  amount_off: String(cart.discountAmountCents ?? 0),
  currency: cart.currency.toLowerCase(),
  name: cart.couponCode || "Apfel Park discount",
  "metadata[order_id]": orderId,
});

export const getPaymentIntentAmount = (cart: PaymentCart) => Math.round(cart.totalAmountCents);

export const paypalCaptureIdentityMatches = (identity: PayPalCaptureIdentity): boolean =>
  Boolean(identity.responseOrderId)
  && identity.responseOrderId === identity.paypalOrderId
  && identity.referenceId === identity.localOrderId
  && identity.customId === identity.localOrderId;

export const paypalCaptureRequestMatchesLocalOrder = (binding: PayPalLocalOrderBinding): boolean =>
  binding.localProvider === "paypal"
  && binding.status === "pending"
  && binding.paymentStatus === "unpaid"
  && Boolean(binding.storedProviderOrderId)
  && binding.storedProviderOrderId === binding.paypalOrderId;
