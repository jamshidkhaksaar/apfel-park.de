import Link from 'next/link';
import AdminShell from '@/components/admin/AdminShell';
import AdminInvoiceSettings from '@/components/admin/AdminInvoiceSettings';
import { getAdminLocale } from '@/lib/admin-i18n-server';
import { isAdminUser } from '@/lib/admin-auth';
import { query } from '@/lib/db';
import { getCustomerInvoiceSettings } from '@/lib/order-invoice-service';
import { readSessionUser } from '@/lib/session';

export const dynamic = 'force-dynamic';
export default async function InvoicesPage() {
  const [locale, settings, user, invoices, automation, automaticFailures] = await Promise.all([getAdminLocale(), getCustomerInvoiceSettings(), readSessionUser(), query('SELECT order_id,invoice_number,issued_at,email_sent_at,email_claimed_at,email_last_error FROM customer_order_invoices ORDER BY issued_at DESC LIMIT 100'), query("SELECT value FROM store_settings WHERE key='customer_invoice_auto_settings'"), query("SELECT o.id,o.order_number,o.metadata->>'invoiceAutoLastError' AS error FROM orders o LEFT JOIN customer_order_invoices i ON i.order_id=o.id WHERE o.metadata->>'invoiceAutoLastError' IS NOT NULL AND i.id IS NULL ORDER BY o.created_at DESC LIMIT 20")]);
  const de = locale === 'de';
  const automaticEnabled = automation.rows[0]?.value?.enabled === true;
  return <AdminShell title={de ? 'Rechnungen' : 'Invoices'}>
    <p className="mb-5 text-sm text-muted">{de ? 'Deutsche Rechnungen mit Apfel Park Logo, Bestellpositionen, Umsatzsteuer und PDF-Anhang.' : 'German invoices with Apfel Park branding, order items, VAT and PDF attachment.'}</p>
    <div className="mb-6 flex flex-wrap gap-3"><a className="btn-primary" href={`/api/admin/invoices/sample?lang=${locale}`} target="_blank" rel="noopener noreferrer">{de ? 'PDF-Vorlage ansehen' : 'View PDF template'}</a><a className="btn-secondary" href={`/api/admin/invoices/sample?format=html&lang=${locale}`} target="_blank" rel="noopener noreferrer">{de ? 'E-Mail-Vorlage ansehen' : 'View email template'}</a><Link href="/admin/orders" className="btn-secondary">{de ? 'Zu den Bestellungen' : 'Open orders'}</Link></div>
    <AdminInvoiceSettings initial={settings} locale={locale} canApprove={isAdminUser(user)} automaticEnabled={automaticEnabled} />
    {automaticFailures.rows.length ? <section className="glass-panel mt-6 rounded-2xl border border-amber-500/40 p-6"><h2 className="text-lg font-semibold">{de ? 'Automatische Rechnungen prüfen' : 'Review automatic invoices'}</h2><ul className="mt-3 space-y-2 text-sm">{automaticFailures.rows.map((order: { id: string; order_number: number; error: string }) => <li key={order.id}><Link href={`/admin/orders/${order.id}`} className="font-semibold text-gold">#A-{order.order_number}</Link>: {order.error}</li>)}</ul></section> : null}
    <section className="glass-panel mt-6 overflow-x-auto rounded-2xl p-6"><h2 className="mb-4 text-lg font-semibold">{de ? 'Ausgestellte Rechnungen' : 'Issued invoices'}</h2>
      {invoices.rows.length ? <table className="w-full text-left text-sm"><thead><tr className="border-b border-border text-muted"><th className="pb-3">{de ? 'Nummer' : 'Number'}</th><th>{de ? 'Ausgestellt' : 'Issued'}</th><th>{de ? 'E-Mail' : 'Email'}</th><th /></tr></thead><tbody>{invoices.rows.map((invoice: { order_id: string; invoice_number: string; issued_at: string; email_sent_at: string | null; email_claimed_at: string | null }) => <tr key={invoice.order_id} className="border-b border-border/50"><td className="py-4 font-semibold">{invoice.invoice_number}</td><td>{new Date(invoice.issued_at).toLocaleDateString(de ? 'de-DE' : 'en-GB')}</td><td>{invoice.email_sent_at ? (de ? 'Gesendet' : 'Sent') : invoice.email_claimed_at ? (de ? 'Zustellung prüfen' : 'Review delivery') : (de ? 'Ausstehend' : 'Pending')}</td><td><Link href={`/admin/orders/${invoice.order_id}`} className="font-semibold text-gold">{de ? 'Öffnen' : 'Open'} →</Link></td></tr>)}</tbody></table> : <p className="text-sm text-muted">{de ? 'Noch keine Kundenrechnungen ausgestellt. Die Muster verwenden keine echten Kundendaten.' : 'No customer invoices issued yet. Samples do not use real customer data.'}</p>}
    </section>
  </AdminShell>;
}
