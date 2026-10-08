'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { uploadGalleryCopy } from '@/lib/i18n';
import type { GalleryImage, UploadGallery } from '@/lib/upload-gallery';

export default function UploadGalleryPicker({ locale, onSelect, onClose }: {
  locale: 'de' | 'en'; onSelect: (url: string) => void; onClose: () => void;
}) {
  const t = uploadGalleryCopy[locale];
  const dialog = useRef<HTMLDialogElement>(null);
  const [folder, setFolder] = useState('products');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [gallery, setGallery] = useState<UploadGallery | null>(null);
  const [selected, setSelected] = useState<GalleryImage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const node = dialog.current;
    node?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { node?.close(); document.body.style.overflow = overflow; };
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(false);
      try {
        const params = new URLSearchParams({ folder, q: search, page: String(page) });
        const response = await fetch(`/api/admin/media/gallery?${params}`, { signal: controller.signal });
        if (!response.ok) throw new Error();
        const result: UploadGallery = await response.json();
        if (!controller.signal.aborted) setGallery(result);
      } catch {
        if (!controller.signal.aborted) setError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 200);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [folder, search, page, retry]);
  const navigate = (path: string) => { setFolder(path); setPage(1); setSearch(''); setSelected(null); setLoading(true); };
  const segments = folder ? folder.split('/') : [];
  return createPortal(
    <dialog ref={dialog} aria-labelledby="upload-gallery-title" onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) onClose(); }}
      className="fixed inset-0 m-auto w-[calc(100%-1rem)] max-w-5xl overflow-hidden rounded-2xl border border-border bg-background p-0 text-foreground shadow-2xl backdrop:bg-black/70">
      <div className="flex max-h-[90dvh] min-h-0 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-4 sm:px-6">
          <h2 id="upload-gallery-title" className="text-lg font-semibold">{t.title}</h2>
          <button type="button" onClick={onClose} className="btn-secondary" autoFocus>{t.close}</button>
        </header>
        <div className="space-y-3 border-b border-border p-4 sm:px-6">
          <nav aria-label={t.root} className="flex flex-wrap items-center gap-2 text-sm">
            <button type="button" className="text-gold underline" onClick={() => navigate('')}>{t.root}</button>
            {segments.map((segment, index) => <span key={index} className="flex items-center gap-2"><span>/</span><button type="button" className="text-gold underline" onClick={() => navigate(segments.slice(0, index + 1).join('/'))}>{segment}</button></span>)}
          </nav>
          <input type="search" aria-label={t.search} placeholder={t.search} value={search} onChange={event => { setSearch(event.target.value); setPage(1); setSelected(null); setLoading(true); }} className="w-full rounded-xl border border-border bg-surface px-3 py-2.5" />
        </div>
        <div className="min-h-0 overflow-y-auto overscroll-contain p-4 sm:px-6" aria-busy={loading}>
          {loading ? <p role="status" className="py-10 text-center text-muted">{t.loading}</p> : error ? <div role="alert" className="py-8 text-center"><p>{t.failed}</p><button type="button" className="btn-secondary mt-3" onClick={() => setRetry(value => value + 1)}>{t.retry}</button></div> : <>
            {gallery?.folders.length ? <div className="mb-4 flex flex-wrap gap-2">{gallery.folders.map(item => <button type="button" key={item.path} onClick={() => navigate(item.path)} className="rounded-xl border border-border bg-surface px-4 py-3 text-sm">📁 {item.name}</button>)}</div> : null}
            {gallery?.images.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{gallery.images.map(image => <button type="button" key={image.url} title={image.name} aria-label={image.name} aria-pressed={selected?.url === image.url} onClick={() => setSelected(image)} className={`overflow-hidden rounded-xl border p-2 text-left ${selected?.url === image.url ? 'border-gold bg-gold/10 ring-2 ring-gold' : 'border-border bg-surface hover:border-gold/60'}`}>
              <div className="relative aspect-square rounded-lg bg-white"><Image src={image.thumbnail} alt={image.name} fill sizes="(max-width: 640px) 40vw, 220px" className="object-contain" /></div>
              <p className="mt-2 truncate text-xs">{image.name}</p>
              <p className="mt-1 text-xs text-muted">{selected?.url === image.url ? `${t.selected} · ` : ''}{Math.round(image.size / 1024)} KB</p>
            </button>)}</div> : <p className="py-8 text-center text-muted">{t.empty}</p>}
          </>}
        </div>
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-4 sm:px-6">
          <div className="flex flex-wrap items-center gap-2 text-sm"><span>{gallery?.total ?? 0} {t.photos} · {t.page} {gallery?.page ?? 1}/{gallery?.pages ?? 1}</span>
            <button type="button" className="btn-secondary disabled:cursor-not-allowed disabled:opacity-40" disabled={loading || page <= 1} onClick={() => { setPage(value => value - 1); setSelected(null); setLoading(true); }}>{t.previous}</button>
            <button type="button" className="btn-secondary disabled:cursor-not-allowed disabled:opacity-40" disabled={loading || page >= (gallery?.pages ?? 1)} onClick={() => { setPage(value => value + 1); setSelected(null); setLoading(true); }}>{t.next}</button>
          </div>
          <button type="button" className="btn-primary disabled:cursor-not-allowed disabled:opacity-40" disabled={!selected || loading || error} onClick={() => { if (selected) { onSelect(selected.url); onClose(); } }}>{t.use}</button>
        </footer>
      </div>
    </dialog>, document.body,
  );
}
