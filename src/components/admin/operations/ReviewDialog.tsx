'use client';
import { useEffect,useRef,useState } from 'react';
import Link from 'next/link';
import type { OperationPreview } from '@/lib/operations/types';
import type { OperationsCopy } from '@/lib/admin-i18n';
import { money,opsButton,opsQuietButton } from './shared';

export const operationErrorText=(code:string|null,copy:OperationsCopy):string => {
  if(!code) return copy.failed;
  if(/insufficient_stock/.test(code)) return copy.errorStock;
  if(/asset_unavailable|product_not_sellable|not_found/.test(code)) return copy.errorUnavailable;
  if(/stale_information|confirmation_expired|confirmation_required/.test(code)) return copy.errorStale;
  if(/session_expired/.test(code)) return copy.errorSession;
  if(/timeout|network|fetch|temporarily_unavailable/.test(code)) return copy.errorNetwork;
  if(/invalid_amount|invalid_quantity|invalid_threshold|invalid_battery|invalid_dates/.test(code)) return copy.errorInput;
  if(/owner_required|forbidden|cannot_revoke/.test(code)) return copy.errorForbidden;
  return copy.failed;
};
export default function ReviewDialog({preview,action,expectedTotal,sending,errorCode,copy,locale,onConfirm,onCancel,onRetry}:{
  preview:OperationPreview|null;action:string;expectedTotal?:number;sending:boolean;errorCode:string|null;copy:OperationsCopy;locale:'de'|'en';onConfirm:()=>void;onCancel:()=>void;onRetry:()=>void;
}) {
  const dialog=useRef<HTMLDialogElement>(null);const [acceptedToken,setAcceptedToken]=useState<string|null>(null);
  const accepted=Boolean(preview && acceptedToken===preview.token);
  const changed=expectedTotal!==undefined && preview?.totalCents!==undefined && expectedTotal!==preview.totalCents;
  useEffect(()=>{const node=dialog.current;const previous=document.activeElement as HTMLElement|null;node?.showModal();return()=>{node?.close();previous?.focus();};},[]);
  const labels:Record<string,string>={onHand:copy.physical,minimum:copy.minimum,target:copy.target,cost_gross_cents:copy.unitGross,cost_net_cents:copy.unitNet,
    totalCents:copy.total,color:copy.color,storage:copy.storage,batteryHealth:copy.battery,identifier:copy.identifierStored,destination:copy.destination,action:copy.document,supplier:copy.supplier,invoiceReference:copy.invoiceReference,
    name:copy.shopName,address:copy.address,code:copy.shopCode,user:copy.user,role:copy.role};
  const format=(field:string,value:string|number|null)=>value===null || value==='' ? '—':field.endsWith('Cents') || field.endsWith('_cents') ? money(Number(value),locale):String(value);
  return <dialog ref={dialog} onCancel={event=>{event.preventDefault();if(!sending) onCancel();}} aria-labelledby="ops-review-title"
    className="m-auto w-[calc(100%_-_2rem)] max-w-xl max-h-[85vh] overflow-y-auto rounded-xl border border-border bg-surface p-5 text-foreground shadow-xl backdrop:bg-black/60">
    <h2 id="ops-review-title" className="text-lg font-semibold">{copy.reviewTitle}</h2>
    <p className="mt-2 text-sm text-muted">{preview?.alreadyApplied ? copy.alreadyApplied:action==='training_sale' ? copy.trainingNote:copy.realActionNote}</p>
    {preview ? <><p className="mt-4 text-sm font-semibold">{preview.branchName}</p>
      <dl className="mt-3 divide-y divide-border">{preview.changes.map((change,index)=><div key={index} className="flex flex-wrap justify-between gap-2 py-3 text-sm">
        <dt>{labels[change.field] ?? change.field}</dt><dd className="break-words font-medium">{format(change.field,change.before)} → {format(change.field,change.after)}</dd></div>)}</dl>
      {preview.lines ? <ul className="mt-3 divide-y divide-border">{preview.lines.map((line,index)=><li key={index} className="py-2 text-sm">{line.title} · {line.quantity} × {money(line.unitCents,locale)}</li>)}</ul>:null}
      {preview.totalCents!==undefined ? <p className="mt-3 text-lg font-semibold">{copy.total}: {money(preview.totalCents,locale)}</p>:null}
      {changed ? <label className="mt-4 flex min-h-11 items-start gap-3 rounded-lg border border-amber-500/40 p-3 text-sm"><input type="checkbox" checked={accepted} onChange={e=>setAcceptedToken(e.target.checked ? preview.token:null)} className="mt-1 accent-gold"/>{copy.priceChanged}</label>:null}
    </>:<p role="status" className="py-5 text-sm">{sending ? copy.reviewLoading:copy.reviewUnavailable}</p>}
    {errorCode ? <p role="alert" className="mt-3 text-sm text-red-500">{operationErrorText(errorCode,copy)}</p>:null}
    <div className="mt-5 flex flex-wrap justify-end gap-2">
      <button type="button" className={opsQuietButton} disabled={sending} onClick={onCancel}>{copy.cancel}</button>
      {(!preview || errorCode) && errorCode!=='session_expired' ? <button type="button" className={opsQuietButton} disabled={sending} onClick={onRetry}>{copy.reviewAgain}</button>:null}
      {preview ? <button type="button" className={opsButton} disabled={sending || (changed && !accepted) || Boolean(errorCode && /stale|expired|invalid_confirmation/.test(errorCode))} onClick={onConfirm}>{sending ? copy.saving:action==='training_sale' ? copy.trainingReceipt:copy.confirmSave}</button>:null}
    </div>
    {errorCode==='session_expired' ? <Link className="mt-4 block text-sm text-gold underline" href="/login?redirectTo=/admin/kasse-lager">{copy.signIn}</Link>:null}
  </dialog>;
}
