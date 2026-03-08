'use client';

import { useState, useTransition } from 'react';
import { saveContent } from './actions';
import type { GamingContent, GamingLocaleContent } from './page';

const inputCls =
  'w-full rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50';
const textareaCls =
  'w-full rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 min-h-[80px] resize-y';
const labelCls = 'block text-xs font-medium text-muted mb-1';
const sectionTitleCls = 'text-sm font-semibold text-foreground mb-3';

type Lang = 'de' | 'en';

export default function GamingContentForm({ initialContent }: { initialContent: GamingContent }) {
  const [content, setContent] = useState<GamingContent>(initialContent);
  const [lang, setLang] = useState<Lang>('de');
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const set = (updater: (prev: GamingLocaleContent) => GamingLocaleContent) => {
    setContent((prev) => ({ ...prev, [lang]: updater(prev[lang]) }));
  };

  const handleSave = () => {
    setMessage(null);
    startTransition(async () => {
      const result = await saveContent(content);
      setMessage({ type: result.success ? 'success' : 'error', text: result.message });
    });
  };

  const loc = content[lang];

  return (
    <div className="space-y-6">
      {/* Lang tabs */}
      <div className="flex gap-2">
        {(['de', 'en'] as Lang[]).map((l) => (
          <button
            key={l}
            onClick={() => setLang(l)}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold uppercase transition ${
              lang === l ? 'bg-gold/20 text-gold' : 'text-muted hover:text-foreground'
            }`}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Hero */}
      <div className="tech-card rounded-2xl p-6">
        <p className={sectionTitleCls}>Hero</p>
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Hero Title</label>
            <input
              className={inputCls}
              value={loc.heroTitle}
              onChange={(e) => set((p) => ({ ...p, heroTitle: e.target.value }))}
            />
          </div>
          <div>
            <label className={labelCls}>Hero Subtitle</label>
            <textarea
              className={textareaCls}
              value={loc.heroSubtitle}
              onChange={(e) => set((p) => ({ ...p, heroSubtitle: e.target.value }))}
            />
          </div>
        </div>
      </div>

      {/* Highlights */}
      <div className="tech-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-3">
          <p className={sectionTitleCls}>Highlights</p>
          <button
            type="button"
            onClick={() => set((p) => ({ ...p, highlights: [...p.highlights, ''] }))}
            className="text-xs text-gold hover:text-gold/80 transition"
          >
            + Add highlight
          </button>
        </div>
        <div className="space-y-2">
          {loc.highlights.map((highlight, i) => (
            <div key={i} className="flex gap-2">
              <input
                className={inputCls}
                value={highlight}
                onChange={(e) => {
                  const highlights = [...loc.highlights];
                  highlights[i] = e.target.value;
                  set((p) => ({ ...p, highlights }));
                }}
              />
              <button
                type="button"
                onClick={() => {
                  const highlights = loc.highlights.filter((_, idx) => idx !== i);
                  set((p) => ({ ...p, highlights }));
                }}
                className="shrink-0 text-muted hover:text-red-400 transition text-xs px-2"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Save bar */}
      <div className="sticky bottom-6 z-20 flex items-center justify-between rounded-2xl border border-white/10 bg-surface/90 p-4 backdrop-blur-md shadow-2xl">
        <div className="text-sm">
          {message && (
            <span className={message.type === 'success' ? 'text-green-400' : 'text-red-400'}>
              {message.text}
            </span>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={isPending}
          className="btn-primary flex items-center gap-2 px-6 py-2.5 disabled:opacity-50"
        >
          {isPending ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          Save Changes
        </button>
      </div>
    </div>
  );
}
