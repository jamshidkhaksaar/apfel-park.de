'use client';
import { useState } from 'react';
import type { OperationsCopy } from '@/lib/admin-i18n';
import type { OperationsDocument } from '@/lib/operations/types';
import type { Mutate } from './StockActions';
import { useOperationsRead } from './use-operations';
import { opsInput,opsQuietButton,statusText } from './shared';
import { operationErrorText } from './ReviewDialog';

export default function DocumentsPanel({branchId,revision,copy,locale,owner,mutate,busy,transfers=false,initialStatus}: {
  branchId:string;revision:number;copy:OperationsCopy;locale:'de'|'en';owner:boolean;mutate:Mutate;busy:boolean;transfers?:boolean;initialStatus?:string;
}) {
  const [page,setPage]=useState(1);const [kind,setKind]=useState(transfers ? 'transfer':'');const [status,setStatus]=useState(initialStatus || (transfers ? 'dispatched':''));
  const [from,setFrom]=useState('');const [to,setTo]=useState('');
  const {data,loading,error,retry}=useOperationsRead<{documents:OperationsDocument[];total:number}>(`/api/admin/operations?view=documents&branchId=${branchId}&kind=${kind}&status=${status}&page=${page}&from=${from}&to=${to}`,revision);
  const documents=data?.documents ?? [];
  const labels:Record<string,string>={purchase:copy.purchases,transfer:copy.transfers,training_sale:copy.trainingReceipt,expense:copy.expense,asset_update:copy.assets,threshold:copy.minimum,branch_setup:copy.settings,membership:copy.staff};
  return <section className="space-y-3" aria-busy={loading}>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {!transfers ? <label className="text-xs">{copy.document}<select value={kind} className={opsInput} onChange={e=>{setKind(e.target.value);setPage(1);}}><option value="">{copy.all}</option>{Object.entries(labels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>:null}
      <label className="text-xs">{copy.status}<select value={status} className={opsInput} onChange={e=>{setStatus(e.target.value);setPage(1);}}><option value="">{copy.all}</option>{['recorded','training','dispatched','received'].map(value=><option key={value} value={value}>{statusText(value,copy)}</option>)}</select></label>
      <label className="text-xs">{copy.from}<input type="date" value={from} className={opsInput} onChange={e=>{setFrom(e.target.value);setPage(1);}}/></label>
      <label className="text-xs">{copy.to}<input type="date" value={to} className={opsInput} onChange={e=>{setTo(e.target.value);setPage(1);}}/></label>
    </div>
    {error ? <div role="alert" className="flex flex-wrap gap-2 text-sm"><span>{operationErrorText(error,copy)}</span><button type="button" className={opsQuietButton} onClick={retry}>{copy.retry}</button></div>:null}
    {documents.map(doc=><article key={doc.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4">
      <div className="min-w-0"><h3 className="text-sm font-semibold">{labels[doc.kind] ?? doc.kind} · #{doc.number}</h3>
        <p className="mt-1 text-xs text-muted">{statusText(doc.status,copy)} · {new Intl.DateTimeFormat(locale==='de'?'de-DE':'en-GB',{timeZone:'Europe/Berlin',dateStyle:'medium',timeStyle:'short'}).format(new Date(doc.created_at))}</p>
        {typeof doc.payload.sku==='string' ? <p className="mt-1 break-all text-xs">{doc.payload.sku} · {copy.quantity}: {String(doc.payload.quantity ?? '')}</p> : null}
      </div>
      {doc.kind==='training_sale' ? <a className={opsQuietButton} href={`/api/admin/operations/documents/${doc.id}`} target="_blank" rel="noopener noreferrer">{copy.print}</a> : null}
      {owner && doc.kind==='transfer' && doc.status==='dispatched' && doc.destination_id ? <button type="button" disabled={busy} className={opsQuietButton} onClick={()=>void mutate({action:'transfer_receive',branchId:doc.destination_id,documentId:doc.id})}>{copy.receiveTransfer}</button> : null}
    </article>)}
    {!loading && !error && !documents.length ? <p role="status" className="py-6 text-sm text-muted">{copy.noDocuments}</p>:null}
    <div className="flex flex-wrap items-center justify-between gap-2 text-xs"><span>{data?.total ?? 0} · {copy.page} {page}</span><div className="flex gap-2"><button type="button" className={opsQuietButton} disabled={page<=1} onClick={()=>setPage(n=>n-1)}>{copy.previous}</button>
      <button type="button" className={opsQuietButton} disabled={page*40>=(data?.total ?? 0)} onClick={()=>setPage(n=>n+1)}>{copy.next}</button></div></div>
  </section>;
}
