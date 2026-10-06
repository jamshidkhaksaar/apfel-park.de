'use client';
import type { FormEvent } from 'react';
import type { OperationsCopy } from '@/lib/admin-i18n';
import type { Branch,StockItem } from '@/lib/operations/types';
import { Field,FormActions,Section,opsInput } from './shared';

export type Mutate = (body:Record<string,unknown>,options?:{expectedTotalCents?:number})=>Promise<Record<string,unknown>|null>;
export default function StockActions({mode,item,branches,copy,busy,mutate}: {
  mode:'stock'|'purchases'|'transfers';item:StockItem|null;branches:Branch[];copy:OperationsCopy;busy:boolean;mutate:Mutate;
}) {
  if(!item) return <p className="rounded-xl border border-dashed border-border p-5 text-sm text-muted">{copy.select} · {copy.stock}</p>;
  const submit=async (event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault();const form=event.currentTarget;const fields=new FormData(form);
    const body:Record<string,unknown>={branchId:item.branchId,inventoryId:item.inventoryId};
    for(const [key,value] of fields) body[key]=String(value);
    if(mode==='purchases') {body.action='purchase';body.paid=fields.get('paid')==='on';body.inputVatConfirmed=fields.get('inputVatConfirmed')==='on';}
    else if(mode==='transfers') body.action='transfer_dispatch';else body.action='threshold';
    const result=await mutate(body);if(result && mode!=='stock') form.reset();
  };
  return <Section title={`${copy.selected}: ${item.title}`}><p className="mb-4 text-xs text-muted">{item.sku} · {item.branchName}</p>
    <form onSubmit={submit} className="grid gap-4">
      {mode==='purchases' ? <>
        <p className="text-sm text-muted">{copy.purchaseNote}</p>
        <Field label={copy.supplier}><input name="supplier" required maxLength={180} className={opsInput}/></Field>
        <Field label={copy.invoiceReference}><input name="invoiceReference" required maxLength={100} className={opsInput}/></Field>
        <div className="grid gap-3 sm:grid-cols-2"><Field label={copy.quantity}><input name="quantity" type="number" min="1" max="1000" step="1" defaultValue="1" required className={opsInput}/></Field>
          <Field label={copy.unitGross}><input name="unitGross" inputMode="decimal" required className={opsInput}/></Field></div>
        <Field label={copy.unitNet}><input name="unitNet" inputMode="decimal" className={opsInput}/></Field>
        <label className="flex items-start gap-2 text-sm"><input name="paid" type="checkbox" className="mt-1 accent-gold"/>{copy.paid}</label>
        <label className="flex items-start gap-2 text-sm"><input name="inputVatConfirmed" type="checkbox" className="mt-1 accent-gold"/>{copy.inputVatConfirmed}</label>
      </> : mode==='transfers' ? <>
        <p className="text-sm text-muted">{copy.transferNote}</p>
        <Field label={copy.destination}><select name="destinationId" required className={opsInput} defaultValue=""><option value="">—</option>
          {branches.filter(b=>b.active && b.id!==item.branchId).map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></Field>
        <Field label={copy.quantity}><input name="quantity" type="number" min="1" max={item.available} defaultValue="1" required className={opsInput}/></Field>
        <Field label={copy.note}><textarea name="note" className={opsInput} maxLength={500}/></Field>
      </> : <div className="grid gap-3 sm:grid-cols-2">
        <Field label={copy.minimum}><input name="minimum" type="number" min="0" max="10000" defaultValue={item.minimum} required className={opsInput}/></Field>
        <Field label={copy.target}><input name="target" type="number" min="0" max="10000" defaultValue={item.target} required className={opsInput}/></Field>
      </div>}
      <FormActions copy={copy} busy={busy} label={mode==='purchases' ? copy.receive : mode==='transfers' ? copy.dispatch : copy.saveThreshold}/>
    </form>
  </Section>;
}
