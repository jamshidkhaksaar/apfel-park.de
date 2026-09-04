import { randomUUID, timingSafeEqual, createHmac } from "node:crypto";

import { query, withTransaction, type TransactionClient } from "@/lib/db";
import { toDatabaseTimestampToken } from "@/lib/database-timestamp";
import { releaseInventoryReservation, reserveInventoryBatch } from "@/lib/marketplaces/inventory";
import { getProducts, type Product, type ProductVariant } from "@/lib/products";
import { isValidEmail, sanitizeInput } from "@/lib/security";
import { createCheckoutFingerprint } from "@/lib/checkout-idempotency";
import { canReserveCampaignRedemption } from "@/lib/coupon";
import { siteInfo } from "@/lib/site";
import { paypalCaptureRequestMatchesLocalOrder } from "@/lib/payment-coupon";
import { resolveCheckoutQuantity } from "@/lib/checkout-stock";

export type CartInputItem = {
  productId: string;
  variantColor?: string | null;
  variantStorage?: string | null;
  quantity: number;
};

export type ShippingMethod = "pickup" | "germany";

export type CustomerDetails = {
  name: string;
  email: string;
  phone?: string | null;
  address?: {
    line1?: string;
    line2?: string;
    postalCode?: string;
    city?: string;
    country?: string;
  } | null;
};

export type ValidatedCartLine = {
  key: string;
  productId: string;
  slug: string;
  title: string;
  image: string;
  sku?: string;
  category: string;
  variantColor?: string;
  variantStorage?: string;
  quantity: number;
  unitAmount: number;
  unitAmountCents: number;
  lineAmount: number;
  lineAmountCents: number;
  stock?: number;
  condition: string;
};

export type ConditionConsentRecord = {
  accepted: boolean;
  at: string;
  textVersion: string;
  items: Array<{ productId: string; title: string; condition: string }>;
};

export type ValidatedCart = {
  items: ValidatedCartLine[];
  currency: string;
  subtotalAmount: number;
  subtotalAmountCents: number;
  shippingAmount: number;
  shippingAmountCents: number;
  totalAmount: number;
  totalAmountCents: number;
  vatRate: number;
  vatAmount: number;
  vatAmountCents: number;
  shippingMethod: ShippingMethod;
  couponCode?: string;
  campaignId?: string;
  discountAmount?: number;
  discountAmountCents?: number;
  discountedSubtotalAmount?: number;
  discountedSubtotalAmountCents?: number;
};

export type CheckoutOrder = {
  id: string;
  orderNumber: number | null;
  totalAmount: number;
  currency: string;
};

export type PaymentProvider = "stripe" | "paypal";

const MAX_CART_LINES = 20;
const MAX_QUANTITY = 10;

export const getShopCurrency = () => (process.env.SHOP_CURRENCY || "EUR").trim().toUpperCase();

export const getVatRate = () => {
  const raw = Number(process.env.SHOP_VAT_RATE ?? "19");
  if (!Number.isFinite(raw) || raw < 0) return 0.19;
  return raw > 1 ? raw / 100 : raw;
};

export const getPaymentMode = () => (process.env.PAYMENT_MODE === "live" ? "live" : "sandbox");

export const getCheckoutBaseUrl = () => {
  const configured = process.env.SITE_URL?.trim() || process.env.NEXT_PUBLIC_SITE_URL?.trim() || siteInfo.url;

  try {
    const url = new URL(configured);
    if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
      return siteInfo.url;
    }
    return url.origin;
  } catch {
    return siteInfo.url;
  }
};

const toCents = (value: number) => Math.round(value * 100);
const fromCents = (value: number) => Math.round(value) / 100;

const normalizeText = (value: string | null | undefined) => (value ?? "").trim();

const getVariantKey = (productId: string, variant?: ProductVariant | null) =>
  [productId, variant?.color ?? "", variant?.storage ?? ""].join(":");

const getDefaultVariant = (product: Product) =>
  product.variants.find((variant) => variant.isDefault) ?? product.variants[0] ?? null;

const findVariant = (product: Product, item: CartInputItem) => {
  const color = normalizeText(item.variantColor);
  const storage = normalizeText(item.variantStorage);
  if (!product.variants.length) return null;
  if (!color && !storage) return getDefaultVariant(product);
  return (
    product.variants.find((variant) => variant.color === color && variant.storage === storage) ??
    null
  );
};

const getShippingCents = (method: ShippingMethod) => {
  if (method === "pickup") return 0;
  const configured = Number(process.env.SHOP_GERMANY_SHIPPING_AMOUNT ?? "6.9");
  return Number.isFinite(configured) && configured >= 0 ? toCents(configured) : 690;
};

export const normalizeShippingMethod = (value: unknown): ShippingMethod =>
  value === "germany" ? "germany" : "pickup";

export const normalizeCheckoutCustomer = (
  customer: CustomerDetails | undefined,
  shippingMethod: ShippingMethod,
  locale: "de" | "en",
): CustomerDetails => {
  const name = sanitizeInput(customer?.name);
  const email = sanitizeInput(customer?.email).toLowerCase();
  const phone = sanitizeInput(customer?.phone) || null;
  const address = customer?.address
    ? {
        line1: sanitizeInput(customer.address.line1),
        line2: sanitizeInput(customer.address.line2),
        postalCode: sanitizeInput(customer.address.postalCode),
        city: sanitizeInput(customer.address.city),
        country: sanitizeInput(customer.address.country || "DE") || "DE",
      }
    : null;

  if (!name || !isValidEmail(email)) {
    throw new Error(
      locale === "de"
        ? "Bitte geben Sie einen Namen und eine gültige E-Mail-Adresse ein."
        : "Please enter a name and a valid email address.",
    );
  }

  if (shippingMethod === "germany") {
    if (phone) {
      const phoneDigits = phone.replace(/\D/g, "");
      if (phone.length > 40 || phoneDigits.length < 6 || phoneDigits.length > 15) {
        throw new Error(
          locale === "de"
            ? "Bitte geben Sie eine gültige Telefonnummer ein oder lassen Sie das Feld leer."
            : "Please enter a valid phone number or leave the field blank.",
        );
      }
    }

    if (
      !address?.line1 ||
      !address.postalCode ||
      !address.city ||
      address.line1.length > 200 ||
      (address.line2?.length ?? 0) > 200 ||
      address.postalCode.length > 20 ||
      address.city.length > 100
    ) {
      throw new Error(
        locale === "de"
          ? "Bitte geben Sie eine vollständige Lieferadresse ein."
          : "Please enter a complete delivery address.",
      );
    }
  }

  return { name, email, phone, address: shippingMethod === "germany" ? address : null };
};

export async function validateCartItems(
  inputItems: CartInputItem[],
  shippingMethod: ShippingMethod = "pickup",
): Promise<ValidatedCart> {
  if (!Array.isArray(inputItems) || inputItems.length === 0) {
    throw new Error("Cart is empty");
  }

  if (inputItems.length > MAX_CART_LINES) {
    throw new Error("Cart has too many lines");
  }

  const products = await getProducts();
  const byId = new Map(products.map((product) => [product.id, product] as const));
  const merged = new Map<string, ValidatedCartLine>();

  for (const inputItem of inputItems) {
    const product = byId.get(normalizeText(inputItem.productId));
    if (!product) {
      throw new Error("A product in your cart is no longer available");
    }

    const variant = findVariant(product, inputItem);
    if (product.variants.length > 0 && !variant) {
      throw new Error(`${product.title} is no longer available in the selected variant`);
    }

    const unitAmount = variant?.price ?? product.price;
    const unitAmountCents = toCents(unitAmount);
    if (unitAmountCents <= 0) {
      throw new Error(`${product.title} cannot be checked out online`);
    }

    const stock = variant?.stock ?? product.stock;
    const quantity = resolveCheckoutQuantity(inputItem.quantity, stock, product.title);

    const key = getVariantKey(product.id, variant);
    const existing = merged.get(key);
    const nextQuantity = existing ? Math.min(existing.quantity + quantity, MAX_QUANTITY) : quantity;
    const lineAmountCents = unitAmountCents * nextQuantity;
    const title =
      variant && (variant.color || variant.storage)
        ? `${product.title} - ${[variant.color, variant.storage].filter(Boolean).join(" ")}`
        : product.title;

    merged.set(key, {
      key,
      productId: product.id,
      slug: product.slug,
      title,
      image: product.image,
      sku: variant?.sku || product.sku,
      category: product.category,
      variantColor: variant?.color,
      variantStorage: variant?.storage,
      quantity: nextQuantity,
      unitAmount: fromCents(unitAmountCents),
      unitAmountCents,
      lineAmount: fromCents(lineAmountCents),
      lineAmountCents,
      stock,
      condition: product.condition ?? "new",
    });
  }

  const items = Array.from(merged.values());
  const subtotalAmountCents = items.reduce((sum, item) => sum + item.lineAmountCents, 0);
  const shippingAmountCents = getShippingCents(shippingMethod);
  const totalAmountCents = subtotalAmountCents + shippingAmountCents;
  const vatRate = getVatRate();
  const vatAmountCents = Math.round(totalAmountCents - totalAmountCents / (1 + vatRate));

  return {
    items,
    currency: getShopCurrency(),
    subtotalAmount: fromCents(subtotalAmountCents),
    subtotalAmountCents,
    shippingAmount: fromCents(shippingAmountCents),
    shippingAmountCents,
    totalAmount: fromCents(totalAmountCents),
    totalAmountCents,
    vatRate,
    vatAmount: fromCents(vatAmountCents),
    vatAmountCents,
    shippingMethod,
  };
}

export async function getOrderByNumberAndEmail(
  orderNumber: string,
  email: string,
): Promise<{ id: string } | null> {
  const numeric = /^#?A?-?(\d+)$/i.exec(orderNumber.trim());
  const parsed = numeric ? Number(numeric[1]) : null;
  if (parsed === null || !Number.isFinite(parsed) || parsed > 2147483647) return null;
  const result = await query(
    `SELECT id FROM orders WHERE order_number = $1 AND lower(customer_email) = lower($2) LIMIT 1`,
    [parsed, email.trim()],
  );
  return (result.rows[0] as { id: string } | undefined) ?? null;
}

export const buildConditionConsent = (
  cart: ValidatedCart,
  accepted: boolean,
): ConditionConsentRecord | null => {
  const items = cart.items
    .filter((line) => line.condition !== "new")
    .map((line) => ({ productId: line.productId, title: line.title, condition: line.condition }));
  if (items.length === 0) return null;
  return {
    accepted,
    at: new Date().toISOString(),
    textVersion: "condition-consent-v1",
    items,
  };
};

const reserveCampaignRedemption = async (client: TransactionClient, orderId: string, cart: ValidatedCart) => {
  if (!cart.campaignId || (cart.discountAmountCents ?? 0) <= 0) return;
  const campaign = await client.query(`SELECT id,is_active,maximum_redemptions,redemption_count FROM store_campaigns WHERE id=$1 FOR UPDATE`, [cart.campaignId]);
  const row = campaign.rows[0];
  if (!row || !row.is_active) throw new Error("Order campaign is unavailable");
  const existing = await client.query(`SELECT id,released_at FROM campaign_redemptions WHERE campaign_id=$1 AND order_id=$2`, [row.id, orderId]);
  const alreadyReserved = Boolean(existing.rows[0] && !existing.rows[0].released_at);
  if (!canReserveCampaignRedemption(row.maximum_redemptions === null ? null : Number(row.maximum_redemptions), Number(row.redemption_count), alreadyReserved)) throw new Error("Campaign redemption limit reached");
  if (!alreadyReserved) {
    const reserved = await client.query(`INSERT INTO campaign_redemptions(campaign_id,order_id,discount_amount) VALUES($1,$2,$3) ON CONFLICT(campaign_id,order_id) DO NOTHING RETURNING id`, [row.id, orderId, (cart.discountAmountCents ?? 0) / 100]);
    if (reserved.rowCount) await client.query(`UPDATE store_campaigns SET redemption_count=redemption_count+1,updated_at=now() WHERE id=$1`, [row.id]);
  }
};

export async function createPendingOrder(input: {
  cart: ValidatedCart;
  customer: CustomerDetails;
  provider: PaymentProvider;
  locale: "de" | "en";
  idempotencyKey?: string | null;
  consentMode?: string | null;
  conditionConsent?: ConditionConsentRecord | null;
  termsConsentAt?: string | null;
}): Promise<CheckoutOrder> {
  const idempotencyKey = normalizeText(input.idempotencyKey) || randomUUID();
  const checkoutFingerprint = createCheckoutFingerprint(input);
  return withTransaction(async (client) => {
    const result = await client.query(
      `INSERT INTO orders (
      customer_email,
      customer_name,
      customer_phone,
      total_amount,
      subtotal_amount,
      shipping_amount,
      vat_rate,
      vat_amount,
      currency,
      coupon_code,
      discount_amount,
      status,
      payment_status,
      shipping_method,
      customer_address,
      items,
      provider,
      idempotency_key,
      checkout_locale,
      consent_mode,
      metadata,
      created_at,
      updated_at
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'pending','unpaid',$12,$13,$14,$15,$16,$17,$18,$19,now(),now()
    )
    ON CONFLICT (idempotency_key) DO UPDATE SET updated_at = now()
      RETURNING id, order_number, total_amount, currency, items, status, payment_status, metadata`,
      [
        input.customer.email.toLowerCase(),
        input.customer.name,
        input.customer.phone || null,
        input.cart.totalAmount,
        input.cart.subtotalAmount,
        input.cart.shippingAmount,
        input.cart.vatRate,
        input.cart.vatAmount,
        input.cart.currency,
        input.cart.couponCode || null,
        (input.cart.discountAmountCents ?? 0) / 100,
        input.cart.shippingMethod,
        input.customer.address ?? null,
        JSON.stringify(input.cart.items),
        input.provider,
        idempotencyKey,
        input.locale,
        input.consentMode || null,
        JSON.stringify({
          paymentMode: getPaymentMode(),
          createdBy: "checkout",
          checkoutFingerprint,
          ...(input.cart.campaignId ? { campaignId: input.cart.campaignId } : {}),
          ...(input.conditionConsent ? { conditionConsent: input.conditionConsent } : {}),
          ...(input.termsConsentAt ? { termsConsentAt: input.termsConsentAt } : {}),
        }),
      ],
    );

    const row = result.rows[0];
    if (!row) throw new Error("Order could not be created");
    if (row.status !== "pending" || row.payment_status !== "unpaid") {
      throw new Error("This checkout request has already been completed or cancelled");
    }
    if (Math.round(Number(row.total_amount) * 100) !== input.cart.totalAmountCents) {
      throw new Error("This checkout key belongs to a different cart total");
    }
    if (row.metadata?.checkoutFingerprint !== checkoutFingerprint) {
      throw new Error("This checkout key belongs to a different checkout request");
    }
    await reserveCampaignRedemption(client, row.id, input.cart);
    const storedItems = Array.isArray(row.items) ? row.items as ValidatedCartLine[] : input.cart.items;
    const reservationItems = storedItems.map((item) => {
      if (!item.sku) throw new Error(`${item.title} has no sellable SKU`);
      return { sku: item.sku, quantity: item.quantity };
    });

    // The order and every SKU reservation commit together. A failure on line
    // two cannot leave line one reserved or an unusable pending order behind.
    await reserveInventoryBatch(reservationItems, "checkout_order", row.id, "checkout", client);
    return {
      id: row.id,
      orderNumber: row.order_number ?? null,
      totalAmount: Number(row.total_amount),
      currency: row.currency || input.cart.currency,
    };
  });
}

export async function attachProviderReference(input: {
  orderId: string;
  provider: PaymentProvider;
  providerOrderId?: string | null;
  providerSessionId?: string | null;
  providerStatus?: string | null;
}): Promise<{ updatedAt: string } | null> {
  const result = await query(
    `UPDATE orders
     SET provider_order_id = COALESCE(provider_order_id, $3),
         provider_session_id = COALESCE(provider_session_id, $4),
         provider_status = COALESCE($5, provider_status),
         updated_at = now()
     WHERE id = $1 AND provider = $2
       AND status = 'pending' AND payment_status = 'unpaid'
       AND ($3::text IS NULL OR provider_order_id IS NULL OR provider_order_id = $3)
       AND ($4::text IS NULL OR provider_session_id IS NULL OR provider_session_id = $4)
     RETURNING updated_at::text AS updated_at`,
    [input.orderId, input.provider, input.providerOrderId ?? null, input.providerSessionId ?? null, input.providerStatus ?? null],
  );
  const updatedAt = toDatabaseTimestampToken(result.rows[0]?.updated_at);
  return updatedAt ? { updatedAt } : null;
}

/**
 * The amount an order is expected to be paid, in cents.
 *
 * The webhook uses this to refuse a "paid" event whose amount does not match
 * the order. Without it, anyone able to produce a valid webhook signature and
 * an order id could mark an order paid without paying -- and customers see
 * their own order id in the checkout success URL.
 */
export async function getOrderAmountCents(orderId: string): Promise<number | null> {
  try {
    const result = await query(
      `SELECT round(total_amount * 100)::int AS cents FROM orders WHERE id = $1 LIMIT 1`,
      [orderId],
    );
    const row = result.rows[0] as { cents?: number } | undefined;
    return typeof row?.cents === "number" ? row.cents : null;
  } catch (error) {
    console.error("getOrderAmountCents failed:", error);
    return null;
  }
}

export async function getOrderPaymentExpectation(orderId: string): Promise<{ cents: number; currency: string } | null> {
  try { const result=await query(`SELECT round(total_amount*100)::int AS cents,upper(currency) AS currency FROM orders WHERE id=$1 LIMIT 1`,[orderId]);const row=result.rows[0];return typeof row?.cents==="number"&&typeof row?.currency==="string"?{cents:row.cents,currency:row.currency}:null; } catch(error){console.error("getOrderPaymentExpectation failed:",error);return null;}
}

export async function getPayPalCaptureExpectation(orderId: string, paypalOrderId: string): Promise<{ cents: number; currency: string } | null> {
  try {
    const result = await query(
      `SELECT provider, status, payment_status, provider_status, provider_order_id,
              round(total_amount * 100)::int AS cents, upper(currency) AS currency
       FROM orders WHERE id = $1 LIMIT 1`,
      [orderId],
    );
    const row = result.rows[0] as Record<string, unknown> | undefined;
    if (!row || row.provider_status === "paypal_expiry_check" || !paypalCaptureRequestMatchesLocalOrder({
      localProvider: typeof row.provider === "string" ? row.provider : null,
      status: typeof row.status === "string" ? row.status : null,
      paymentStatus: typeof row.payment_status === "string" ? row.payment_status : null,
      storedProviderOrderId: typeof row.provider_order_id === "string" ? row.provider_order_id : null,
      paypalOrderId,
    })) return null;
    return typeof row.cents === "number" && typeof row.currency === "string"
      ? { cents: row.cents, currency: row.currency }
      : null;
  } catch (error) {
    console.error("getPayPalCaptureExpectation failed:", error);
    return null;
  }
}

export async function markOrderPaid(input: {
  orderId?: string | null;
  provider: PaymentProvider;
  providerOrderId?: string | null;
  providerSessionId?: string | null;
  providerPaymentId?: string | null;
  providerStatus?: string | null;
}) {
  if (!input.orderId && !input.providerOrderId && !input.providerSessionId) throw new Error("Missing order reference");
  return withTransaction(async (client) => {
    const result = await client.query(
      `UPDATE orders
       SET status = 'paid', payment_status = 'paid',
           provider_order_id = COALESCE(provider_order_id, $3),
           provider_session_id = COALESCE(provider_session_id, $4),
           provider_payment_id = COALESCE($5, provider_payment_id),
           provider_status = COALESCE($6, provider_status),
           paid_at = COALESCE(paid_at, now()), updated_at = now()
       WHERE provider = $1
         AND (
           ($2::uuid IS NOT NULL AND id = $2
             AND ($3::text IS NULL OR provider_order_id IS NULL OR provider_order_id = $3)
             AND ($4::text IS NULL OR provider_session_id IS NULL OR provider_session_id = $4))
           OR
           ($2::uuid IS NULL AND ($3::text IS NOT NULL OR $4::text IS NOT NULL)
             AND ($3::text IS NULL OR provider_order_id = $3)
             AND ($4::text IS NULL OR provider_session_id = $4))
         )
         AND payment_status IS DISTINCT FROM 'paid'
         AND status IS DISTINCT FROM 'cancelled'
       RETURNING id, order_number, customer_email, customer_name, total_amount, currency, items, consent_mode, metadata, coupon_code, discount_amount`,
      [input.provider, input.orderId ?? null, input.providerOrderId ?? null, input.providerSessionId ?? null, input.providerPaymentId ?? null, input.providerStatus ?? "paid"],
    );
    const order = result.rows[0] ?? null;
    if (order?.metadata?.campaignId && Number(order.discount_amount ?? 0) > 0) {
      const campaign = await client.query(`SELECT id FROM store_campaigns WHERE id=$1 FOR UPDATE`, [order.metadata.campaignId]);
      const row = campaign.rows[0];
      if (row) {
        const redemption = await client.query(`INSERT INTO campaign_redemptions(campaign_id,order_id,discount_amount) VALUES($1,$2,$3) ON CONFLICT(campaign_id,order_id) DO NOTHING RETURNING id`, [row.id, order.id, order.discount_amount]);
        if (redemption.rowCount) await client.query(`UPDATE store_campaigns SET redemption_count=redemption_count+1,updated_at=now() WHERE id=$1`, [row.id]);
      }
    }
    if (order) await releaseInventoryReservation("checkout_order", order.id, true, client);
    return order;
  });
}

const releaseCampaignRedemption = async (client: TransactionClient, orderId: string) => {
  const redemptions = await client.query(`UPDATE campaign_redemptions SET released_at=COALESCE(released_at,now()) WHERE order_id=$1 AND released_at IS NULL RETURNING campaign_id`, [orderId]);
  for (const row of redemptions.rows) await client.query(`UPDATE store_campaigns SET redemption_count=GREATEST(0,redemption_count-1),updated_at=now() WHERE id=$1`, [row.campaign_id]);
};

export async function markOrderCancelled(input: {
  orderId?: string | null;
  provider: PaymentProvider;
  providerOrderId?: string | null;
  providerSessionId?: string | null;
  providerStatus?: string | null;
  expectedStatus?: string | null;
  expectedPaymentStatus?: string | null;
  expectedProviderStatus?: string | null;
  expectedProviderOrderId?: string | null;
  expectedProviderSessionId?: string | null;
  expectedUpdatedAt?: string | null;
}) {
  if (!input.orderId && !input.providerOrderId && !input.providerSessionId) throw new Error("Missing order reference");
  return withTransaction(async (client) => {
    const result = await client.query(
      `UPDATE orders
       SET status = 'cancelled', payment_status = 'failed',
           provider_order_id = COALESCE(provider_order_id, $3),
           provider_session_id = COALESCE(provider_session_id, $4),
           provider_status = COALESCE($5, provider_status),
           cancelled_at = COALESCE(cancelled_at, now()), updated_at = now()
       WHERE provider = $1 AND (
         ($2::uuid IS NOT NULL AND id = $2
           AND ($3::text IS NULL OR provider_order_id IS NULL OR provider_order_id = $3)
           AND ($4::text IS NULL OR provider_session_id IS NULL OR provider_session_id = $4))
         OR
         ($2::uuid IS NULL AND ($3::text IS NOT NULL OR $4::text IS NOT NULL)
           AND ($3::text IS NULL OR provider_order_id = $3)
           AND ($4::text IS NULL OR provider_session_id = $4))
       )
         AND payment_status IS DISTINCT FROM 'paid'
         AND status IS DISTINCT FROM 'cancelled'
         AND ($6::text IS NULL OR status = $6)
         AND ($7::text IS NULL OR payment_status = $7)
         AND ($6::text IS NULL OR provider_status IS NOT DISTINCT FROM $8)
         AND ($6::text IS NULL OR provider_order_id IS NOT DISTINCT FROM $9)
         AND ($6::text IS NULL OR provider_session_id IS NOT DISTINCT FROM $10)
         AND ($6::text IS NULL OR updated_at = $11::timestamptz)
       RETURNING id`,
      [input.provider, input.orderId ?? null, input.providerOrderId ?? null, input.providerSessionId ?? null, input.providerStatus ?? null, input.expectedStatus ?? null, input.expectedPaymentStatus ?? null, input.expectedProviderStatus ?? null, input.expectedProviderOrderId ?? null, input.expectedProviderSessionId ?? null, input.expectedUpdatedAt ?? null],
    );
    const orderId = result.rows[0]?.id ? String(result.rows[0].id) : null;
    if (orderId) {
      await releaseCampaignRedemption(client, orderId);
      await releaseInventoryReservation("checkout_order", orderId, false, client);
    }
    return orderId;
  });
}

/**
 * A refund is the one transition `markOrderCancelled` deliberately refuses to
 * make, since it guards on `payment_status IS DISTINCT FROM 'paid'`. Without
 * this, refunding in Stripe left the order reading `paid` forever -- which is
 * how a refunded customer ended up on the review-invite list.
 */
export async function markOrderRefunded(input: {
  orderId?: string | null;
  provider: PaymentProvider;
  providerOrderId?: string | null;
  providerSessionId?: string | null;
  providerStatus?: string | null;
  fullyRefunded: boolean;
}) {
  if (!input.orderId && !input.providerOrderId && !input.providerSessionId) throw new Error("Missing order reference");
  return withTransaction(async (client) => {
    const result = await client.query(
      `UPDATE orders
       SET payment_status = $6,
           provider_order_id = COALESCE(provider_order_id, $3),
           provider_session_id = COALESCE(provider_session_id, $4),
           status = CASE WHEN $7::boolean THEN 'cancelled' ELSE status END,
           cancelled_at = CASE WHEN $7::boolean THEN COALESCE(cancelled_at, now()) ELSE cancelled_at END,
           provider_status = COALESCE($5, provider_status), updated_at = now()
       WHERE provider = $1 AND (
         ($2::uuid IS NOT NULL AND id = $2
           AND ($3::text IS NULL OR provider_order_id IS NULL OR provider_order_id = $3)
           AND ($4::text IS NULL OR provider_session_id IS NULL OR provider_session_id = $4))
         OR
         ($2::uuid IS NULL AND ($3::text IS NOT NULL OR $4::text IS NOT NULL)
           AND ($3::text IS NULL OR provider_order_id = $3)
           AND ($4::text IS NULL OR provider_session_id = $4))
       )
         AND payment_status IN ('paid', 'partially_refunded')
       RETURNING id`,
      [input.provider, input.orderId ?? null, input.providerOrderId ?? null, input.providerSessionId ?? null, input.providerStatus ?? null, input.fullyRefunded ? "refunded" : "partially_refunded", input.fullyRefunded],
    );
    if (input.fullyRefunded) {
      for (const order of result.rows) await releaseCampaignRedemption(client, String(order.id));
    }
    return result.rows.length;
  });
}

export async function isOrderInProviderState(input: {
  provider: PaymentProvider;
  orderId?: string | null;
  providerOrderId?: string | null;
  providerSessionId?: string | null;
  statuses?: string[];
  paymentStatuses?: string[];
}): Promise<boolean> {
  if (!input.orderId && !input.providerOrderId && !input.providerSessionId) return false;
  const result = await query(
    `SELECT 1 FROM orders
     WHERE provider = $1 AND (
       ($2::uuid IS NOT NULL AND id = $2
         AND ($3::text IS NULL OR provider_order_id = $3)
         AND ($4::text IS NULL OR provider_session_id = $4))
       OR
       ($2::uuid IS NULL AND ($3::text IS NOT NULL OR $4::text IS NOT NULL)
         AND ($3::text IS NULL OR provider_order_id = $3)
         AND ($4::text IS NULL OR provider_session_id = $4))
     )
       AND ($5::text[] IS NULL OR status = ANY($5::text[]))
       AND ($6::text[] IS NULL OR payment_status = ANY($6::text[]))
     LIMIT 1`,
    [input.provider, input.orderId ?? null, input.providerOrderId ?? null, input.providerSessionId ?? null, input.statuses?.length ? input.statuses : null, input.paymentStatuses?.length ? input.paymentStatuses : null],
  );
  return Boolean(result.rows[0]);
}

export type WebhookEventClaim =
  | { status: "claimed"; token: string }
  | { status: "processed" }
  | { status: "busy" };

export async function claimWebhookEvent(input: {
  provider: PaymentProvider;
  eventId: string;
  eventType: string;
  payload: unknown;
}): Promise<WebhookEventClaim> {
  const token = randomUUID();
  const result = await query(
    `INSERT INTO payment_webhook_events (
       provider, provider_event_id, event_type, payload, processed_at,
       processing_started_at, processing_token, attempt_count, last_error
     ) VALUES ($1, $2, $3, $4, NULL, now(), $5, 1, NULL)
     ON CONFLICT (provider, provider_event_id) DO UPDATE SET
       event_type = EXCLUDED.event_type,
       payload = EXCLUDED.payload,
       processing_started_at = now(),
       processing_token = EXCLUDED.processing_token,
       attempt_count = payment_webhook_events.attempt_count + 1,
       last_error = NULL
     WHERE payment_webhook_events.processed_at IS NULL
       AND (
         payment_webhook_events.processing_token IS NULL
         OR payment_webhook_events.processing_started_at < now() - interval '5 minutes'
       )
     RETURNING processing_token`,
    [input.provider, input.eventId, input.eventType, JSON.stringify(input.payload), token],
  );
  if (result.rows[0]?.processing_token === token) return { status: "claimed", token };
  const existing = await query(
    `SELECT processed_at, processing_token FROM payment_webhook_events
     WHERE provider = $1 AND provider_event_id = $2 LIMIT 1`,
    [input.provider, input.eventId],
  );
  return existing.rows[0]?.processed_at ? { status: "processed" } : { status: "busy" };
}

export async function completeWebhookEvent(provider: PaymentProvider, eventId: string, token: string): Promise<void> {
  const result = await query(
    `UPDATE payment_webhook_events
     SET processed_at = now(), processing_started_at = NULL, processing_token = NULL, last_error = NULL
     WHERE provider = $1 AND provider_event_id = $2 AND processing_token = $3 AND processed_at IS NULL
     RETURNING id`,
    [provider, eventId, token],
  );
  if (!result.rows[0]) throw new Error("Webhook event claim was lost before completion");
}

export async function releaseWebhookEventClaim(
  provider: PaymentProvider,
  eventId: string,
  token: string,
  error: unknown,
): Promise<void> {
  const message = (error instanceof Error ? error.message : "Webhook processing failed").slice(0, 2000);
  await query(
    `UPDATE payment_webhook_events
     SET processing_started_at = NULL, processing_token = NULL, last_error = $4
     WHERE provider = $1 AND provider_event_id = $2 AND processing_token = $3 AND processed_at IS NULL`,
    [provider, eventId, token, message],
  );
}

export async function getOrderForConfirmation(orderId: string) {
  const result = await query(
    `SELECT id, order_number, customer_email, customer_name, total_amount, currency, payment_status, status, items, shipping_method, created_at, customer_address
     FROM orders
     WHERE id = $1
     LIMIT 1`,
    [orderId],
  );
  return result.rows[0] ?? null;
}

/**
 * GTINs for the products in an order, for the Google Customer Reviews opt-in.
 *
 * Returns nothing today because no product carries a GTIN yet, so the opt-in
 * omits the optional products field entirely -- Google rejects empty
 * identifiers. It starts working on its own once the identifiers are imported.
 */
export async function getOrderProductGtins(productIds: string[]): Promise<string[]> {
  if (productIds.length === 0) return [];
  const result = await query(
    `SELECT gtin FROM products
      WHERE id::text = ANY($1::text[]) AND gtin IS NOT NULL AND gtin <> ''`,
    [productIds],
  );
  return result.rows.map((row) => String(row.gtin)).filter(Boolean);
}

export const verifyStripeSignature = (
  payload: string,
  signatureHeader: string,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
) => {
  let timestampRaw = "";
  const signatures: string[] = [];
  for (const part of signatureHeader.split(",")) {
    const [key, ...valueParts] = part.split("=");
    const value = valueParts.join("=");
    if (key === "t") timestampRaw = value;
    if (key === "v1" && value) signatures.push(value);
  }
  const timestamp = Number(timestampRaw);
  if (!Number.isSafeInteger(timestamp) || signatures.length === 0 || Math.abs(nowSeconds - timestamp) > 300) return false;
  const expected = Buffer.from(createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex"));
  return signatures.some((signature) => {
    const received = Buffer.from(signature);
    return expected.length === received.length && timingSafeEqual(expected, received);
  });
};
