'use client';

import { useEffect, useRef, useState } from 'react';
import { catalogToolsText } from '@/lib/i18n';

export default function ConfirmDeletionDialog({ locale, title, description, onClose, onConfirm }: {
  locale: 'de' | 'en'; title: string; description: string; onClose: () => void; onConfirm: () => Promise<void>;
}) {
  const t = catalogToolsText[locale];
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(1);
  const [phrase, setPhrase] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { const element = dialog.current; element?.showModal(); return () => element?.close(); }, []);
  useEffect(() => { if (step === 2) input.current?.focus(); }, [step]);
  return <dialog ref={dialog} aria-labelledby="delete-dialog-title" aria-describedby="delete-dialog-description" onCancel={event => { event.preventDefault(); if (!busy) onClose(); }} className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-border bg-background p-6 text-foreground shadow-2xl backdrop:bg-black/60">
    <p className="text-xs font-semibold text-muted">{t.step} {step}/2</p>
    <h2 id="delete-dialog-title" className="mt-2 text-xl font-semibold">{title}</h2>
    <p id="delete-dialog-description" className="mt-3 whitespace-pre-line text-sm leading-6 text-muted">{description}</p>
    {error ? <p role="alert" className="mt-3 text-sm text-red-500">{error}</p> : null}
    <form onSubmit={event => { event.preventDefault(); if (busy) return; if (step === 1) { setStep(2); return; } if (phrase !== 'DELETE') return; setBusy(true); setError(''); void onConfirm().catch(reason => { setError(reason instanceof Error ? reason.message : t.failed); setBusy(false); }); }}>
      {step === 2 ? <label className="mt-5 block text-sm">{t.typeDelete}<input ref={input} className="mt-2 w-full rounded-xl border border-border bg-surface p-3" value={phrase} onChange={event => setPhrase(event.target.value)} autoComplete="off" disabled={busy}/></label> : null}
      <div className="mt-6 flex flex-wrap justify-end gap-3"><button type="button" className="btn-secondary" disabled={busy} onClick={onClose}>{t.cancel}</button><button type="submit" className={step === 1 ? 'btn-primary' : 'rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-40'} disabled={busy || (step === 2 && phrase !== 'DELETE')}>{busy ? t.deleting : step === 1 ? t.continue : t.confirmDelete}</button></div>
    </form>
  </dialog>;
}
