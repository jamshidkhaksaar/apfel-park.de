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
  provider_status: string | null;
  decline_code: string | null;
  customer_unpaid_email_sent_at: string | null;
  customer_unpaid_email_last_error: string | null;
  shipping_method: string | null;
  provider: string | null;
  provider_payment_id: string | null;
  provider_session_id: string | null;
  admin_notification_sent_at: string | null;
  admin_notification_last_error: string | null;
  admin_notification_attempts: number;
  checkout_locale: string | null;
  total_amount: string;
  subtotal_amount: string | null;
  shipping_amount: string | null;
  vat_amount: string | null;
  coupon_code: string | null;
  discount_amount: string | null;
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
            customer_address, status, payment_status, provider_status, shipping_method, provider,
            customer_unpaid_email_sent_at, customer_unpaid_email_last_error,
            (SELECT e.payload #>> '{data,object,last_payment_error,decline_code}'
               FROM payment_webhook_events e
              WHERE e.provider = 'stripe' AND e.event_type = 'payment_intent.payment_failed'
                AND e.payload #>> '{data,object,metadata,order_id}' = orders.id::text
              ORDER BY e.created_at DESC LIMIT 1) AS decline_code,
            provider_payment_id, provider_session_id, checkout_locale,
            admin_notification_sent_at, admin_notification_last_error, admin_notification_attempts,
            total_amount, subtotal_amount, shipping_amount, vat_amount, coupon_code, discount_amount, currency, items,
            metadata->>'trackingId' AS tracking_id,
            metadata->'conditionConsent' AS condition_consent
     FROM orders WHERE id = $1`,
    [id],
  );
  return (result.rows[0] as OrderDetail | undefined) ?? null;
}

export const formatVariant = (item: OrderItem): string =>
  [item.variantColor, item.variantStorage].filter(Boolean).join(" ");
