'use client';
import { useState } from 'react';
import type { OperationsCopy } from '@/lib/admin-i18n';
import { useOperationsRead } from './use-operations';
import { money,opsQuietButton } from './shared';
import { operationErrorText } from './ReviewDialog';

export default function ReportsDetails({view,params,revision,copy,locale}:{view:'orders'|'purchases'|'expenses';params:string;revision:number;copy:OperationsCopy;locale:'de'|'en'}) {
  const [page,setPage]=useState(1);const query=view==='purchases' ? 'view=documents&kind=purchase':`view=${view}`;
  const {data,error,loading,retry}=useOperationsRead<{items?:Record<string,unknown>[];documents?:Record<string,unknown>[];total:number}>(`/api/admin/operations?${query}&${params}&page=${page}`,revision);
  const rows=data?.items ?? data?.documents ?? [];
  return <div className="space-y-3" aria-busy={loading}>
    {error ? <div role="alert" className="flex flex-wrap gap-2 text-sm"><span>{operationErrorText(error,copy)}</span><button type="button" className={opsQuietButton} onClick={retry}>{copy.retry}</button></div>:null}
    {!loading && !error && !rows.length ? <p className="py-3 text-sm text-muted">{copy.noDocuments}</p>:null}
    {rows.map(row=>{
      const payload=row.payload as Record<string,unknown>|undefined;const cents=Number(row.total_cents ?? row.gross_cents ?? payload?.totalGrossCents ?? 0);
      return <article key={String(row.id)} className="flex flex-wrap justify-between gap-3 border-b border-border py-3 text-sm">
        <div className="min-w-0"><p className="font-medium">{view==='orders' ? `A-${row.order_number}`:view==='purchases' ? `#${row.number} · ${payload?.supplier ?? ''}`:String(row.category)}</p>
          <p className="mt-1 break-words text-xs text-muted">{row.attribution==='unassigned' ? copy.unassigned:row.payment_status ? String(row.payment_status):String(payload?.invoiceReference ?? row.note ?? '')}</p></div>
        <strong className="tabular-nums">{money(cents,locale)}</strong>
      </article>;
    })}
    <div className="flex flex-wrap items-center justify-between gap-2 text-xs"><span>{data?.total ?? 0} · {copy.page} {page}</span><div className="flex gap-2">
      <button type="button" className={opsQuietButton} disabled={page<=1} onClick={()=>setPage(n=>n-1)}>{copy.previous}</button><button type="button" className={opsQuietButton} disabled={page*40>=(data?.total ?? 0)} onClick={()=>setPage(n=>n+1)}>{copy.next}</button></div></div>
  </div>;
}
