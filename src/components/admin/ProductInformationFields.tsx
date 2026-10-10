'use client';

import EprelPicker from './EprelPicker';
import { eprelCycles, eprelEndurance } from '@/lib/eprel';
import type { ProductPayload } from '@/lib/product-write-payload';

const inputClass = 'mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-foreground';
export default function ProductInformationFields({ locale, value, onChange }: {
  locale: 'de' | 'en'; value: ProductPayload; onChange: (patch: ProductPayload) => void;
}) {
  const de = locale === 'de';
  const text = (label: string, content: string, update: (text: string) => void) => <label className="block text-sm">{label}<textarea className={inputClass} rows={3} value={content} onChange={event => update(event.target.value)} /></label>;
  return <div className="space-y-5">
    {text(de ? 'Highlights (eine Zeile je Merkmal)' : 'Feature bullets (one per line)', (value.featureBullets ?? []).join('\n'), content => onChange({ featureBullets: content.split('\n') }))}
    {text(de ? 'Sicherheitsdokumente (eine URL je Zeile)' : 'Safety documents (one URL per line)', (value.safetyDocuments ?? []).join('\n'), content => onChange({ safetyDocuments: content.split('\n') }))}
    <section className="space-y-3 rounded-xl border border-border p-4">
      <h3 className="font-semibold">{de ? 'EU-Energielabel (EPREL)' : 'EU energy label (EPREL)'}</h3>
      <EprelPicker locale={locale} onSelect={match => onChange({ eprelId: match.registration_number, energyLabel: {
        efficiencyClass: match.energy_class ?? undefined,
        batteryEndurance: eprelEndurance(match.battery_endurance_minutes) ?? undefined,
        batteryCycles: eprelCycles(match.battery_endurance_cycles) ?? undefined,
        reliabilityClass: match.reliability_class ?? undefined, repairabilityClass: match.repairability_class ?? undefined,
        ipRating: match.ingress_protection ?? undefined, labelImage: match.label_image ?? undefined,
        ficheDe: match.fiche_de ?? undefined, ficheEn: match.fiche_en ?? undefined,
      } })} />
      <label className="block text-sm">EPREL ID<input className={inputClass} value={value.eprelId ?? ''} onChange={event => onChange({ eprelId: event.target.value })} /></label>
      <div className="grid gap-3 sm:grid-cols-2">
        {([
          ['efficiencyClass', de ? 'Energieklasse' : 'Energy class'], ['batteryEndurance', de ? 'Akkulaufzeit' : 'Battery endurance'],
          ['batteryCycles', de ? 'Ladezyklen' : 'Battery cycles'], ['reliabilityClass', de ? 'Zuverlässigkeitsklasse' : 'Reliability class'],
          ['repairabilityClass', de ? 'Reparierbarkeitsklasse' : 'Repairability class'], ['ipRating', 'IP rating'],
          ['labelImage', de ? 'Labelbild URL' : 'Label image URL'], ['ficheDe', 'Fiche DE URL'], ['ficheEn', 'Fiche EN URL'],
        ] as const).map(([key, label]) => <label key={key} className="block text-sm">{label}<input type={key === 'batteryCycles' ? 'number' : 'text'} className={inputClass} value={value.energyLabel?.[key] ?? ''} onChange={event => onChange({ energyLabel: { ...value.energyLabel, [key]: key === 'batteryCycles' ? (event.target.value ? Number(event.target.value) : undefined) : event.target.value } })} /></label>)}
      </div>
    </section>
    <div className="grid gap-3 sm:grid-cols-3">
      {(['chargerIncluded', 'usbPdSupported', 'batteryIncluded'] as const).map(key => <label key={key} className="block text-sm">{{ chargerIncluded: de ? 'Ladegerät enthalten' : 'Charger included', usbPdSupported: 'USB Power Delivery', batteryIncluded: de ? 'Akku enthalten' : 'Battery included' }[key]}
        <select className={inputClass} value={String(key === 'batteryIncluded' ? value.batteryDetails?.included ?? '' : value[key] ?? '')} onChange={event => onChange(key === 'batteryIncluded' ? { batteryDetails: { ...value.batteryDetails, included: event.target.value === '' ? undefined : event.target.value === 'true' } } : { [key]: event.target.value === '' ? null : event.target.value === 'true' })}>
          <option value="">{de ? 'Unbekannt' : 'Unknown'}</option><option value="true">{de ? 'Ja' : 'Yes'}</option><option value="false">{de ? 'Nein' : 'No'}</option>
        </select>
      </label>)}
      {(['chargingPowerMinW', 'chargingPowerMaxW', 'wattHours'] as const).map(key => <label key={key} className="block text-sm">{{ chargingPowerMinW: de ? 'Ladeleistung min. (W)' : 'Minimum charging power (W)', chargingPowerMaxW: de ? 'Ladeleistung max. (W)' : 'Maximum charging power (W)', wattHours: de ? 'Akku (Wh)' : 'Battery (Wh)' }[key]}
        <input type="number" step="any" className={inputClass} value={key === 'wattHours' ? value.batteryDetails?.wattHours ?? '' : value[key] ?? ''} onChange={event => onChange(key === 'wattHours' ? { batteryDetails: { ...value.batteryDetails, wattHours: event.target.value ? Number(event.target.value) : undefined } } : { [key]: event.target.value ? Number(event.target.value) : null })} />
      </label>)}
    </div>
    {(['de', 'en'] as const).map(lang => <section key={lang} className="space-y-3 rounded-xl border border-border p-4">
      <h3 className="font-semibold">FAQ {lang.toUpperCase()}</h3>
      {(value.faq?.[lang] ?? []).map((row, index) => <div key={index} className="grid gap-3 sm:grid-cols-[1fr_2fr_auto]">
        <input aria-label={`${de ? 'Frage' : 'Question'} ${lang} ${index + 1}`} className={inputClass} value={row.q ?? ''} onChange={event => onChange({ faq: { ...value.faq, [lang]: value.faq?.[lang]?.map((item, i) => i === index ? { ...item, q: event.target.value } : item) } })} />
        <textarea aria-label={`${de ? 'Antwort' : 'Answer'} ${lang} ${index + 1}`} className={inputClass} value={row.a ?? ''} onChange={event => onChange({ faq: { ...value.faq, [lang]: value.faq?.[lang]?.map((item, i) => i === index ? { ...item, a: event.target.value } : item) } })} />
        <button type="button" className="btn-secondary" onClick={() => onChange({ faq: { ...value.faq, [lang]: value.faq?.[lang]?.filter((_, i) => i !== index) } })}>{de ? 'Entfernen' : 'Remove'}</button>
      </div>)}
      <button type="button" className="btn-secondary" onClick={() => onChange({ faq: { ...value.faq, [lang]: [...value.faq?.[lang] ?? [], { q: '', a: '' }] } })}>{de ? 'FAQ ergänzen' : 'Add FAQ'}</button>
    </section>)}
  </div>;
}
