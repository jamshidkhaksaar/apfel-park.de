import { query } from '@/lib/db';
import { getCustomerInvoiceSettings, issueAndSendCustomerInvoice } from '@/lib/order-invoice-service';

type Candidate = { id: string; order_number: number };

/** Issue only orders created after the owner's explicit automation cutoff. */
export const sendDueCustomerInvoices = async (): Promise<void> => {
  const setting = await query("SELECT value FROM store_settings WHERE key='customer_invoice_auto_settings'");
  const value = setting.rows[0]?.value;
  const afterOrderNumber = Number(value?.afterOrderNumber);
  if (value?.enabled !== true || !Number.isSafeInteger(afterOrderNumber) || afterOrderNumber < 0) return;
  const invoiceSettings = await getCustomerInvoiceSettings();
  if (!invoiceSettings.approvedAt || !invoiceSettings.taxConfirmed) return;

  const due = await query(`SELECT o.id,o.order_number FROM orders o
    LEFT JOIN customer_order_invoices i ON i.order_id=o.id
    WHERE o.order_number > $1 AND o.payment_status='paid' AND o.status NOT IN ('cancelled','refunded')
      AND o.paid_at IS NOT NULL AND i.id IS NULL
      AND COALESCE((o.metadata->>'invoiceAutoAttempts')::int,0) < 3
      AND (o.metadata->>'invoiceAutoAttemptAt' IS NULL OR (o.metadata->>'invoiceAutoAttemptAt')::timestamptz < now() - interval '1 hour')
    ORDER BY o.created_at LIMIT 5`, [afterOrderNumber]);
  for (const candidate of due.rows as Candidate[]) {
    const claim = await query(`UPDATE orders o SET metadata=COALESCE(o.metadata,'{}'::jsonb) || jsonb_build_object(
      'invoiceAutoAttempts',COALESCE((o.metadata->>'invoiceAutoAttempts')::int,0)+1,
      'invoiceAutoAttemptAt',now()::text,'invoiceAutoLastError',null)
      WHERE o.id=$1 AND o.payment_status='paid' AND o.status NOT IN ('cancelled','refunded')
        AND COALESCE((o.metadata->>'invoiceAutoAttempts')::int,0)<3
        AND (o.metadata->>'invoiceAutoAttemptAt' IS NULL OR (o.metadata->>'invoiceAutoAttemptAt')::timestamptz < now() - interval '1 hour')
        AND NOT EXISTS (SELECT 1 FROM customer_order_invoices i WHERE i.order_id=o.id)
      RETURNING o.id`, [candidate.id]);
    if (!claim.rows[0]) continue;
    try {
      await issueAndSendCustomerInvoice(candidate.id, null, { supplyDate: '' });
      await query("UPDATE orders SET metadata=metadata - 'invoiceAutoLastError' WHERE id=$1", [candidate.id]);
    } catch (error) {
      const message = (error instanceof Error ? error.message : 'Invoice automation failed').slice(0, 300);
      await query("UPDATE orders SET metadata=COALESCE(metadata,'{}'::jsonb) || jsonb_build_object('invoiceAutoLastError',$2::text) WHERE id=$1", [candidate.id, message]);
      console.error('[customer-invoice-auto] failed', { orderId: candidate.id, error: message });
    }
  }
};
