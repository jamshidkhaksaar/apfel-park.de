'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { markAdminListsChanged } from '@/lib/admin-list-navigation';
import { catalogToolsText } from '@/lib/i18n';
import ConfirmDeletionDialog from './ConfirmDeletionDialog';

type DeletionPreview = { fingerprint: string; stock: number; title: string };
export default function ProductDeleteButton({ id, title, locale, onDeleted, onConfirmDeletion, previewUrl }: { id: string; title: string; locale: 'de' | 'en'; onDeleted?: () => void; previewUrl?: string; onConfirmDeletion?: (preview: DeletionPreview) => Promise<void> }) {
  const t = catalogToolsText[locale];
  const router = useRouter();
  const [preview, setPreview] = useState<DeletionPreview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const message = (code: string) => t[code as keyof typeof t] ?? t.failed;
  return <><button type="button" aria-label={`${t.deleteProduct}: ${title}`} disabled={busy} className="min-h-9 rounded-lg border border-red-500/30 px-3 py-2 text-xs font-medium text-red-500 disabled:opacity-50" onClick={() => { setBusy(true); setError(''); void fetch(previewUrl ?? `/api/admin/products/delete-preview?id=${encodeURIComponent(id)}`).then(async response => { const value = await response.json(); if (!response.ok) throw new Error(message(value.error)); setPreview(value); }).catch(reason => setError(reason.message)).finally(() => setBusy(false)); }}>{busy ? t.loading : t.deleteProduct}</button>
    {error ? <p role="alert" className="text-xs text-red-500">{error}</p> : null}
    {preview ? <ConfirmDeletionDialog locale={locale} title={`${t.deleteProduct}: ${preview.title || title}`} description={`${t.productDeleteHint}\n${t.units}: ${preview.stock}`} onClose={() => setPreview(null)} onConfirm={async () => {
      if (onConfirmDeletion) await onConfirmDeletion(preview);
      else {
        const response = await fetch(`/api/admin/products?id=${encodeURIComponent(id)}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ confirmation: 'DELETE', fingerprint: preview.fingerprint }) });
        const value = await response.json(); if (!response.ok) throw new Error(message(value.error));
      }
      setPreview(null); markAdminListsChanged(); if (onDeleted) onDeleted(); else if (!onConfirmDeletion) router.refresh();
    }}/> : null}
  </>;
}
