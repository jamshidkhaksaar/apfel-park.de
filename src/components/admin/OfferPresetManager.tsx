'use client';

import { useState } from 'react';
import { offerEditorText } from '@/lib/i18n';
import { offerIcons, type OfferPresets, type OfferIcon } from '@/lib/product-offer-options';
import OfferItemIcon from '../OfferItemIcon';

const input = 'mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground';
export default function OfferPresetManager({ locale, value, onSave, onReload }: {
  locale: 'de' | 'en'; value: OfferPresets; onSave: (value: OfferPresets) => Promise<void>; onReload: () => Promise<void>;
}) {
  const t = offerEditorText[locale];
  const [edited, setEdited] = useState(value);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true); setStatus('');
    try { await onSave(edited); setStatus(t.saved); }
    catch (error) { setStatus(error instanceof Error && error.message === 'presets_conflict' ? t.conflict : error instanceof Error && error.message === 'invalid_presets' ? t.invalid : t.failed); }
    finally { setBusy(false); }
  };
  return <details className="rounded-2xl border border-border bg-surface/40 p-4">
    <summary className="cursor-pointer text-sm font-semibold text-foreground">{t.presets}</summary>
    <p className="mt-3 text-sm text-muted">{t.presetsHint}</p>
    <fieldset disabled={busy} className="mt-4 space-y-5">
      <h3 className="font-semibold">{t.conditionNotes}</h3>
      {edited.conditionNotes.map((preset, index) => <section key={preset.id} className="space-y-3 rounded-xl border border-border p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-sm">{t.condition}<select aria-label={t.condition} className={input} value={preset.condition} onChange={event => setEdited(previous => ({ ...previous, conditionNotes: previous.conditionNotes.map((item, i) => i === index ? { ...item, condition: event.target.value as typeof item.condition } : item) }))}>{(['new', 'open_box', 'used'] as const).map(condition => <option key={condition} value={condition}>{t[condition]}</option>)}</select></label>
          {(['de', 'en'] as const).map(lang => <label className="text-sm" key={lang}>{lang === 'de' ? t.labelDe : t.labelEn}<input className={input} value={preset.label[lang]} onChange={event => setEdited(previous => ({ ...previous, conditionNotes: previous.conditionNotes.map((item, i) => i === index ? { ...item, label: { ...item.label, [lang]: event.target.value } } : item) }))}/></label>)}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">{(['de', 'en'] as const).map(lang => <label className="text-sm" key={lang}>{lang === 'de' ? t.textDe : t.textEn}<textarea aria-label={lang === 'de' ? t.textDe : t.textEn} rows={3} className={input} value={preset.text[lang]} onChange={event => setEdited(previous => ({ ...previous, conditionNotes: previous.conditionNotes.map((item, i) => i === index ? { ...item, text: { ...item.text, [lang]: event.target.value } } : item) }))}/></label>)}</div>
        <div className="flex flex-wrap items-center justify-between gap-3"><label className="flex gap-2 text-sm"><input type="checkbox" checked={edited.defaults[preset.condition] === preset.id} onChange={event => setEdited(previous => ({ ...previous, defaults: { ...previous.defaults, [preset.condition]: event.target.checked ? preset.id : undefined } }))}/>{t.defaultNote}</label><button type="button" className="btn-secondary" onClick={() => setEdited(previous => ({ ...previous, conditionNotes: previous.conditionNotes.filter(item => item.id !== preset.id) }))}>{t.remove}</button></div>
      </section>)}
      <button type="button" className="btn-secondary" onClick={() => setEdited(previous => ({ ...previous, conditionNotes: [...previous.conditionNotes, { id: crypto.randomUUID(), condition: 'used', label: { de: '', en: '' }, text: { de: '', en: '' } }] }))}>{t.addNote}</button>
      <h3 className="font-semibold">{t.giftPresets}</h3>
      {edited.gifts.map((preset, index) => <section key={preset.id} className="grid items-end gap-3 rounded-xl border border-border p-4 sm:grid-cols-[1fr_1fr_1fr_auto]">
        {(['de', 'en'] as const).map(lang => <label className="text-sm" key={lang}>{lang === 'de' ? t.labelDe : t.labelEn}<input className={input} value={preset.label[lang]} onChange={event => setEdited(previous => ({ ...previous, gifts: previous.gifts.map((item, i) => i === index ? { ...item, label: { ...item.label, [lang]: event.target.value } } : item) }))}/></label>)}
        <label className="text-sm"><span className="flex gap-2"><OfferItemIcon kind={preset.icon}/>{t.icon}</span><select aria-label={t.icon} className={input} value={preset.icon} onChange={event => setEdited(previous => ({ ...previous, gifts: previous.gifts.map((item, i) => i === index ? { ...item, icon: event.target.value as OfferIcon } : item) }))}>{offerIcons.map(icon => <option key={icon} value={icon}>{t[icon]}</option>)}</select></label>
        <button type="button" className="btn-secondary" onClick={() => setEdited(previous => ({ ...previous, gifts: previous.gifts.filter(item => item.id !== preset.id) }))}>{t.remove}</button>
      </section>)}
      <button type="button" className="btn-secondary" onClick={() => setEdited(previous => ({ ...previous, gifts: [...previous.gifts, { id: crypto.randomUUID(), label: { de: '', en: '' }, icon: 'gift' }] }))}>{t.addGift}</button>
      <div className="flex flex-wrap gap-3"><button type="button" className="btn-primary" onClick={() => void save()}>{busy ? t.saving : t.save}</button><button type="button" className="btn-secondary" onClick={() => void onReload().catch(() => setStatus(t.failed))}>{t.reload}</button></div>
      {status ? <p role="status" className="text-sm">{status}</p> : null}
    </fieldset>
  </details>;
}
