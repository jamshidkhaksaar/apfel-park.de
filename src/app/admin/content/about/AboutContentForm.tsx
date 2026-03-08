'use client';

import { useState, useTransition } from 'react';
import { saveContent } from './actions';
import type { AboutContent, AboutLocaleContent } from './page';

const inputCls =
  'w-full rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50';
const textareaCls =
  'w-full rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 min-h-[80px] resize-y';
const labelCls = 'block text-xs font-medium text-muted mb-1';
const sectionTitleCls = 'text-sm font-semibold text-foreground mb-3';

type Lang = 'de' | 'en';

export default function AboutContentForm({ initialContent }: { initialContent: AboutContent }) {
  const [content, setContent] = useState<AboutContent>(initialContent);
  const [lang, setLang] = useState<Lang>('de');
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const set = (updater: (prev: AboutLocaleContent) => AboutLocaleContent) => {
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
          <div>
            <label className={labelCls}>Intro Text</label>
            <textarea
              className={textareaCls}
              value={loc.intro}
              onChange={(e) => set((p) => ({ ...p, intro: e.target.value }))}
            />
          </div>
        </div>
      </div>

      {/* Story */}
      <div className="tech-card rounded-xl p-5">
        <p className={sectionTitleCls}>Story</p>
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Story Title</label>
            <input
              className={inputCls}
              value={loc.story.title}
              onChange={(e) => set((p) => ({ ...p, story: { ...p.story, title: e.target.value } }))}
            />
          </div>
          <div>
            <label className={labelCls}>Story Content</label>
            <textarea
              className={textareaCls}
              value={loc.story.content}
              onChange={(e) => set((p) => ({ ...p, story: { ...p.story, content: e.target.value } }))}
            />
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="tech-card rounded-xl p-5">
        <p className={sectionTitleCls}>CTA</p>
        <div className="space-y-3">
          <div>
            <label className={labelCls}>CTA Title</label>
            <input
              className={inputCls}
              value={loc.cta.title}
              onChange={(e) => set((p) => ({ ...p, cta: { ...p.cta, title: e.target.value } }))}
            />
          </div>
          <div>
            <label className={labelCls}>CTA Description</label>
            <textarea
              className={textareaCls}
              value={loc.cta.description}
              onChange={(e) => set((p) => ({ ...p, cta: { ...p.cta, description: e.target.value } }))}
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="tech-card rounded-xl p-5">
        <p className={sectionTitleCls}>Stats (up to 4)</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {loc.stats.map((stat, i) => (
            <div key={i} className="space-y-2 rounded-lg border border-white/10 p-3">
              <p className="text-xs text-muted font-medium">Stat {i + 1}</p>
              <div>
                <label className={labelCls}>Value</label>
                <input
                  className={inputCls}
                  value={stat.value}
                  onChange={(e) => {
                    const stats = [...loc.stats];
                    stats[i] = { ...stats[i], value: e.target.value };
                    set((p) => ({ ...p, stats }));
                  }}
                />
              </div>
              <div>
                <label className={labelCls}>Label</label>
                <input
                  className={inputCls}
                  value={stat.label}
                  onChange={(e) => {
                    const stats = [...loc.stats];
                    stats[i] = { ...stats[i], label: e.target.value };
                    set((p) => ({ ...p, stats }));
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Values */}
      <div className="tech-card rounded-xl p-5">
        <p className={sectionTitleCls}>Values</p>
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Values Title</label>
            <input
              className={inputCls}
              value={loc.values.title}
              onChange={(e) => set((p) => ({ ...p, values: { ...p.values, title: e.target.value } }))}
            />
          </div>
          {loc.values.items.map((item, i) => (
            <div key={i}>
              <label className={labelCls}>Item {i + 1}</label>
              <input
                className={inputCls}
                value={item}
                onChange={(e) => {
                  const items = [...loc.values.items];
                  items[i] = e.target.value;
                  set((p) => ({ ...p, values: { ...p.values, items } }));
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="tech-card rounded-xl p-5">
        <p className={sectionTitleCls}>Features</p>
        <div className="space-y-4">
          {loc.features.map((feature, i) => (
            <div key={i} className="space-y-2 rounded-lg border border-white/10 p-3">
              <p className="text-xs text-muted font-medium">Feature {i + 1}</p>
              <div>
                <label className={labelCls}>Title</label>
                <input
                  className={inputCls}
                  value={feature.title}
                  onChange={(e) => {
                    const features = [...loc.features];
                    features[i] = { ...features[i], title: e.target.value };
                    set((p) => ({ ...p, features }));
                  }}
                />
              </div>
              <div>
                <label className={labelCls}>Description</label>
                <textarea
                  className={textareaCls}
                  value={feature.description}
                  onChange={(e) => {
                    const features = [...loc.features];
                    features[i] = { ...features[i], description: e.target.value };
                    set((p) => ({ ...p, features }));
                  }}
                />
              </div>
              <div>
                <label className={labelCls}>Icon (key)</label>
                <input
                  className={inputCls}
                  value={feature.icon}
                  onChange={(e) => {
                    const features = [...loc.features];
                    features[i] = { ...features[i], icon: e.target.value };
                    set((p) => ({ ...p, features }));
                  }}
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
