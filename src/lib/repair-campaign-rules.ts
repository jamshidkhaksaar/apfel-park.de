import { normalizeWeeklyDays, weekdayForDate } from './campaign-weekly';
export type RepairCampaignRules={dateBasis:'repair_date'|'booking_date';dates:string[];weeklyDays?:number[]};
export const hamburgDate=(date=new Date()):string=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
export const validRepairDate=(value:unknown):value is string=>typeof value==='string'&&/^20\d{2}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value+'T12:00:00Z').toISOString().slice(0,10)===value;
export const normalizeRepairRules=(input:unknown):RepairCampaignRules=>{
  const raw=input&&typeof input==='object'?input as Record<string,unknown>:{};
  if(raw.dateBasis!==undefined&&!['repair_date','booking_date'].includes(String(raw.dateBasis)))throw new Error('invalid_repair_dates');
  const dates=Array.isArray(raw.dates)?raw.dates:[];
  if(dates.length>60||dates.some(d=>!validRepairDate(d)))throw new Error('invalid_repair_dates');
  const weeklyDays = normalizeWeeklyDays(raw);
  if (weeklyDays.length && dates.length) throw new Error('invalid_repair_dates');
  return{dateBasis:raw.dateBasis==='booking_date'?'booking_date':'repair_date',dates:[...new Set(dates as string[])].sort(),...(weeklyDays.length?{weeklyDays}:{})};
};
export const repairDateAllowed=(rules:RepairCampaignRules,requestedDate:string|null,now=new Date()):boolean=>{
  const date=rules.dateBasis==='booking_date'?hamburgDate(now):requestedDate;
  if (!date || !validRepairDate(date)) return false;
  return rules.weeklyDays?.length ? rules.weeklyDays.includes(weekdayForDate(date)) : rules.dates.includes(date);
};
