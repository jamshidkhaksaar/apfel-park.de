'use client';
import { useState } from 'react';
import { validRepairDate, type RepairCampaignRules } from '@/lib/repair-campaign-rules';
export default function RepairCampaignDates({locale,value,onChange}:{locale:'de'|'en';value:RepairCampaignRules;onChange:(value:RepairCampaignRules)=>void}){
  const de=locale==='de',[date,setDate]=useState('');
  return <fieldset className="mt-5 space-y-3 rounded-xl border border-gold/30 p-4"><legend className="px-2 font-semibold">{de?'Reparatur-Aktionstage':'Repair promotion dates'}</legend>
    <p className="text-sm text-muted">{value.weeklyDays?.length
      ? (de?'Der Rabatt wiederholt sich an den oben gewählten Wochentagen.':'The discount repeats on the selected weekdays above.')
      : (de?'Alternativ einzelne Kalenderdaten wählen. Start/Ende oben begrenzen zusätzlich, wann eine Anfrage eingereicht werden darf.':'Alternatively choose individual calendar dates. Start/end above also limit when a request may be submitted.')}</p>
    <label className="block text-sm">{de?'Der Rabatt gilt für':'The discount applies to'}<select className="mt-2 min-h-11 w-full rounded-lg border border-border bg-background px-3" value={value.dateBasis} onChange={e=>onChange({...value,dateBasis:e.target.value as RepairCampaignRules['dateBasis']})}><option value="repair_date">{de?'Reparatur am gewählten Tag (Wunschtermin)':'Repair requested for the selected day'}</option><option value="booking_date">{de?'Online-Anfrage am gewählten Tag':'Online request submitted on the selected day'}</option></select></label>
    {!value.weeklyDays?.length?<div className="flex flex-wrap items-end gap-3"><label className="min-w-0 basis-full text-sm sm:flex-1 sm:basis-auto">{de?'Aktionstag hinzufügen':'Add promotion date'}<input type="date" className="mt-2 min-h-11 w-full rounded-lg border border-border bg-background px-3" value={date} onChange={e=>setDate(e.target.value)}/></label><button type="button" className="btn-secondary min-h-11 w-full sm:w-auto" disabled={!validRepairDate(date)||value.dates.length>=60} onClick={()=>{onChange({...value,dates:[...new Set([...value.dates,date])].sort()});setDate('');}}>{de?'Hinzufügen':'Add date'}</button></div>:null}
    <ul className="flex flex-wrap gap-2">{value.dates.map(d=><li key={d}><button type="button" className="min-h-11 rounded-full border border-gold/30 px-3 text-sm" aria-label={`${de?'Entfernen':'Remove'} ${d}`} onClick={()=>onChange({...value,dates:value.dates.filter(v=>v!==d)})}>{d} ×</button></li>)}</ul>
    <p className="text-xs text-muted">{de?'Reparatur-Gutscheine gelten nur für Katalog-Reparaturen mit Preis. Diagnose/Preis auf Anfrage wird ohne automatischen Rabatt angefragt. Zeiten und Aktionstage beziehen sich auf Hamburg.':'Repair coupons require a priced catalog repair. Diagnosis/quote-only work can be requested without an automatic discount. Dates and times use Hamburg time.'}</p>
  </fieldset>;
}
