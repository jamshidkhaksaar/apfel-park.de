'use client';
import { useState } from 'react';
import type { RepairCatalogModel } from '@/lib/repair-catalog';
import type { RepairBookingDetails, RepairBookingInput } from '@/lib/repair-booking';
import { hamburgDate } from '@/lib/repair-campaign-rules';
export default function RepairBookingOptions({lang,model,value,quote,onChange,onQuote,disabled}:{lang:'de'|'en';model:RepairCatalogModel|null;value:RepairBookingInput;quote:RepairBookingDetails|null;onChange:(value:RepairBookingInput)=>void;onQuote:(quote:RepairBookingDetails)=>void;disabled:boolean}){
  const de=lang==='de',[busy,setBusy]=useState(false),[message,setMessage]=useState('');
  const part=model?.parts?.find(p=>p.id===value.selection?.partId);
  const field='mt-2 min-h-11 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground';
  const update=(next:RepairBookingInput)=>{setMessage('');onChange(next);};
  const check=async()=>{setBusy(true);setMessage('');try{
    const response=await fetch('/api/repairs/quote',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...value,locale:lang})});
    const result=await response.json();if(!response.ok||!result.success){setMessage(result.error||(de?'Gutschein nicht gültig.':'Coupon is not valid.'));return;}onQuote(result.quote);
  }catch{setMessage(de?'Prüfung fehlgeschlagen. Bitte erneut versuchen.':'Validation failed. Please try again.');}finally{setBusy(false);}};
  const money=(cents:number)=>new Intl.NumberFormat(de?'de-DE':'en-GB',{style:'currency',currency:'EUR'}).format(cents/100);
  return <fieldset disabled={disabled} className="space-y-4 rounded-xl border border-gold/30 p-4" data-repair-booking-options>
    <legend className="px-2 font-semibold">{de?'Reparatur, Termin & Gutschein':'Repair, date & coupon'}</legend>
    <label className="block text-sm">{de?'Reparatur / Bauteil':'Repair / part'}<select className={field} value={value.selection?.partId||''} onChange={e=>{const selected=model?.parts?.find(p=>p.id===e.target.value);if(value.selection)update({...value,selection:{...value.selection,partId:e.target.value,variantId:selected?.variants[0]?.id||''}});}}><option value="">{de?'Diagnose / andere Reparatur – Preis auf Anfrage':'Diagnosis / other repair — price on request'}</option>{model?.parts?.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
    {part?<label className="block text-sm">{de?'Ersatzteiloption':'Part option'}<select className={field} value={value.selection?.variantId||''} onChange={e=>{if(value.selection)update({...value,selection:{...value.selection,variantId:e.target.value}});}}>{part.variants.map(v=><option key={v.id} value={v.id}>{v.label} · {typeof v.price==='number'&&v.price>0?money(Math.round(v.price*100)):(de?'auf Anfrage':'on request')}</option>)}</select></label>:null}
    <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm">{de?'Wunschdatum (optional)':'Preferred date (optional)'}<input type="date" min={hamburgDate()} className={field} value={value.requestedDate||''} onChange={e=>update({...value,requestedDate:e.target.value,preferredTime:e.target.value?value.preferredTime:''})}/></label><label className="block text-sm">{de?'Wunschzeit (Hamburg, optional)':'Preferred time (Hamburg, optional)'}<input type="time" className={field} disabled={!value.requestedDate} value={value.preferredTime||''} onChange={e=>update({...value,preferredTime:e.target.value})}/></label></div>
    <p className="text-xs leading-5 text-muted">{de?'Dies ist eine Terminanfrage, keine feste Reservierung. Unser Team bestätigt Termin und Endpreis. Ohne Datum vereinbaren wir den Termin mit dir.':'This is an appointment request, not a guaranteed reservation. Our team confirms the appointment and final price. Without a date, we arrange one with you.'}</p>
    <label className="block text-sm">{de?'Reparatur-Gutscheincode (optional)':'Repair coupon code (optional)'}<input className={field} maxLength={64} value={value.couponCode||''} onChange={e=>update({...value,couponCode:e.target.value.toUpperCase().trim()})}/></label>
    <button type="button" className="btn-secondary min-h-11 w-full justify-center" disabled={busy||!value.couponCode} onClick={()=>void check()}>{busy?(de?'Wird geprüft…':'Checking…'):(de?'Gutschein prüfen':'Validate coupon')}</button>
    {message?<p role="alert" className="text-sm text-red-text">{message}</p>:null}
    {quote?.coupon?<div role="status" className="space-y-1 rounded-lg bg-gold/10 p-3 text-sm"><p>{de?'Katalogpreis':'Catalog estimate'}: {money(quote.baseAmountCents!)}</p><p>{quote.coupon.code}: −{money(quote.discountAmountCents)}</p><p className="font-semibold">{de?'Voraussichtlicher Preis':'Estimated total'}: {money(quote.totalAmountCents!)}</p><p className="text-xs">{de?'Der Rabatt wird beim Absenden nochmals geprüft und im Ticket gespeichert. Keine Online-Zahlung.':'The discount is rechecked on submission and saved with the ticket. No online payment.'}</p></div>:null}
  </fieldset>;
}
