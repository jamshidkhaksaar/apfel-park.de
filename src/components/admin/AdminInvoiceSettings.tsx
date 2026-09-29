"use client";

import { useState } from 'react';
import type { InvoiceSettings } from '@/lib/order-invoice';
export default function AdminInvoiceSettings({ initial, locale, canApprove, automaticEnabled }: { initial: InvoiceSettings; locale: 'de' | 'en'; canApprove: boolean; automaticEnabled: boolean }) {
  const de = locale === 'de';
  const [taxId, setTaxId] = useState(initial.taxId);
  const [confirmed, setConfirmed] = useState(initial.taxConfirmed);
  const [approved, setApproved] = useState(Boolean(initial.approvedAt));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const save = async () => {
    if (busy) return;
    setBusy(true); setMessage(null); setError(null);
    try {
      const response = await fetch('/api/admin/invoices/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ taxId, taxConfirmed: confirmed, approve: approved }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Save failed');
      setMessage(de ? 'Gespeichert. Es wurde keine Kundenrechnung gesendet.' : 'Saved. No customer invoice was sent.');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Save failed'); }
    finally { setBusy(false); }
  };
  return <section className="glass-panel rounded-2xl p-6">
    <h2 className="text-lg font-semibold">{de ? 'Vorlage freigeben' : 'Approve the template'}</h2>
    <p className="mt-2 text-sm text-muted">{automaticEnabled ? (de ? 'Neue bezahlte Bestellungen werden automatisch mit einer Rechnung per E-Mail bestätigt. Ältere Bestellungen können weiterhin manuell ausgestellt werden.' : 'New paid orders receive an invoice email automatically. Older orders can still be issued manually.') : (de ? 'Prüfe PDF und E-Mail, bevor du die Vorlage freigibst. Die Freigabe erlaubt den manuellen Versand aus einer bezahlten Bestellung.' : 'Review the PDF and email before approving. Approval enables manual sending from paid orders.')}</p>
    <label className="mt-5 block text-sm font-semibold">{de ? 'USt-IdNr. / Steuernummer des Verkäufers' : 'Seller VAT ID / tax number'}<input disabled={!canApprove} value={taxId} onChange={event => setTaxId(event.target.value)} className="mt-2 w-full max-w-md rounded-lg border border-border bg-surface px-3 py-3 text-sm" /></label>
    <label className="mt-4 flex items-start gap-3 text-sm"><input type="checkbox" disabled={!canApprove} checked={confirmed} onChange={event => setConfirmed(event.target.checked)} className="mt-1" />{de ? 'Die Steuer-ID gehört zu Bismaillah Safi / Apfel Park. Wir verwenden normale Umsatzsteuer wie in der Bestellung gespeichert.' : 'This tax ID belongs to Bismaillah Safi / Apfel Park. We use standard VAT as saved in the order.'}</label>
    <label className="mt-4 flex items-start gap-3 text-sm"><input type="checkbox" disabled={!canApprove} checked={approved} onChange={event => setApproved(event.target.checked)} className="mt-1" />{de ? 'Ich habe das Rechnungsdesign geprüft und gebe den Kundenversand frei.' : 'I have reviewed the invoice design and approve customer sending.'}</label>
    {error ? <p role="alert" className="mt-4 text-sm text-red-500">{error}</p> : null}
    {message ? <p role="status" className="mt-4 text-sm text-emerald-600">{message}</p> : null}
    <button disabled={!canApprove || busy || (approved && !confirmed)} onClick={() => void save()} className="btn-primary mt-5">{de ? 'Freigabe speichern' : 'Save approval'}</button>
  </section>;
}
