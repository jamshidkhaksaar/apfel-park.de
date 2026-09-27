import { createHash, randomUUID } from 'node:crypto';
import { query, withTransaction } from '@/lib/db';
import { sendCustomerInvoiceEmail } from '@/lib/email';
import { buildInvoiceSnapshot, invoiceDate, normalizeInvoiceSettings, type InvoiceOrder, type InvoiceSettings, type InvoiceSnapshot } from '@/lib/order-invoice';
import { renderOrderInvoicePdf } from '@/lib/order-invoice-pdf';
import { buildCustomerInvoiceEmail } from '@/lib/order-invoice-template';

export const INVOICE_TEMPLATE_VERSION = 'invoice-v1';
const settingsKey = 'customer_invoice_settings';
export type IssuedInvoice = { id: string; invoice_number: string; snapshot: InvoiceSnapshot; pdf_content: Buffer; pdf_sha256: string; email_sent_at: string | null; email_claimed_at: string | null; email_last_error: string | null; issued_at: string };
export type InvoiceIssueOptions = { supplyDate: string; billingAddress?: unknown };
const normalizeSettings = (value: unknown): InvoiceSettings => {
  const settings = normalizeInvoiceSettings(value);
  if (!value || typeof value !== 'object' || (value as Record<string, unknown>).approvedVersion !== INVOICE_TEMPLATE_VERSION) settings.approvedAt = null;
  return settings;
};
export const getCustomerInvoiceSettings = async (): Promise<InvoiceSettings> => {
  const result = await query('SELECT value FROM store_settings WHERE key=$1', [settingsKey]);
  return normalizeSettings(result.rows[0]?.value);
};
export const saveCustomerInvoiceSettings = async (taxId: string, taxConfirmed: boolean, approve: boolean) => {
  if (!/^(DE\d{9}|[\d/ -]{8,25})$/.test(taxId)) throw new Error('Enter a valid German VAT ID or tax number');
  if (approve && !taxConfirmed) throw new Error('Confirm the seller tax details first');
  await query(`INSERT INTO store_settings(key,value,updated_at) VALUES($1,$2::jsonb,now())
    ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=now()`, [settingsKey, JSON.stringify({ taxId, taxConfirmed, approvedAt: approve ? new Date().toISOString() : null, approvedVersion: approve ? INVOICE_TEMPLATE_VERSION : null })]);
};
export const getIssuedCustomerInvoice = async (orderId: string): Promise<IssuedInvoice | null> => {
  const result = await query('SELECT * FROM customer_order_invoices WHERE order_id=$1', [orderId]);
  return result.rows[0] as IssuedInvoice | undefined ?? null;
};
export const getInvoiceOrder = async (orderId: string): Promise<InvoiceOrder | null> => {
  const result = await query('SELECT id,order_number,payment_status,status,customer_name,customer_email,customer_address,paid_at,provider,checkout_locale,currency,subtotal_amount,shipping_amount,discount_amount,total_amount,vat_rate,vat_amount,items FROM orders WHERE id=$1', [orderId]);
  return result.rows[0] as InvoiceOrder | undefined ?? null;
};
export const previewCustomerInvoice = async (orderId: string, options: InvoiceIssueOptions): Promise<Buffer> => {
  const [order, settings] = await Promise.all([getInvoiceOrder(orderId), getCustomerInvoiceSettings()]);
  if (!order) throw new Error('Order not found');
  const snapshot = buildInvoiceSnapshot(order, settings, { ...options, taxMode: 'standard', preview: true, number: `ENTWURF-${order.order_number ?? orderId.slice(0, 8)}` });
  return renderOrderInvoicePdf(snapshot);
};
export const issueAndSendCustomerInvoice = async (orderId: string, actorId: string, options: InvoiceIssueOptions, resend = false): Promise<{ number: string; alreadySent: boolean }> => {
  const claimToken = randomUUID();
  const invoice = await withTransaction(async client => {
    const settingsResult = await client.query('SELECT value FROM store_settings WHERE key=$1 FOR UPDATE', [settingsKey]);
    const settings = normalizeSettings(settingsResult.rows[0]?.value);
    if (!settings.approvedAt || !settings.taxConfirmed) throw new Error('Invoice design approval is pending');
    const orderResult = await client.query('SELECT * FROM orders WHERE id=$1 FOR UPDATE', [orderId]);
    const order = orderResult.rows[0] as InvoiceOrder | undefined;
    if (!order) throw new Error('Order not found');
    if (order.payment_status !== 'paid' || ['cancelled', 'refunded'].includes(order.status)) throw new Error('Only successfully paid orders can be invoiced');
    const existing = await client.query('SELECT * FROM customer_order_invoices WHERE order_id=$1 FOR UPDATE', [orderId]);
    let saved = existing.rows[0] as IssuedInvoice | undefined;
    if (!saved) {
      const sequence = await client.query("SELECT nextval(pg_get_serial_sequence('customer_order_invoices','sequence_number')) AS number");
      const number = `AP-${invoiceDate().slice(0, 4)}-${String(sequence.rows[0].number).padStart(6, '0')}`;
      const snapshot = buildInvoiceSnapshot(order, settings, { ...options, number, taxMode: 'standard' });
      const pdf = await renderOrderInvoicePdf(snapshot);
      const inserted = await client.query(`INSERT INTO customer_order_invoices(sequence_number,order_id,invoice_number,snapshot,pdf_content,pdf_sha256,issued_by)
        OVERRIDING SYSTEM VALUE VALUES($1,$2,$3,$4::jsonb,$5,$6,$7) RETURNING *`, [sequence.rows[0].number, orderId, number, JSON.stringify(snapshot), pdf, createHash('sha256').update(pdf).digest('hex'), actorId]);
      saved = inserted.rows[0] as IssuedInvoice;
    }
    if (saved.email_sent_at && !resend) return { invoice: saved, alreadySent: true };
    // Never automatically reclaim an uncertain SMTP send: a person must inspect it.
    if (saved.email_claimed_at) throw new Error('Invoice sending is in progress or needs delivery review; no duplicate was sent');
    await client.query(`UPDATE customer_order_invoices SET email_claim_token=$2,email_claimed_at=now(),email_attempts=email_attempts+1,email_last_error=NULL WHERE id=$1`, [saved.id, claimToken]);
    return { invoice: saved, alreadySent: false };
  });
  if (invoice.alreadySent) return { number: invoice.invoice.invoice_number, alreadySent: true };
  const saved = invoice.invoice;
  if (createHash('sha256').update(saved.pdf_content).digest('hex') !== saved.pdf_sha256) throw new Error('Invoice document integrity check failed');
  const content = buildCustomerInvoiceEmail(saved.snapshot);
  const result = await sendCustomerInvoiceEmail({ to: saved.snapshot.email, ...content, pdf: saved.pdf_content, filename: `${saved.invoice_number}.pdf` });
  if (!result.success) {
    await query('UPDATE customer_order_invoices SET email_last_error=$3 WHERE id=$1 AND email_claim_token=$2', [saved.id, claimToken, (result.error || 'Email failed').slice(0, 500)]);
    // Preserve the claim until delivery is reviewed; SMTP failures can be ambiguous.
    throw new Error('Invoice email could not be confirmed. Check mail delivery before retrying.');
  }
  await query(`UPDATE customer_order_invoices SET email_sent_at=now(),email_claim_token=NULL,email_claimed_at=NULL,email_last_error=NULL WHERE id=$1 AND email_claim_token=$2`, [saved.id, claimToken]);
  return { number: saved.invoice_number, alreadySent: false };
};
