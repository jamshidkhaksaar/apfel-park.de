'use client';
import { phoneEditorText } from '@/lib/smartphone-editor/i18n';
import type { PhoneEntry } from '@/lib/smartphone-editor/model';

const inputClass = 'mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-foreground';
export default function VersionOfferFields({ locale, entry: e, onChange }: {
  locale: 'de' | 'en'; entry: PhoneEntry; onChange: (patch: Partial<PhoneEntry>) => void;
}) {
  const t = phoneEditorText[locale];
  return <div className="mt-4 grid gap-4 sm:grid-cols-3">
    {(['price', 'stock', 'sku'] as const).map(key => <label key={key} className="block text-sm" htmlFor={`${e.id}-${key}`}>{t[key]}<input id={`${e.id}-${key}`} className={inputClass} type={key === 'sku' ? 'text' : 'number'} min={key === 'sku' ? undefined : 0} step={key === 'stock' ? 1 : key === 'price' ? '0.01' : undefined} value={e[key]} onChange={event => onChange({ [key]: key === 'sku' ? event.target.value : Number(event.target.value) })} /></label>)}
    <label className="block text-sm">{locale === 'de' ? 'Streichpreis (€)' : 'Compare-at price (€)'}<input className={inputClass} type="number" min="0" step="0.01" value={e.details.compareAtPrice ?? ''} onChange={event => onChange({ details: { ...e.details, compareAtPrice: event.target.value ? Number(event.target.value) : null } })} /></label>
    <label className="block text-sm">{t.batteryHealth}<input className={inputClass} type="number" min="1" max="100" step="1" value={e.batteryHealth ?? ''} onChange={event => onChange({ batteryHealth: event.target.value ? Number(event.target.value) : null })} /></label>
    {(['conditionNote', 'defects', 'accessories'] as const).map(key => <label key={key} htmlFor={`${e.id}-${key}`} className="block text-sm">{t[key]}<textarea id={`${e.id}-${key}`} className={inputClass} value={e[key]} onChange={event => onChange({ [key]: event.target.value })} /></label>)}
    {e.condition !== 'new' ? <label className="flex items-center gap-3 text-sm sm:col-span-3"><input type="checkbox" checked={e.hasRealProductPhotos} onChange={event => onChange({ hasRealProductPhotos: event.target.checked })} />{t.hasRealProductPhotos}</label> : null}
  </div>;
}
