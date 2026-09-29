import { randomUUID } from 'node:crypto';
import { query } from '@/lib/db';
import { sendShippingStatusEmail } from '@/lib/email';
import { buildShippingEmail, type FulfillmentStage, type ShippingCarrier } from '@/lib/order-shipping';

const settingKey = 'shipping_email_settings';

export const notifyShippingStage = async (orderId: string, stage: FulfillmentStage, carrier: ShippingCarrier | null, tracking: string): Promise<void> => {
  if (stage === 'paid') return;
  const settings = await query('SELECT value FROM store_settings WHERE key=$1', [settingKey]);
  if (settings.rows[0]?.value?.approvedVersion !== 'shipping-v1' || !settings.rows[0]?.value?.approvedAt) return;
  const notificationKey = JSON.stringify({ stage, carrier, tracking: tracking.trim() });
  const claim = randomUUID();
  const result = await query(`UPDATE orders SET metadata = COALESCE(metadata,'{}'::jsonb) || jsonb_build_object('shippingEmailClaim', $2::text, 'shippingEmailClaimKey', $3::text, 'shippingEmailClaimedAt', now()::text)
    WHERE id=$1 AND payment_status='paid' AND metadata->>'shippingEmailClaim' IS NULL
      AND NOT (COALESCE(metadata->'shippingEmailSentKeys', '[]'::jsonb) ? $3::text)
      AND metadata->>'fulfillmentStage'=$4 AND metadata->>'shippingCarrier' IS NOT DISTINCT FROM $5::text AND metadata->>'trackingId' IS NOT DISTINCT FROM $6::text
    RETURNING order_number,customer_name,customer_email,metadata->>'fulfillmentStage' AS stage,metadata->>'shippingCarrier' AS carrier,metadata->>'trackingId' AS tracking`, [orderId, claim, notificationKey, stage, carrier, tracking || null]);
  const row = result.rows[0];
  if (!row) return;
  if (row.stage !== stage || row.carrier !== carrier || (row.tracking || '') !== tracking || !row.customer_email) return;
  const content = buildShippingEmail({ customerName: row.customer_name || 'Kunde', orderNumber: row.order_number, stage, carrier, tracking });
  const sent = await sendShippingStatusEmail(row.customer_email, content);
  if (!sent.success) {
    await query(`UPDATE orders SET metadata=metadata || jsonb_build_object('shippingEmailLastError',$3::text) WHERE id=$1 AND metadata->>'shippingEmailClaim'=$2`, [orderId, claim, (sent.error || 'SMTP failed').slice(0, 300)]);
    return;
  }
  await query(`UPDATE orders SET metadata=(metadata - 'shippingEmailClaim' - 'shippingEmailClaimKey' - 'shippingEmailClaimedAt' - 'shippingEmailLastError') || jsonb_build_object('shippingEmailSentKey',$3::text,'shippingEmailSentKeys',COALESCE(metadata->'shippingEmailSentKeys','[]'::jsonb) || to_jsonb($3::text),'shippingEmailSentAt',now()::text)
    WHERE id=$1 AND metadata->>'shippingEmailClaim'=$2`, [orderId, claim, notificationKey]);
};
