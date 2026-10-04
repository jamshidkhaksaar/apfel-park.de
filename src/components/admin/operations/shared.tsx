import type { ReactNode } from 'react';
import type { OperationsCopy } from '@/lib/admin-i18n';

export const opsInput='min-h-11 w-full min-w-0 rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-gold';
export const opsButton='min-h-11 rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-50';
export const opsQuietButton='min-h-11 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium hover:border-gold disabled:opacity-50';
export const money = (cents: number, locale: 'de'|'en') => new Intl.NumberFormat(locale==='de' ? 'de-DE':'en-GB',{style:'currency',currency:'EUR'}).format(cents/100);
export const conditionText = (condition:string,copy:OperationsCopy):string => {
  if(['new','sealed','new_sealed'].includes(condition.toLowerCase())) return copy.conditionNew;
  if(['open_box','open-box','unboxed','openbox'].includes(condition.toLowerCase())) return copy.conditionOpen;
  if(condition.toLowerCase().startsWith('used')) return copy.conditionUsed;
  return condition;
};
export const statusText=(state:string,copy:OperationsCopy):string=>({available:copy.available,reserved:copy.reserved,sold:copy.sold,inspection:copy.inspection,
  transit:copy.transit,written_off:copy.writtenOff,faulty:copy.faulty,recorded:copy.recorded,dispatched:copy.dispatchedStatus,received:copy.receivedStatus,training:copy.training}[state] ?? state);
export function Field({label,children}: {label:string;children:ReactNode}) {return <label className="grid min-w-0 gap-1.5 text-xs font-medium text-muted">{label}{children}</label>;}
export function FormActions({busy,copy,label}: {busy:boolean;copy:OperationsCopy;label:string}) {return <button className={opsButton} disabled={busy}>{busy ? copy.saving : label}</button>;}
export function Section({title,children}: {title:string;children:ReactNode}) {return <section className="min-w-0 rounded-xl border border-border bg-surface p-4 sm:p-5"><h2 className="mb-4 text-base font-semibold">{title}</h2>{children}</section>;}
export function Empty({copy}: {copy:OperationsCopy}) {return <p role="status" className="py-8 text-center text-sm text-muted">{copy.noResults}</p>;}
