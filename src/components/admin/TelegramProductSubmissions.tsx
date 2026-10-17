'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { telegramText } from '@/lib/telegram-products/i18n';
import type {
  PhoneDocument,
  PublishResult,
} from '@/lib/smartphone-editor/model';

export type TelegramSubmissionView = {
  id: string;
  draft_id: string;
  archived?: boolean;
  status:
    | 'submitted'
    | 'changes_requested'
    | 'published'
    | 'rejected'
    | 'cancelled';
  review_note: string | null;
  display_name: string;
  telegram_id: string;
  revision: number;
  document: PhoneDocument;
  results: PublishResult[];
  state: {
    sources: Array<{ title: string; url: string; retrievedAt: string }>;
    warnings: string[];
  };
  assets: Array<{ id: string; kind: string; edited: boolean }>;
  events: Array<{ event_type: string; actor: string; created_at: string }>;
  blockers: string[];
};
export default function TelegramProductSubmissions({
  locale,
  rows,
  history = false,
  isOwner = false,
}: {
  locale: 'de' | 'en';
  rows: TelegramSubmissionView[];
  history?: boolean;
  isOwner?: boolean;
}) {
  const t = telegramText[locale],
    router = useRouter();
  const [notes, setNotes] = useState<Record<string, string>>({}),
    [busy, setBusy] = useState(''),
    [error, setError] = useState('');
  const decide = async (row: TelegramSubmissionView, action: string) => {
    setBusy(row.id);
    setError('');
    try {
      const response = await fetch(
        `/api/admin/telegram-products/submissions/${row.id}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action,
            note: notes[row.id],
            revision: row.revision,
          }),
        },
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      router.refresh();
    } catch (e) {
      setError(
        t.errors[(e as Error).message as keyof typeof t.errors] ?? t.error,
      );
    } finally {
      setBusy('');
    }
  };
  return (
    <section className="space-y-4 rounded-2xl border border-border/60 bg-surface/30 p-4 sm:p-5">
      <h2 className="text-xl font-semibold">
        {history ? t.history : t.submissions}
      </h2>
      {error ? <p role="alert">{error}</p> : null}
      {!rows.length ? (
        <p className="text-sm text-muted">{t.noSubmissions}</p>
      ) : (
        rows.map((row) => (
          <article
            key={row.id}
            className="min-w-0 rounded-xl border border-border p-4 space-y-3"
          >
            <div className="flex flex-wrap justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-semibold break-words">
                  {row.document.shared.title}
                </h3>
                <p className="text-sm text-muted">
                  {row.display_name} · {t[row.status]} · #{row.revision}
                </p>
              </div>
              {row.archived ? <p className="text-sm text-muted">{t.archived}</p> : <div className="flex flex-wrap gap-2">
                <Link
                  className="btn-secondary"
                  href={`/admin/products/phone?draft=${row.draft_id}&returnTo=${encodeURIComponent('/admin/products?view=intake')}`}
                >
                  {t.review}
                </Link>
                {isOwner ? (
                  <Link
                    className="btn-secondary"
                    href={`/admin/products/telegram/${row.id}/preview`}
                  >
                    {t.preview}
                  </Link>
                ) : null}
              </div>}
            </div>
            <ul className="space-y-1 text-sm">
              {row.document.entries.map((e) => (
                <li key={e.id}>
                  {[
                    e.color,
                    e.storage,
                    ...Object.values(e.configuration ?? {}),
                    e.condition,
                  ]
                    .filter(Boolean)
                    .join(' · ')}{' '}
                  ·{' '}
                  {new Intl.NumberFormat(locale, {
                    style: 'currency',
                    currency: 'EUR',
                  }).format(e.price)}{' '}
                  × {e.stock}
                </li>
              ))}
            </ul>
            {row.review_note ? (
              <p className="text-sm text-gold break-words">{row.review_note}</p>
            ) : null}
            {row.blockers.length ? (
              <details>
                <summary className="cursor-pointer text-sm text-gold">
                  {t.blockers} ({row.blockers.length})
                </summary>
                <ul className="mt-2 list-disc pl-5 text-sm space-y-1">
                  {row.blockers.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </details>
            ) : null}
            {row.state.sources.length ? (
              <details>
                <summary className="cursor-pointer text-sm">
                  {t.sources}
                </summary>
                <ul className="mt-2 text-sm space-y-2">
                  {row.state.sources.map((s) => (
                    <li key={s.url}>
                      <a
                        className="break-all text-gold underline"
                        href={s.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {s.title || s.url}
                      </a>
                      <span className="ml-2 text-muted">{s.retrievedAt}</span>
                    </li>
                  ))}
                </ul>
                {row.state.warnings.map((w, i) => (
                  <p key={i} className="mt-2 text-sm text-muted">
                    {w}
                  </p>
                ))}
              </details>
            ) : null}
            {isOwner && row.assets.length ? (
              <details>
                <summary className="cursor-pointer text-sm">{t.photos}</summary>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {row.assets.map((asset) => (
                    <div key={asset.id} className="space-y-2">
                      <p className="text-xs text-muted">
                        {asset.kind} · {t.original}
                      </p>
                      <Image
                        alt={t.original}
                        src={`/api/admin/telegram-products/assets/${asset.id}`}
                        unoptimized
                        width={320}
                        height={240}
                        className="h-48 w-full object-contain rounded-xl bg-white"
                      />
                      {asset.edited ? (
                        <>
                          <p className="text-xs text-muted">{t.edited}</p>
                          <Image
                            alt={t.edited}
                            src={`/api/admin/telegram-products/assets/${asset.id}?edited=true`}
                            unoptimized
                            width={320}
                            height={240}
                            className="h-48 w-full object-contain rounded-xl bg-white"
                          />
                        </>
                      ) : null}
                    </div>
                  ))}
                </div>
              </details>
            ) : null}
            {row.events.length ? (
              <details>
                <summary className="cursor-pointer text-sm">
                  {t.history}
                </summary>
                <ul className="mt-2 text-xs text-muted space-y-1">
                  {row.events.map((e, i) => (
                    <li key={i}>
                      {e.created_at} · {e.event_type} · {e.actor}
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}
            {isOwner && row.status === 'submitted' ? (
              <div className="flex flex-wrap gap-2">
                <label className="w-full text-sm">
                  {t.note}
                  <textarea
                    className="mt-2 w-full rounded-xl border border-border bg-surface p-3"
                    maxLength={1000}
                    value={notes[row.id] ?? ''}
                    onChange={(e) =>
                      setNotes({ ...notes, [row.id]: e.target.value })
                    }
                  />
                </label>
                <button
                  className="btn-secondary"
                  disabled={Boolean(busy) || !notes[row.id]?.trim()}
                  onClick={() => void decide(row, 'changes')}
                >
                  {t.requestChanges}
                </button>
                <button
                  className="btn-secondary"
                  disabled={Boolean(busy) || !notes[row.id]?.trim()}
                  onClick={() => void decide(row, 'reject')}
                >
                  {t.reject}
                </button>
              </div>
            ) : null}
            {row.results.length ? (
              <ul className="flex flex-wrap gap-3 text-sm">
                {row.results.map((r) => (
                  <li key={r.entryId}>
                    <Link
                      className="text-gold underline"
                      href={`/admin/products/${r.productId}`}
                    >
                      {r.productId.slice(0, 8)}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </article>
        ))
      )}
    </section>
  );
}
