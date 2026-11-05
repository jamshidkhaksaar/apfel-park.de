'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

type SubmissionNotice = {
  id: string;
  title: string;
  displayName: string;
  submittedAt: string;
};

const seenKey = 'telegram-draft-notifications-seen';

// Top-right toast for the owner: a Telegram draft was just submitted for
// review ("a new draft is added by <member> for <device>"). The last seen
// timestamp is persisted so nothing is lost while no admin tab is open.
export default function TelegramSubmissionToasts({
  locale,
}: {
  locale: 'de' | 'en';
}) {
  const [items, setItems] = useState<SubmissionNotice[]>([]);
  const since = useRef('');
  useEffect(() => {
    try {
      since.current =
        window.localStorage.getItem(seenKey) ?? new Date().toISOString();
      window.localStorage.setItem(seenKey, since.current);
    } catch {
      since.current = new Date().toISOString();
    }
    let active = true;
    const poll = async () => {
      try {
        const response = await fetch(
          `/api/admin/telegram-products/notifications?since=${encodeURIComponent(since.current)}`,
          { cache: 'no-store' },
        );
        if (!response.ok) return;
        const payload = (await response.json()) as {
          items?: SubmissionNotice[];
        };
        const fresh = Array.isArray(payload.items) ? payload.items : [];
        if (!active || !fresh.length) return;
        since.current = fresh.reduce(
          (latest, item) =>
            item.submittedAt > latest ? item.submittedAt : latest,
          since.current,
        );
        try {
          window.localStorage.setItem(seenKey, since.current);
        } catch {
          // Storage is best-effort; the poll cursor already advanced.
        }
        setItems((current) =>
          [
            ...fresh.filter(
              (item) => !current.some((existing) => existing.id === item.id),
            ),
            ...current,
          ].slice(0, 4),
        );
      } catch {
        // Notifications are best-effort and never block the workspace.
      }
    };
    void poll();
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void poll();
    }, 20000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);
  if (!items.length) return null;
  return (
    <div
      className="fixed right-4 top-4 z-[80] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2"
      role="status"
      aria-live="polite"
    >
      {items.map((item) => (
        <div
          key={item.id}
          className="rounded-2xl border border-gold/40 bg-surface/95 p-4 shadow-xl backdrop-blur"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">
                {locale === 'de'
                  ? '📥 Neuer Entwurf hinzugefügt'
                  : '📥 New draft added'}
              </p>
              <p className="mt-1 break-words text-sm text-muted">
                {item.displayName}
                {item.title ? ` · ${item.title}` : ''}
              </p>
              <Link
                href="/admin/products?view=intake"
                className="mt-2 inline-block text-xs text-gold underline"
              >
                {locale === 'de' ? 'Zur Prüfung öffnen' : 'Open for review'}
              </Link>
            </div>
            <button
              type="button"
              aria-label={locale === 'de' ? 'Meldung schließen' : 'Dismiss'}
              className="text-lg leading-none text-muted transition hover:text-foreground"
              onClick={() =>
                setItems((current) =>
                  current.filter((entry) => entry.id !== item.id),
                )
              }
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
