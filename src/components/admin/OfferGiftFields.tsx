'use client';

import { useState } from 'react';
import { offerEditorText } from '@/lib/i18n';
import { sanitizeProductExperienceProfile, localizedText } from '@/lib/product-experience';
import { offerIcons, packageItemIcon, type OfferPresets, type OfferIcon } from '@/lib/product-offer-options';
import type { PhoneEntry } from '@/lib/smartphone-editor/model';
import OfferItemIcon from '../OfferItemIcon';

const input = 'mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground';
export default function OfferGiftFields({ locale, entry, presets, chargerIncluded, onChange }: {
  locale: 'de' | 'en'; entry: PhoneEntry; presets: OfferPresets; chargerIncluded?: boolean | null; onChange: (patch: Partial<PhoneEntry>) => void;
}) {
  const t = offerEditorText[locale];
  const profile = entry.experience ?? sanitizeProductExperienceProfile({});
  const [name, setName] = useState('');
  const [icon, setIcon] = useState<OfferIcon>('gift');
  const setCharger = (status: boolean | null) => onChange({ details: { ...entry.details, chargerIncluded: status }, experience: { ...profile, packageContents: profile.packageContents.map(item => packageItemIcon(item) === 'charger' ? { ...item, included: status === true } : item) } });
  return <section className="mt-5 space-y-4 rounded-xl border border-border bg-background/40 p-4">
    <h4 className="font-semibold">{t.gifts}</h4><p className="text-sm text-muted">{t.giftsHint}</p>
    <label className="block text-sm"><span className="flex gap-2"><OfferItemIcon kind="charger" excluded={chargerIncluded === false}/>{t.chargerStatus}</span><select aria-label={t.chargerStatus} className={input} value={chargerIncluded == null ? '' : String(chargerIncluded)} onChange={event => setCharger(event.target.value === '' ? null : event.target.value === 'true')}><option value="">{t.unknown}</option><option value="true">{t.included}</option><option value="false">{t.excluded}</option></select></label>
    <div className="grid gap-3 sm:grid-cols-2">{presets.gifts.map(preset => {
      const selected = profile.packageContents.some(item => item.presetId === preset.id && item.included);
      return <label key={preset.id} className={`flex min-h-12 items-center gap-3 rounded-xl border p-3 text-sm ${selected ? 'border-gold/50 bg-gold/5' : 'border-border'}`}>
        <input type="checkbox" checked={selected} disabled={!selected && profile.packageContents.length >= 30} onChange={event => {
          const contents = profile.packageContents.filter(item => item.presetId !== preset.id);
          if (event.target.checked) contents.push({ presetId: preset.id, label: { ...preset.label }, icon: preset.icon, isGift: true, included: true });
          const charger = preset.icon === 'charger' ? event.target.checked : undefined;
          onChange({ experience: { ...profile, enabledSections: { ...profile.enabledSections, packageContents: true }, packageContents: charger !== undefined ? contents.map(item => packageItemIcon(item) === 'charger' ? { ...item, included: charger } : item) : contents }, ...(charger !== undefined ? { details: { ...entry.details, chargerIncluded: charger } } : {}) });
        }}/><OfferItemIcon kind={preset.icon}/><span>{localizedText(preset.label, locale)}</span>
      </label>;
    })}</div>
    {profile.packageContents.filter(item => item.isGift && !presets.gifts.some(preset => preset.id === item.presetId)).map((item, index) => <div key={`${item.presetId ?? item.label.de}-${index}`} className="flex flex-wrap items-center gap-3 text-sm"><OfferItemIcon kind={packageItemIcon(item)}/><span>{localizedText(item.label, locale)}</span><button type="button" className="btn-secondary" onClick={() => onChange({ experience: { ...profile, packageContents: profile.packageContents.filter(candidate => candidate !== item) }, ...(packageItemIcon(item) === 'charger' ? { details: { ...entry.details, chargerIncluded: false } } : {}) })}>{t.remove}</button></div>)}
    <details><summary className="cursor-pointer text-sm font-medium text-gold">{t.manualGift}</summary><div className="mt-3 grid gap-3 sm:grid-cols-[2fr_1fr_auto]">
      <label className="text-sm">{t.customLabel}<input className={input} value={name} onChange={event => setName(event.target.value)} maxLength={120}/></label>
      <label className="text-sm">{t.icon}<select aria-label={t.icon} className={input} value={icon} onChange={event => setIcon(event.target.value as OfferIcon)}>{offerIcons.map(key => <option key={key} value={key}>{t[key]}</option>)}</select></label>
      <button type="button" className="btn-secondary self-end" disabled={!name.trim() || profile.packageContents.length >= 30} onClick={() => { onChange({ experience: { ...profile, enabledSections: { ...profile.enabledSections, packageContents: true }, packageContents: [...profile.packageContents, { presetId: crypto.randomUUID(), label: { de: name.trim(), en: name.trim() }, icon, isGift: true, included: true }] }, ...(icon === 'charger' ? { details: { ...entry.details, chargerIncluded: true } } : {}) }); setName(''); }}>{t.add}</button>
    </div></details>
  </section>;
}
