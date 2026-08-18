import { randomUUID, timingSafeEqual, createHmac } from "node:crypto";

import { query } from "@/lib/db";
import { reserveInventory } from "@/lib/marketplaces/inventory";
import { getProducts, type Product, type ProductVariant } from "@/lib/products";
import { isValidEmail, sanitizeInput } from "@/lib/security";
import { siteInfo } from "@/lib/site";

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

const normalizeQuantity = (value: number) => {
  if (!Number.isFinite(value)) return 1;
  return Math.min(MAX_QUANTITY, Math.max(1, Math.floor(value)));
};

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
    const phoneDigits = phone?.replace(/\D/g, "") ?? "";
    if (!phone || phone.length > 40 || phoneDigits.length < 6 || phoneDigits.length > 15) {
      throw new Error(
        locale === "de"
          ? "Bitte geben Sie für die Lieferung eine gültige Telefonnummer ein."
          : "Please enter a valid phone number for delivery.",
      );
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
    const requestedQuantity = normalizeQuantity(inputItem.quantity);
    const quantity =
      typeof stock === "number" && stock > 0
        ? Math.min(requestedQuantity, Math.max(1, stock))
        : requestedQuantity;

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
  const result = await query(
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
      $1,$2,$3,$4,$5,$6,$7,$8,$9,'pending','unpaid',$10,$11,$12,$13,$14,$15,$16,$17,now(),now()
    )
    ON CONFLICT (idempotency_key) DO UPDATE SET updated_at = now()
    RETURNING id, order_number, total_amount, currency`,
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
        ...(input.conditionConsent ? { conditionConsent: input.conditionConsent } : {}),
        ...(input.termsConsentAt ? { termsConsentAt: input.termsConsentAt } : {}),
      }),
    ],
  );

  const row = result.rows[0];
  if (!row) throw new Error("Order could not be created");
  // The database reservation is the authoritative oversell guard. It happens
  // before a payment session is handed to the customer; payment failures release it.
  for (const item of input.cart.items) {
    if (!item.sku) throw new Error(`${item.title} has no sellable SKU`);
    await reserveInventory(item.sku, item.quantity, "checkout_order", row.id, "checkout");
  }
  return {
    id: row.id,
    orderNumber: row.order_number ?? null,
    totalAmount: Number(row.total_amount),
    currency: row.currency || input.cart.currency,
  };
}

export async function attachProviderReference(input: {
  orderId: string;
  provider: PaymentProvider;
  providerOrderId?: string | null;
  providerSessionId?: string | null;
  providerStatus?: string | null;
}) {
  await query(
    `UPDATE orders
     SET provider = $2,
         provider_order_id = COALESCE($3, provider_order_id),
         provider_session_id = COALESCE($4, provider_session_id),
         provider_status = COALESCE($5, provider_status),
         updated_at = now()
     WHERE id = $1`,
    [
      input.orderId,
      input.provider,
      input.providerOrderId ?? null,
      input.providerSessionId ?? null,
      input.providerStatus ?? null,
    ],
  );
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

export async function markOrderPaid(input: {
  orderId?: string | null;
  provider: PaymentProvider;
  providerOrderId?: string | null;
  providerSessionId?: string | null;
  providerPaymentId?: string | null;
  providerStatus?: string | null;
}) {
  const clauses = ["provider = $1"];
  const values: unknown[] = [input.provider];
  if (input.orderId) {
    values.push(input.orderId);
    clauses.push(`id = $${values.length}`);
  }
  if (input.providerOrderId) {
    values.push(input.providerOrderId);
    clauses.push(`provider_order_id = $${values.length}`);
  }
  if (input.providerSessionId) {
    values.push(input.providerSessionId);
    clauses.push(`provider_session_id = $${values.length}`);
  }

  if (clauses.length === 1) {
    throw new Error("Missing order reference");
  }

  const result = await query(
    `UPDATE orders
     SET status = 'paid',
         payment_status = 'paid',
         provider_payment_id = COALESCE($${values.length + 1}, provider_payment_id),
         provider_status = COALESCE($${values.length + 2}, provider_status),
         paid_at = COALESCE(paid_at, now()),
         updated_at = now()
     WHERE ${clauses.join(" AND ")}
       AND payment_status IS DISTINCT FROM 'paid'
     RETURNING id, order_number, customer_email, customer_name, total_amount, currency, items, consent_mode`,
    [...values, input.providerPaymentId ?? null, input.providerStatus ?? "paid"],
  );

  const order = result.rows[0] ?? null;
  if (order) {
    const { releaseInventoryReservation } = await import("@/lib/marketplaces/inventory");
    await releaseInventoryReservation("checkout_order", order.id, true);
  }
  return order;
}

export async function markOrderCancelled(input: {
  orderId?: string | null;
  provider: PaymentProvider;
  providerOrderId?: string | null;
  providerSessionId?: string | null;
  providerStatus?: string | null;
}) {
  await query(
    `UPDATE orders
     SET status = 'cancelled',
         payment_status = 'failed',
         provider_status = COALESCE($5, provider_status),
         cancelled_at = COALESCE(cancelled_at, now()),
         updated_at = now()
     WHERE provider = $1
       AND ($2::uuid IS NULL OR id = $2)
       AND ($3::text IS NULL OR provider_order_id = $3)
       AND ($4::text IS NULL OR provider_session_id = $4)`,
    [
      input.provider,
      input.orderId ?? null,
      input.providerOrderId ?? null,
      input.providerSessionId ?? null,
      input.providerStatus ?? null,
    ],
  );
  if (input.orderId) {
    const { releaseInventoryReservation } = await import("@/lib/marketplaces/inventory");
    await releaseInventoryReservation("checkout_order", input.orderId, false);
  }
}

export async function recordWebhookEvent(input: {
  provider: PaymentProvider;
  eventId: string;
  eventType: string;
  payload: unknown;
}) {
  const result = await query(
    `INSERT INTO payment_webhook_events (provider, provider_event_id, event_type, payload, processed_at)
     VALUES ($1, $2, $3, $4, now())
     ON CONFLICT (provider, provider_event_id) DO NOTHING
     RETURNING id`,
    [input.provider, input.eventId, input.eventType, JSON.stringify(input.payload)],
  );

  return result.rowCount === 1;
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

export const verifyStripeSignature = (payload: string, signatureHeader: string, secret: string) => {
  const parts = Object.fromEntries(
    signatureHeader.split(",").map((part) => {
      const [key, ...value] = part.split("=");
      return [key, value.join("=")];
    }),
  );
  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) return false;

  const expected = createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(signature);
  return expectedBuffer.length === receivedBuffer.length && timingSafeEqual(expectedBuffer, receivedBuffer);
};
