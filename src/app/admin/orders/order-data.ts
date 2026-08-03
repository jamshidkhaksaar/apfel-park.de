import { query } from "@/lib/db";

export type OrderItem = {
  productId?: string;
  title?: string;
  sku?: string | null;
  variantColor?: string | null;
  variantStorage?: string | null;
  quantity?: number;
  unitAmount?: number;
  lineAmount?: number;
};

export type OrderAddress = {
  line1?: string | null;
  line2?: string | null;
  postalCode?: string | null;
  city?: string | null;
  country?: string | null;
};

export type OrderDetail = {
  id: string;
  order_number: number | null;
  created_at: string | null;
  paid_at: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  customer_address: OrderAddress | null;
  status: string | null;
  payment_status: string | null;
  shipping_method: string | null;
  provider: string | null;
  provider_payment_id: string | null;
  provider_session_id: string | null;
  checkout_locale: string | null;
  total_amount: string;
  subtotal_amount: string | null;
  shipping_amount: string | null;
  vat_amount: string | null;
  currency: string | null;
  items: OrderItem[] | null;
  tracking_id: string | null;
  condition_consent: {
    accepted?: boolean;
    at?: string;
    textVersion?: string;
    items?: Array<{ productId?: string; title?: string; condition?: string }>;
  } | null;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getOrderDetail(id: string): Promise<OrderDetail | null> {
  if (!UUID_PATTERN.test(id)) return null;
  const result = await query(
    `SELECT id, order_number, created_at, paid_at, customer_name, customer_email, customer_phone,
            customer_address, status, payment_status, shipping_method, provider,
            provider_payment_id, provider_session_id, checkout_locale,
            total_amount, subtotal_amount, shipping_amount, vat_amount, currency, items,
            metadata->>'trackingId' AS tracking_id,
            metadata->'conditionConsent' AS condition_consent
     FROM orders WHERE id = $1`,
    [id],
  );
  return (result.rows[0] as OrderDetail | undefined) ?? null;
}

export const formatVariant = (item: OrderItem): string =>
  [item.variantColor, item.variantStorage].filter(Boolean).join(" ");
