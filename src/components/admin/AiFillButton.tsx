'use client';

import { useEffect, useId, useRef, useState } from 'react';
import type { ProductResearchResult } from '@/lib/product-research-core';
import { hasReviewedResearchSources } from '@/lib/product-research-prefill';
import ResearchEvidencePanel from '@/components/admin/ResearchEvidencePanel';

export default function AiFillButton({ locale, onResult, onError, query, disabled, condition }: {
  locale: 'de' | 'en'; onResult: (research: ProductResearchResult) => void; onError: (message: string) => void;
  query?: string; disabled?: boolean; condition?: string;
}): React.ReactNode {
  const de = locale === 'de';
  const fileId = useId();
  const [busy, setBusy] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [assetType, setAssetType] = useState('barcode_label');
  const [hardwareModel, setHardwareModel] = useState('');
  const [result, setResult] = useState<ProductResearchResult | null>(null);
  const active = useRef<AbortController | null>(null);
  const signature = JSON.stringify([query?.trim() ?? '', condition, hardwareModel, assetType, photo?.name, photo?.size, photo?.lastModified]);
  const latest = useRef(signature);
  useEffect(() => {
    latest.current = signature;
    return () => active.current?.abort();
  }, [signature]);

  const run = async (): Promise<void> => {
    if (busy || active.current) return;
    if (!query?.trim() && !photo) { onError(de ? 'Bitte Modell angeben oder ein Barcode-/Infofoto auswählen.' : 'Enter a model or select a barcode/model-information photo.'); return; }
    if (photo && photo.size > 8 * 1024 * 1024) { onError(de ? 'Das Recherchefoto darf höchstens 8 MB groß sein.' : 'The research photo must be at most 8 MB.'); return; }
    const controller = new AbortController();
    active.current = controller;
    const requestSignature = signature;
    setBusy(true);
    setResult(null);
    onError('');
    try {
      let body: string | FormData;
      if (photo) {
        body = new FormData();
        body.set('photo', photo); body.set('query', query?.trim() ?? ''); body.set('assetType', assetType);
        body.set('hardwareModel', hardwareModel); if (condition) body.set('condition', condition);
      } else body = JSON.stringify({ query: query?.trim(), condition, hardwareModel });
      const response = await fetch('/api/admin/products/research', { method: 'POST',
        ...(typeof body === 'string' ? { headers: { 'Content-Type': 'application/json' } } : {}), body,
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(80000)]),
      });
      if (!(response.headers.get('content-type') ?? '').includes('application/json')) throw new Error(de ? 'Der Recherchedienst hat nicht rechtzeitig geantwortet. Bitte erneut versuchen.' : 'The research service did not respond in time. Please retry.');
      const payload = await response.json();
      if (!response.ok) throw new Error((!de && payload.errorEn) || payload.error || (de ? 'Recherche fehlgeschlagen.' : 'Research failed.'));
      if (controller.signal.aborted || latest.current !== requestSignature) return;
      const research = payload.research as ProductResearchResult;
      if (!research || !hasReviewedResearchSources(research)) throw new Error(de ? 'Keine geprüften Recherchequellen in der Antwort. Es wurden keine Felder übernommen.' : 'No checked research sources were returned. No fields were applied.');
      active.current = null;
      setResult(research);
      onResult(research);
    } catch (error) {
      if (!controller.signal.aborted) onError(error instanceof Error ? error.message : (de ? 'Recherche fehlgeschlagen.' : 'Research failed.'));
    } finally { if (active.current === controller) active.current = null; setBusy(false); }
  };

  return <div className="flex w-full min-w-0 flex-col gap-2">
    <button type="button" disabled={disabled} aria-disabled={busy || disabled} onClick={() => void run()} aria-busy={busy}
      className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl bg-gold px-4 py-2 text-xs font-semibold text-black transition disabled:opacity-60 aria-disabled:opacity-60">
      {busy ? <svg viewBox="0 0 24 24" className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" opacity=".25"/><path d="M12 3a9 9 0 0 1 9 9" fill="none" stroke="currentColor" strokeWidth="2"/></svg> : <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="10" cy="10" r="6"/><path d="m15 15 6 6M10 7v6M7 10h6"/></svg>}
      {busy ? (de ? 'Offizielle Quellen werden recherchiert…' : 'Researching official sources…') : (de ? 'KI-Daten holen' : 'Fetch AI data')}
    </button>
    <details className="text-xs text-muted">
      <summary className="min-h-11 cursor-pointer py-3">{de ? 'Barcode-/Infofoto oder Gerätecode ergänzen (optional)' : 'Add a barcode/info photo or hardware code (optional)'}</summary>
      <div className="grid gap-3 rounded-xl border border-border p-3 sm:grid-cols-2">
        <label htmlFor={fileId} className="min-w-0">{de ? 'Nur zur Erkennung, kein Produktbild' : 'For recognition only, not a product image'}
          <input id={fileId} type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={event => setPhoto(event.target.files?.[0] ?? null)} className="mt-2 block min-h-11 w-full min-w-0 text-xs"/>
        </label>
        <label>{de ? 'Fotoart' : 'Photo type'}<select value={assetType} onChange={event => setAssetType(event.target.value)} disabled={busy} className="mt-2 min-h-11 w-full rounded-lg border border-border bg-surface px-2">
          <option value="barcode_label">{de ? 'Barcode-Etikett' : 'Barcode label'}</option><option value="about_screen">{de ? 'Geräteinformationen / Über' : 'Device information / About'}</option>
        </select></label>
        <label className="sm:col-span-2">{de ? 'Exakte Hardware-Modellnummer für EPREL, z. B. A3090 / SM-S931B' : 'Exact hardware model for EPREL, e.g. A3090 / SM-S931B'}
          <input value={hardwareModel} maxLength={100} disabled={busy} onChange={event => setHardwareModel(event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-border bg-surface px-3"/>
        </label>
        <p className="sm:col-span-2">{de ? 'Sensible Kennungen möglichst abdecken. Das Foto wird zuerst lokal geprüft und geschwärzt; es wird nicht als Shopbild gespeichert.' : 'Cover sensitive identifiers where possible. The photo is checked and redacted locally first; it is not saved as a shop image.'}</p>
      </div>
    </details>
    {busy ? <p role="status" aria-live="polite" className="text-xs text-muted">{de ? 'Deine bisherigen Angaben bleiben erhalten, bis ein verwendbarer Vorschlag vorliegt.' : 'Your existing entries stay unchanged until a usable draft is returned.'}</p> : null}
    {result ? <ResearchEvidencePanel research={result} locale={locale}/> : null}
  </div>;
}
