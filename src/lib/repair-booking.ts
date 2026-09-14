import type { RepairCatalog } from './repair-catalog';
import type { RepairCampaignRules } from './repair-campaign-rules';
import { hamburgDate, validRepairDate } from './repair-campaign-rules';
export type RepairSelection={brandId:string;familyId:string;modelId:string;partId:string;variantId:string};
export type RepairBookingInput={selection?:RepairSelection;requestedDate?:string;preferredTime?:string;couponCode?:string;quoteFingerprint?:string;bookingKey?:string};
export type RepairBookingDetails={
  deviceLabel:string;repairLabel:string;requestedDate:string|null;preferredTime:string|null;
  baseAmountCents:number|null;discountAmountCents:number;totalAmountCents:number|null;
  coupon:{id:string;code:string;discountType:'percent'|'fixed';discountValue:number;minimumOrderCents:number;rules:RepairCampaignRules}|null;
  selection:RepairSelection|null;fingerprint:string;appointmentAt?:string|null;finalBaseAmountCents?:number|null;couponReleased?:boolean;
};
export const validateRepairRequestDate=(date?:string,time?:string,now=new Date())=>{
  if(date&&(!validRepairDate(date)||date<hamburgDate(now)))throw new Error('invalid_repair_date');
  if(time&&(!date||!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)))throw new Error('invalid_repair_time');
  return {requestedDate:date||null,preferredTime:time||null};
};
export const resolveRepairOption=(catalog:RepairCatalog,selection?:RepairSelection)=>{
  if(!selection)return{deviceLabel:'',repairLabel:'',baseAmountCents:null,selection:null};
  const brand=catalog.brands.find(b=>b.id===selection.brandId),family=brand?.families.find(f=>f.id===selection.familyId),model=family?.models.find(m=>m.id===selection.modelId);
  if(!model){if(!selection.partId)return{deviceLabel:'',repairLabel:'',baseAmountCents:null,selection:null};throw new Error('invalid_repair_option');}
  const deviceLabel=[brand!.name,family!.name,model.name].join(' · ');
  const safeSelection={brandId:brand!.id,familyId:family!.id,modelId:model.id,partId:selection.partId||'',variantId:selection.variantId||''};
  if(!selection.partId)return{deviceLabel,repairLabel:'',baseAmountCents:null,selection:{...safeSelection,variantId:''}};
  const part=model.parts?.find(p=>p.id===selection.partId),variant=part?.variants.find(v=>v.id===selection.variantId);
  if(!part||!variant)throw new Error('invalid_repair_option');
  const price=variant.price;
  return{deviceLabel,repairLabel:`${part.name} · ${variant.label}`,baseAmountCents:typeof price==='number'&&Number.isFinite(price)&&price>0?Math.round(price*100):null,selection:safeSelection};
};
export const repairBookingSummary=(booking:Partial<RepairBookingDetails>|null|undefined,locale:'de'|'en'):string=>{
  if(!booking?.fingerprint)return '';
  const de=locale==='de',money=(value:number)=>new Intl.NumberFormat(de?'de-DE':'en-GB',{style:'currency',currency:'EUR'}).format(value/100);
  const lines=[`${de?'Reparatur':'Repair'}: ${booking.repairLabel||(de?'Diagnose / auf Anfrage':'Diagnosis / on request')}`,
    `${de?'Wunschtermin':'Preferred date'}: ${booking.requestedDate|| (de?'nach Rücksprache':'to be arranged')}${booking.preferredTime?' '+booking.preferredTime:''} (${de?'Hamburg-Zeit':'Hamburg time'})`];
  lines.push(booking.appointmentAt?`${de?'Bestätigter Termin':'Confirmed appointment'}: ${new Intl.DateTimeFormat(de?'de-DE':'en-GB',{timeZone:'Europe/Berlin',dateStyle:'medium',timeStyle:'short'}).format(new Date(booking.appointmentAt))}`:de?'Termin noch nicht bestätigt. Unser Team meldet sich.':'Appointment not yet confirmed. Our team will contact you.');
  if(typeof booking.baseAmountCents==='number')lines.push(`${de?'Katalog-Richtpreis':'Catalog estimate'}: ${money(booking.baseAmountCents)}`);
  if(booking.coupon)lines.push(`${de?'Gutschein':'Coupon'}: ${booking.coupon.code} · ${booking.coupon.discountType==='percent'?`${booking.coupon.discountValue} %`:money(booking.coupon.discountValue)} (${de?'für diese Reparatur vorgemerkt':'reserved for this repair'})`,`${de?'Voraussichtlicher Rabatt':'Estimated saving'}: ${money(booking.discountAmountCents||0)}`);
  if(typeof booking.totalAmountCents==='number')lines.push(`${de?'Voraussichtlicher Reparaturpreis':'Estimated repair total'}: ${money(booking.totalAmountCents)}`);
  if(booking.couponReleased)lines.push(de?'Gutscheinvormerkung storniert.':'Coupon reservation cancelled.');
  lines.push(de?'Keine Online-Zahlung. Der Endpreis wird vor kostenpflichtigen Arbeiten bestätigt.':'No online payment. The final price is confirmed before paid work starts.');
  return lines.join('\n');
};
export const repairBookingError=(code:string,de:boolean):string=>{
  const errors:Record<string,[string,string]>={
    invalid_repair_date:['Bitte ein gültiges, nicht vergangenes Wunschdatum wählen.','Choose a valid preferred date that is not in the past.'],
    invalid_repair_time:['Bitte eine gültige Wunschzeit und ein Datum angeben.','Enter a valid preferred time and date.'],
    invalid_repair_option:['Bitte Reparatur und Ersatzteiloption erneut auswählen.','Select the repair and part option again.'],
    repair_price_required:['Für diesen Gutschein bitte eine Reparatur mit Katalogpreis auswählen. Bei Preisen auf Anfrage hilft unser Team.','Select a repair with a catalog price for this coupon. Our team can help with quote-only work.'],
    invalid_coupon:['Dieser Gutschein gilt nicht für Reparaturen oder ist derzeit nicht gültig.','This coupon is not valid for repairs or is not currently available.'],
    repair_date_ineligible:['Der Gutschein gilt nicht für diesen Buchungs- bzw. Reparaturtag. Bitte die freigegebenen Daten prüfen.','The booking or repair date is not eligible. Check the allowed dates.'],
    coupon_unavailable:['Der Gutschein ist abgelaufen, inaktiv, ausgeschöpft oder der Mindestwert ist nicht erreicht.','The coupon has expired, is inactive, has reached its limit or the minimum spend is not met.'],
    quote_changed:['Preis oder Gutscheinbedingungen haben sich geändert. Bitte den Gutschein erneut prüfen.','The price or coupon terms changed. Validate the coupon again.'],
    booking_conflict:['Diese Anfrage wurde bereits mit anderen Angaben gesendet. Bitte eine neue Anfrage starten.','This request was already sent with different details. Start a new request.'],
    invalid_booking_key:['Bitte die Seite neu laden und die Anfrage erneut senden.','Reload the page and submit the request again.'],
  };
  return errors[code]?.[de?0:1]||(de?'Die Anfrage konnte nicht verarbeitet werden. Bitte erneut versuchen.':'Could not process the request. Please try again.');
};
export const repairBookingErrorStatus=(code:string):number=>['quote_changed','booking_conflict'].includes(code)?409:['invalid_repair_date','invalid_repair_time','invalid_repair_option','repair_price_required','invalid_coupon','repair_date_ineligible','coupon_unavailable','invalid_booking_key'].includes(code)?400:503;
