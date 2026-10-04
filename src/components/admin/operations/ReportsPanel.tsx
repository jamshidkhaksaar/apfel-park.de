'use client';
import { useState,type FormEvent } from 'react';
import type { OperationsCopy } from '@/lib/admin-i18n';
import type { Overview } from '@/lib/operations/types';
import { useOperationsRead } from './use-operations';
import type { Mutate } from './StockActions';
import { Field,FormActions,money,opsInput,opsQuietButton,Section } from './shared';

const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export default function ReportsPanel({branchId,revision,copy,locale,expenses,busy,mutate}: {
  branchId:string;revision:number;copy:OperationsCopy;locale:'de'|'en';expenses:boolean;busy:boolean;mutate:Mutate;
}) {
  const [from,setFrom]=useState(()=>today().slice(0,7)+'-01');const [to,setTo]=useState(today);
  const period=(mode:'today'|'week'|'lastWeek'|'month')=>{
    const end=today();const day=new Date(`${end}T12:00:00Z`);const start=new Date(day);
    if(mode==='week' || mode==='lastWeek') start.setUTCDate(start.getUTCDate()-start.getUTCDay()-(mode==='lastWeek' ? 7 : 0));
    if(mode==='lastWeek') {day.setTime(start.getTime());day.setUTCDate(day.getUTCDate()+6);}
    if(mode==='month') start.setUTCDate(1);
    setFrom(start.toISOString().slice(0,10));setTo(day.toISOString().slice(0,10));
  };
  const url=`/api/admin/operations?view=overview&branchId=${branchId}&from=${from}&to=${to}`;
  const {data,loading,error}=useOperationsRead<Overview>(url,revision);
  const orderData=useOperationsRead<{orders:Array<{id:string;order_number:number;total_amount:string}>}>(expenses ? '/api/admin/operations?view=orders' : '',0);
  const metrics: Array<[string,number|null,boolean?]> = data ? [
    [copy.revenue,data.revenueCents,true],[copy.margin,data.contributionCents,true],[copy.units,data.units],
    [copy.low,data.lowStock],[copy.empty,data.outOfStock],[copy.reserved,data.reserved],
    [copy.purchaseSpending,data.purchasesCents,true],[copy.stockValue,data.stockValueCents,true],[copy.refunds,data.refundedCents,true],
    [copy.shipping,data.shippingExpenseCents,true],[copy.shippingIncome,data.shippingIncomeCents,true],[copy.fees,data.feesCents,true],
  ] : [];
  const recordExpense=async (event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault();const form=event.currentTarget;const body:Record<string,unknown>={action:'expense',branchId};
    for(const [key,value] of new FormData(form)) body[key]=String(value);
    if(await mutate(body)) form.reset();
  };
  return <div className="space-y-5">
    <div className="flex flex-wrap gap-2">{(['today','week','lastWeek','month'] as const).map(mode=><button type="button" key={mode} className={opsQuietButton} onClick={()=>period(mode)}>{copy[mode]}</button>)}</div>
    <div className="flex flex-wrap items-end justify-between gap-3"><div className="flex min-w-0 flex-wrap gap-3">
      <Field label={copy.from}><input type="date" value={from} onChange={e=>setFrom(e.target.value)} className={opsInput}/></Field>
      <Field label={copy.to}><input type="date" value={to} onChange={e=>setTo(e.target.value)} className={opsInput}/></Field>
    </div><a className={opsQuietButton} href={`${url}&format=csv`}>{copy.export}</a></div>
    {error ? <p role="alert" className="text-sm text-red-500">{copy.failed}</p> : null}
    <div aria-busy={loading} className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {metrics.map(([label,value,currency])=><div key={label} className="min-w-0 rounded-xl border border-border bg-surface p-4">
        <p className="text-xs leading-relaxed text-muted">{label}</p><p className="mt-2 break-words text-xl font-semibold tabular-nums sm:text-2xl">{value===null ? '—' : currency ? money(value,locale) : value}</p>
      </div>)}
    </div>
    {data && (data.historicalCostGap || data.partialRefundsUnknown || data.incompleteExpenses || data.missingCosts || data.missingPaymentFees || data.unpricedShopUnits) ? <p role="status" className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm leading-relaxed">{copy.incomplete} {copy.missingCosts}: {data.missingCosts}</p> : null}
    <p className="text-sm leading-relaxed text-muted">{copy.overviewNote}</p>
    <p className="text-xs text-muted">{copy.weekNote}</p>
    <Section title={copy.tax}><p className="text-sm leading-relaxed text-muted">{copy.taxNote}</p></Section>
    {expenses ? <Section title={copy.expense}><form onSubmit={recordExpense} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Field label={copy.category}><select name="category" className={opsInput} defaultValue="shipping">
        <option value="shipping">{copy.shipping}</option><option value="return_shipping">{locale==='de' ? 'Rückversand':'Return shipping'}</option>
        <option value="payment_fee">{copy.fees}</option><option value="rent">{locale==='de' ? 'Miete':'Rent'}</option>
        <option value="salary">{locale==='de' ? 'Gehälter':'Salaries'}</option><option value="other">{locale==='de' ? 'Sonstiges':'Other'}</option>
      </select></Field>
      <Field label={copy.date}><input name="date" type="date" required defaultValue={today()} className={opsInput}/></Field>
      <Field label={copy.gross}><input name="gross" inputMode="decimal" required className={opsInput}/></Field>
      <Field label={copy.net}><input name="net" inputMode="decimal" className={opsInput}/></Field>
      <Field label={copy.inputVat}><input name="inputVat" inputMode="decimal" className={opsInput}/></Field>
      <Field label={locale==='de' ? 'Zugehörige Online-Bestellung (optional)' : 'Related online order (optional)'}><select name="orderId" className={opsInput} defaultValue=""><option value="">—</option>
        {orderData.data?.orders.map(order=><option key={order.id} value={order.id}>A-{order.order_number} · {money(Math.round(Number(order.total_amount)*100),locale)}</option>)}</select></Field>
      <Field label={copy.note}><input name="note" required maxLength={500} className={opsInput}/></Field>
      <div className="sm:col-span-2 lg:col-span-3"><FormActions copy={copy} busy={busy || !branchId} label={copy.saveExpense}/></div>
    </form></Section> : null}
  </div>;
}
