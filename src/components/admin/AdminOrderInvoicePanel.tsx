"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { InvoiceAddress } from '@/lib/order-invoice';

type InvoiceState = { approved: boolean; invoice: { number: string; issuedAt: string; sentAt: string | null; sending: boolean; needsReview: boolean } | null };
export default function AdminOrderInvoicePanel({ orderId, locale, paid, billingAddress }: { orderId: string; locale: 'de' | 'en'; paid: boolean; billingAddress: InvoiceAddress }) {
  const de = locale === 'de';
  const [state, setState] = useState<InvoiceState | null>(null);
  const [billing, setBilling] = useState(billingAddress);
  const [supplyDate, setSupplyDate] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const api = `/api/admin/orders/${orderId}/invoice`;
  useEffect(() => {
    const controller = new AbortController();
    void fetch(api, { cache: 'no-store', signal: controller.signal }).then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Invoice unavailable');
      setState(data as InvoiceState);
    }).catch(reason => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Invoice unavailable'); });
    return () => controller.abort();
  }, [api]);
  const run = async (action: 'preview' | 'issue-send' | 'resend') => {
    if (busy) return;
    if (action !== 'preview' && !window.confirm(de ? 'Diese Rechnung dauerhaft ausstellen und an die E-Mail-Adresse der Bestellung senden?' : 'Permanently issue this invoice and email it to the order customer?')) return;
    const tab = action === 'preview' ? window.open('about:blank', '_blank') : null;
    if (tab) tab.opener = null;
    setBusy(true); setError(null); setNotice(null);
    try {
      const response = await fetch(api, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, supplyDate, billingAddress: billing, confirm: action !== 'preview' }) });
      if (!response.ok) { const failure = await response.json(); throw new Error(failure.error || 'Invoice failed'); }
      if (action === 'preview') {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        if (tab && !tab.closed) tab.location.replace(url);
        else { const a = document.createElement('a'); a.href = url; a.download = 'invoice-draft.pdf'; a.click(); }
        window.setTimeout(() => URL.revokeObjectURL(url), 300000);
      } else {
        const result = await response.json() as { alreadySent: boolean };
        setNotice(result.alreadySent ? (de ? 'Diese Rechnung wurde bereits gesendet.' : 'This invoice was already sent.') : (de ? 'Rechnung ausgestellt und per E-Mail gesendet.' : 'Invoice issued and emailed.'));
        const refreshed = await fetch(api, { cache: 'no-store' });
        if (!refreshed.ok) throw new Error('Invoice sent; reload to update delivery status');
        setState(await refreshed.json() as InvoiceState);
      }
    } catch (reason) { tab?.close(); setError(reason instanceof Error ? reason.message : 'Invoice failed'); }
    finally { setBusy(false); }
  };
  const labels: Array<[keyof InvoiceAddress, string]> = [['name', de ? 'Rechnungsempfänger' : 'Billing name'], ['line1', de ? 'Straße / Hausnummer' : 'Street address'], ['line2', de ? 'Adresszusatz' : 'Address line 2'], ['postalCode', de ? 'Postleitzahl' : 'Postal code'], ['city', de ? 'Ort' : 'City'], ['country', de ? 'Land' : 'Country']];
  return <section className="glass-panel mt-6 rounded-2xl p-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold text-foreground">{de ? 'Kundenrechnung' : 'Customer invoice'}</h2><Link href="/admin/invoices" className="text-sm font-semibold text-gold">{de ? 'Vorlage & Freigabe' : 'Template & approval'} →</Link></div>
    {error ? <p role="alert" className="mt-3 text-sm text-red-500">{error}</p> : null}
    {notice ? <p role="status" className="mt-3 text-sm text-emerald-600">{notice}</p> : null}
    {!paid ? <p className="mt-4 text-sm text-muted">{de ? 'Eine Rechnung kann nach bestätigter Zahlung ausgestellt werden.' : 'An invoice can be issued after payment is confirmed.'}</p> : <>
      {!state?.approved ? <p className="mt-4 rounded-xl border border-gold/30 bg-gold/10 p-3 text-sm text-foreground">{de ? 'Design-Freigabe ausstehend. Entwürfe sind möglich; Kundenrechnungen werden noch nicht gesendet.' : 'Design approval is pending. Draft previews are available; customer invoices are not being sent yet.'}</p> : null}
      {state?.invoice ? <div className="mt-4 space-y-3 text-sm"><p className="font-semibold">{state.invoice.number}</p><p className="text-muted">{state.invoice.sentAt ? `${de ? 'Gesendet' : 'Sent'}: ${new Date(state.invoice.sentAt).toLocaleString(de ? 'de-DE' : 'en-GB')}` : state.invoice.sending ? (de ? 'Versand läuft oder erfordert Zustellprüfung. Kein automatischer Doppelversand.' : 'Sending is in progress or requires delivery review. No automatic duplicate sends.') : (de ? 'Ausgestellt, noch nicht gesendet' : 'Issued, not sent yet')}</p><div className="flex flex-wrap gap-3"><a href={`${api}?pdf=1`} target="_blank" rel="noopener noreferrer" className="btn-secondary">{de ? 'PDF öffnen' : 'Open PDF'}</a><button className="btn-primary" disabled={busy || !state.approved || state.invoice.sending} onClick={() => void run(state.invoice?.sentAt ? 'resend' : 'issue-send')}>{de ? 'Rechnung erneut senden' : 'Resend invoice'}</button></div></div> : <>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{labels.map(([field, label]) => <label key={field} className="text-xs font-semibold text-muted">{label}<input value={billing[field]} onChange={event => setBilling(current => ({ ...current, [field]: event.target.value }))} className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground" /></label>)}</div>
        <label className="mt-4 block max-w-xs text-xs font-semibold text-muted">{de ? 'Lieferdatum (falls bereits geliefert)' : 'Supply date (if already supplied)'}<input type="date" value={supplyDate} onChange={event => setSupplyDate(event.target.value)} className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground" /></label>
        <p className="mt-2 text-xs text-muted">{de ? 'Ohne Lieferdatum: Vorauszahlungsrechnung mit dem bestätigten Zahlungseingang. Rechnungspreise und Umsatzsteuer werden aus der Bestellung übernommen.' : 'Without a supply date: advance payment invoice using the confirmed payment date. Prices and VAT come from the saved order.'}</p>
        <div className="mt-5 flex flex-wrap gap-3"><button className="btn-secondary" disabled={busy} onClick={() => void run('preview')}>{de ? 'PDF-Entwurf ansehen' : 'Preview PDF draft'}</button><button className="btn-primary" disabled={busy || !state?.approved} onClick={() => void run('issue-send')}>{de ? 'Rechnung ausstellen & senden' : 'Issue & send invoice'}</button></div>
      </>}
    </>}
  </section>;
}
