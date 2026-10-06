'use client';
import {useState,type FormEvent} from 'react';
import type { OperationsCopy } from '@/lib/admin-i18n';
import type { Mutate } from './StockActions';
import { Field,FormActions,opsInput,Section,money } from './shared';
import { useDebouncedSearch,useOperationsRead } from './use-operations';

export default function ExpenseForm({branchId,copy,busy,mutate}:{branchId:string;copy:OperationsCopy;busy:boolean;mutate:Mutate}) {
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const earliest=new Date(today+'T12:00:00Z');earliest.setUTCDate(earliest.getUTCDate()-365);
  const [search,setSearch]=useState('');const q=useDebouncedSearch(search.replace(/^A-/i,''));
  const {data}=useOperationsRead<{orders:Array<{id:string;order_number:number;total_amount:string}>}>(`/api/admin/operations?view=orders&from=${earliest.toISOString().slice(0,10)}&to=${today}&q=${encodeURIComponent(q)}`,0);
  const submit=async(event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault();const form=event.currentTarget;const body:Record<string,unknown>={action:'expense',branchId};
    for(const [key,value] of new FormData(form)) body[key]=String(value);if(await mutate(body)) form.reset();
  };
  return <Section title={copy.expense}><form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    <Field label={copy.category}><select name="category" className={opsInput} defaultValue="shipping"><option value="shipping">{copy.shipping}</option><option value="payment_fee">{copy.fees}</option>
      <option value="return_shipping">{copy.returnShipping}</option><option value="rent">{copy.rent}</option><option value="salary">{copy.salary}</option><option value="other">{copy.other}</option></select></Field>
    <Field label={copy.date}><input name="date" type="date" required defaultValue={today} className={opsInput}/></Field>
    <Field label={copy.gross}><input name="gross" inputMode="decimal" required className={opsInput}/></Field>
    <Field label={copy.net}><input name="net" inputMode="decimal" className={opsInput}/></Field>
    <Field label={copy.inputVat}><input name="inputVat" inputMode="decimal" className={opsInput}/></Field>
    <Field label={copy.relatedOrder}><input aria-label={copy.orderSearch} placeholder={copy.orderSearch} value={search} onChange={e=>setSearch(e.target.value)} className={opsInput}/>
      <select name="orderId" defaultValue="" className={opsInput}><option value="">—</option>{data?.orders.map(order=><option key={order.id} value={order.id}>A-{order.order_number} · {money(Math.round(Number(order.total_amount)*100),'de')}</option>)}</select></Field>
    <Field label={copy.note}><input name="note" required maxLength={500} className={opsInput}/></Field>
    <div className="sm:col-span-2 lg:col-span-3">{!branchId ? <p className="mb-2 text-xs text-muted">{copy.chooseBranch}</p>:null}<FormActions copy={copy} busy={busy} disabled={!branchId} label={copy.saveExpense}/></div>
  </form></Section>;
}
