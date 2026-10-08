'use client';
import { lazy, Suspense, useRef, useState } from 'react';
import { uploadGalleryCopy } from '@/lib/i18n';
const Picker = lazy(() => import('./UploadGalleryPicker'));

export default function UploadGalleryButton({ locale, onSelect, disabled = false }: {
  locale: 'de' | 'en'; onSelect: (url: string) => void; disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const close = () => {
    setOpen(false);
    requestAnimationFrame(() => trigger.current?.focus());
  };
  return <>
    <button ref={trigger} type="button" disabled={disabled} onClick={() => setOpen(true)} className="mt-2 w-full rounded-xl border border-gold/40 px-3 py-2 text-sm font-medium text-gold transition hover:bg-gold/10 disabled:opacity-40">{uploadGalleryCopy[locale].open}</button>
    {open ? <Suspense fallback={<p role="status">{uploadGalleryCopy[locale].loading}</p>}><Picker locale={locale} onSelect={onSelect} onClose={close} /></Suspense> : null}
  </>;
}
