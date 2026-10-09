'use client';
import { phoneEditorText } from '@/lib/smartphone-editor/i18n';
import type { PhoneEntry } from '@/lib/smartphone-editor/model';
import { offerEditorText } from '@/lib/i18n';
import type { OfferPresets } from '@/lib/product-offer-options';
import { localizedText } from '@/lib/product-experience';
import OfferGiftFields from './OfferGiftFields';

const inputClass = 'mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-foreground';
export default function VersionOfferFields({ locale, entry: e, onChange, presets, chargerIncluded }: {
  locale: 'de' | 'en'; entry: PhoneEntry; onChange: (patch: Partial<PhoneEntry>) => void; presets: OfferPresets; chargerIncluded?: boolean | null;
}) {
  const t = phoneEditorText[locale];
  const copy = offerEditorText[locale];
  return <><div className="mt-4 grid gap-4 sm:grid-cols-3">
    {(['price', 'stock', 'sku'] as const).map(key => <label key={key} className="block text-sm" htmlFor={`${e.id}-${key}`}>{t[key]}<input id={`${e.id}-${key}`} className={inputClass} type={key === 'sku' ? 'text' : 'number'} min={key === 'sku' ? undefined : 0} step={key === 'stock' ? 1 : key === 'price' ? '0.01' : undefined} value={e[key]} onChange={event => onChange({ [key]: key === 'sku' ? event.target.value : Number(event.target.value) })} /></label>)}
    <label className="block text-sm">{locale === 'de' ? 'Streichpreis (€)' : 'Compare-at price (€)'}<input className={inputClass} type="number" min="0" step="0.01" value={e.details.compareAtPrice ?? ''} onChange={event => onChange({ details: { ...e.details, compareAtPrice: event.target.value ? Number(event.target.value) : null } })} /></label>
    <div className="sm:col-span-2"><div className="grid grid-cols-2 gap-3">{(['batteryHealth', 'batteryHealthMax'] as const).map(key => <label className="block text-sm" key={key}>{key === 'batteryHealth' ? copy.batteryFrom : copy.batteryTo}<input className={inputClass} type="number" min="1" max="100" step="1" value={e[key] ?? ''} onChange={event => onChange({ [key]: event.target.value ? Number(event.target.value) : null })}/></label>)}</div><p className="mt-2 text-xs text-muted">{copy.batteryHint}</p></div>
    <label className="block text-sm sm:col-span-3">{copy.notePreset}<select aria-label={copy.notePreset} className={inputClass} value={e.conditionNotePresetId ?? ''} onChange={event => { const preset = presets.conditionNotes.find(item => item.id === event.target.value); if (preset) onChange({ conditionNote: localizedText(preset.text, locale), conditionNotePresetId: preset.id }); }}><option value="">{copy.choose}</option>{presets.conditionNotes.filter(item => item.condition === e.condition).map(item => <option key={item.id} value={item.id}>{localizedText(item.label, locale)}</option>)}</select></label>
    {(['conditionNote', 'defects', 'accessories'] as const).map(key => <label key={key} htmlFor={`${e.id}-${key}`} className="block text-sm">{t[key]}<textarea aria-label={t[key]} id={`${e.id}-${key}`} className={inputClass} value={e[key]} onChange={event => onChange({ [key]: event.target.value })} /></label>)}
    {e.condition !== 'new' ? <label className="flex items-center gap-3 text-sm sm:col-span-3"><input type="checkbox" checked={e.hasRealProductPhotos} onChange={event => onChange({ hasRealProductPhotos: event.target.checked })} />{t.hasRealProductPhotos}</label> : null}
  </div><OfferGiftFields locale={locale} entry={e} presets={presets} chargerIncluded={chargerIncluded} onChange={onChange}/></>;
}
