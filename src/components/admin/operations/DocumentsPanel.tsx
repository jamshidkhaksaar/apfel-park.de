'use client';
import type { OperationsCopy } from '@/lib/admin-i18n';
import type { OperationsDocument } from '@/lib/operations/types';
import type { Mutate } from './StockActions';
import { useOperationsRead } from './use-operations';
import { Empty,opsQuietButton,statusText } from './shared';

export default function DocumentsPanel({branchId,revision,copy,locale,owner,mutate,busy,transfers=false}: {
  branchId:string;revision:number;copy:OperationsCopy;locale:'de'|'en';owner:boolean;mutate:Mutate;busy:boolean;transfers?:boolean;
}) {
  const {data,loading,error}=useOperationsRead<{documents:OperationsDocument[]}>(`/api/admin/operations?view=documents&branchId=${branchId}`,revision);
  const documents=data?.documents.filter(d=>!transfers || d.kind==='transfer') ?? [];
  const labels:Record<string,string>={purchase:copy.purchases,transfer:copy.transfers,training_sale:copy.trainingReceipt,expense:copy.expense,asset_update:copy.assets,threshold:copy.minimum,branch_setup:copy.settings,membership:copy.staff};
  return <section className="space-y-3" aria-busy={loading}>
    {error ? <p role="alert">{copy.failed}</p> : null}
    {documents.map(doc=><article key={doc.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4">
      <div className="min-w-0"><h3 className="text-sm font-semibold">{labels[doc.kind] ?? doc.kind} · #{doc.number}</h3>
        <p className="mt-1 text-xs text-muted">{statusText(doc.status,copy)} · {new Intl.DateTimeFormat(locale==='de'?'de-DE':'en-GB',{timeZone:'Europe/Berlin',dateStyle:'medium',timeStyle:'short'}).format(new Date(doc.created_at))}</p>
        {typeof doc.payload.sku==='string' ? <p className="mt-1 break-all text-xs">{doc.payload.sku} · {copy.quantity}: {String(doc.payload.quantity ?? '')}</p> : null}
      </div>
      {doc.kind==='training_sale' ? <a className={opsQuietButton} href={`/api/admin/operations/documents/${doc.id}`} target="_blank" rel="noopener noreferrer">{copy.print}</a> : null}
      {owner && doc.kind==='transfer' && doc.status==='dispatched' && doc.destination_id ? <button type="button" disabled={busy} className={opsQuietButton} onClick={()=>void mutate({action:'transfer_receive',branchId:doc.destination_id,documentId:doc.id})}>{copy.receiveTransfer}</button> : null}
    </article>)}
    {!loading && !documents.length ? <Empty copy={copy}/> : null}
  </section>;
}
