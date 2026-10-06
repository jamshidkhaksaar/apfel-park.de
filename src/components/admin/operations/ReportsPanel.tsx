'use client';
import { useState } from 'react';
import type { OperationsCopy } from '@/lib/admin-i18n';
import type { OperationsReport } from '@/lib/operations/types';
import { useOperationsRead } from './use-operations';
import type { Mutate } from './StockActions';
import { Field,money,opsInput,opsQuietButton,Section } from './shared';
import { operationErrorText } from './ReviewDialog';
import ExpenseForm from './ExpenseForm';
import ReportsDetails from './ReportsDetails';

const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export default function ReportsPanel({branchId,revision,copy,locale,busy,mutate,initialFilter}: {
  branchId:string;revision:number;copy:OperationsCopy;locale:'de'|'en';busy:boolean;mutate:Mutate;initialFilter?:string;
}) {
  const [from,setFrom]=useState(()=>initialFilter==='today' ? today():today().slice(0,7)+'-01');const [to,setTo]=useState(today);
  const [detail,setDetail]=useState<'orders'|'purchases'|'expenses'>('orders');
  const period=(mode:'today'|'week'|'lastWeek'|'month')=>{
    const end=new Date(today()+'T12:00:00Z');const start=new Date(end);
    if(mode==='week' || mode==='lastWeek') start.setUTCDate(start.getUTCDate()-start.getUTCDay()-(mode==='lastWeek' ? 7:0));
    if(mode==='lastWeek'){end.setTime(start.getTime());end.setUTCDate(end.getUTCDate()+6);}if(mode==='month') start.setUTCDate(1);
    setFrom(start.toISOString().slice(0,10));setTo(end.toISOString().slice(0,10));
  };
  const params=`branchId=${branchId}&from=${from}&to=${to}`;const url=`/api/admin/operations?view=reports&${params}`;
  const {data,loading,error,retry}=useOperationsRead<OperationsReport>(url,revision);
  const metrics:dataMetric[]=data ? [
    {label:copy.captured,value:data.summary.capturedCents,previous:data.previous.capturedCents,currency:true,detail:'orders'},
    {label:copy.revenue,value:data.summary.revenueCents,previous:data.previous.revenueCents,currency:true,detail:'orders'},
    {label:copy.refunds,value:data.summary.refundedCents,previous:data.previous.refundedCents,currency:true,detail:'orders'},
    {label:copy.margin,value:data.summary.contributionCents,previous:data.previous.contributionCents,currency:true},
    {label:copy.purchaseSpending,value:data.summary.purchasesCents,previous:data.previous.purchasesCents,currency:true,detail:'purchases'},
    {label:copy.shipping,value:data.summary.shippingExpenseCents,previous:data.previous.shippingExpenseCents,currency:true,detail:'expenses'},
    {label:copy.fees,value:data.summary.feesCents,previous:data.previous.feesCents,currency:true,detail:'expenses'},
    {label:copy.quantity,value:data.summary.unitsSold,previous:data.previous.unitsSold,currency:false,detail:'orders'},
  ]:[];
  return <div className="space-y-5">
    <h2 className="text-lg font-semibold">{copy.periodResults}</h2>
    <div className="flex flex-wrap gap-2">{(['today','week','lastWeek','month'] as const).map(mode=><button type="button" key={mode} className={opsQuietButton} onClick={()=>period(mode)}>{copy[mode]}</button>)}</div>
    <div className="flex flex-wrap items-end justify-between gap-3"><div className="flex min-w-0 flex-wrap gap-3">
      <Field label={copy.from}><input type="date" value={from} onChange={e=>setFrom(e.target.value)} className={opsInput}/></Field>
      <Field label={copy.to}><input type="date" value={to} onChange={e=>setTo(e.target.value)} className={opsInput}/></Field>
    </div><div className="flex flex-wrap gap-2"><a className={opsQuietButton} href={url+'&format=csv'}>{copy.summaryExport}</a>
      <a className={opsQuietButton} href={`/api/admin/operations?view=orders&${params}&format=csv`}>{copy.itemsExport}</a></div></div>
    {error ? <div role="alert" className="flex flex-wrap items-center gap-3 text-sm"><p>{operationErrorText(error,copy)}</p><button type="button" className={opsQuietButton} onClick={retry}>{copy.retry}</button></div>:null}
    <div aria-busy={loading} className="grid gap-3 min-[360px]:grid-cols-2 xl:grid-cols-4">{metrics.map(metric=>{
      const content=<><span className="block text-xs leading-relaxed text-muted">{metric.label}</span><strong className="mt-2 block break-words text-xl tabular-nums">
        {metric.value===null ? '—':metric.currency ? money(metric.value,locale):metric.value}</strong>
        <span className="mt-2 block text-xs text-muted">{copy.previousPeriod}: {metric.previous===null ? '—':metric.currency ? money(metric.previous,locale):metric.previous}
          {metric.value!==null && metric.previous!==null ? ` · Δ ${metric.currency ? money(metric.value-metric.previous,locale):metric.value-metric.previous}`:''}</span></>;
      const classes='min-w-0 rounded-xl border border-border bg-surface p-4 text-left';
      return metric.detail ? <button key={metric.label} type="button" className={classes+' hover:border-gold focus-visible:outline-2 focus-visible:outline-gold'} onClick={()=>setDetail(metric.detail!)}>{content}</button>:<div key={metric.label} className={classes}>{content}</div>;
    })}</div>
    {data ? <><p className="text-xs text-muted">{copy.previousPeriod}: {data.previous.windowStart} – {data.previous.windowEnd}</p>
      {data.summary.completenessReasons.length ? <Section title={copy.dataQuality}><ul className="list-disc space-y-2 pl-5 text-sm">{data.summary.completenessReasons.map(reason=><li key={reason}>{(copy.reasons as Record<string,string>)[reason] ?? reason}</li>)}</ul></Section>:null}
      <p className="text-sm text-muted">{copy.unassigned}: {data.attribution.unassignedOrders}. {copy.shopUnavailable}</p>
      <p className="text-xs text-muted">{copy.cohortRefundNote}</p>
      <Section title={copy.currentStock}><div className="flex flex-wrap gap-5 text-sm"><span>{copy.physical}: {data.currentStock.physicalUnits}</span><span>{copy.units}: {data.currentStock.availableUnits}</span><span>{copy.inactive}: {data.currentStock.inactiveUnits}</span><span>{copy.stockValue}: {money(data.currentStock.stockValueCents,locale)}</span></div>
        <p className="mt-3 text-xs text-muted">{copy.updated}: {new Date(data.asOf).toLocaleString(locale==='de'?'de-DE':'en-GB',{timeZone:'Europe/Berlin'})}</p></Section>
    </>:null}
    <Section title={copy.details}><div className="mb-4 flex flex-wrap gap-2">{(['orders','purchases','expenses'] as const).map(view=><button type="button" key={view} className={opsQuietButton} aria-pressed={detail===view} onClick={()=>setDetail(view)}>{view==='orders' ? copy.captured:view==='purchases' ? copy.purchases:copy.expense}</button>)}</div>
      <ReportsDetails key={`${branchId}:${from}:${to}:${detail}`} view={detail} params={params} revision={revision} copy={copy} locale={locale}/></Section>
    <ExpenseForm branchId={branchId} copy={copy} busy={busy} mutate={mutate}/>
    <p className="text-xs text-muted">{copy.weekNote} {copy.taxNote}</p>
  </div>;
}
type dataMetric={label:string;value:number|null;previous:number|null;currency:boolean;detail?:'orders'|'purchases'|'expenses'};
