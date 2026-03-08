'use client';

import { useState, useTransition } from 'react';
import { saveContent } from './actions';
import type { TermsContent, TermsLocaleContent, TermsSection } from './page';

const inputCls =
  'w-full rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50';
const textareaCls =
  'w-full rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 min-h-[80px] resize-y';
const labelCls = 'block text-xs font-medium text-muted mb-1';
const sectionTitleCls = 'text-sm font-semibold text-foreground mb-3';

type Lang = 'de' | 'en';

export default function TermsContentForm({ initialContent }: { initialContent: TermsContent }) {
  const [content, setContent] = useState<TermsContent>(initialContent);
  const [lang, setLang] = useState<Lang>('de');
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const set = (updater: (prev: TermsLocaleContent) => TermsLocaleContent) => {
    setContent((prev) => ({ ...prev, [lang]: updater(prev[lang]) }));
  };

  const addSection = () => {
    set((p) => ({ ...p, sections: [...p.sections, { title: '', content: '' }] }));
  };

  const removeSection = (index: number) => {
    set((p) => ({ ...p, sections: p.sections.filter((_, i) => i !== index) }));
  };

  const updateSection = (index: number, field: keyof TermsSection, value: string) => {
    set((p) => {
      const sections = [...p.sections];
      sections[index] = { ...sections[index], [field]: value };
      return { ...p, sections };
    });
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
      <div className="tech-card rounded-xl p-5">
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

      {/* Sections */}
      <div className="tech-card rounded-xl p-5">
        <div className="mb-4 flex items-center justify-between">
          <p className={sectionTitleCls + ' mb-0'}>Terms Sections</p>
          <button
            onClick={addSection}
            className="flex items-center gap-1 rounded-lg border border-gold/30 px-3 py-1.5 text-xs text-gold hover:bg-gold/10 transition"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Section
          </button>
        </div>
        <div className="space-y-4">
          {loc.sections.map((section, i) => (
            <div key={i} className="space-y-3 rounded-lg border border-white/10 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted">Section {i + 1}</span>
                {loc.sections.length > 1 && (
                  <button
                    onClick={() => removeSection(i)}
                    className="rounded p-1 text-xs text-red-400 hover:bg-red-500/10 transition"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
              <div>
                <label className={labelCls}>Section Title</label>
                <input
                  className={inputCls}
                  value={section.title}
                  onChange={(e) => updateSection(i, 'title', e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Section Content</label>
                <textarea
                  className={textareaCls + ' min-h-[120px]'}
                  value={section.content}
                  onChange={(e) => updateSection(i, 'content', e.target.value)}
                />
              </div>
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
