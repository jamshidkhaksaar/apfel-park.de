'use client';
import type { OperationsCopy } from '@/lib/admin-i18n';
import type { OperationsOverview } from '@/lib/operations/types';
import { useOperationsRead } from './use-operations';
import { money,opsQuietButton } from './shared';
import { operationErrorText } from './ReviewDialog';

export default function OverviewPanel({branchId,revision,copy,locale,onOpen}:{branchId:string;revision:number;copy:OperationsCopy;locale:'de'|'en';onOpen:(view:string,filter?:string)=>void}) {
  const {data,loading,error,retry}=useOperationsRead<OperationsOverview>(`/api/admin/operations?view=overview&branchId=${branchId}`,revision);
  const health=useOperationsRead<{branchMismatches:number;assetMismatches:number;checkedAt:string}>('/api/admin/operations?view=health',revision);
  const cards=data ? [
    {label:copy.todaySales,value:money(data.today.capturedCents,locale),view:'reports',filter:'today'},
    {label:copy.units,value:data.stock.availableUnits,view:'stock',filter:''},
    {label:copy.low,value:data.stock.lowStock,view:'stock',filter:'low'},
    {label:copy.empty,value:data.stock.outOfStock,view:'stock',filter:'empty'},
    {label:copy.reserved,value:data.stock.reservedUnits,view:'stock',filter:'reserved'},
    {label:copy.pendingTransfers,value:data.pendingTransfers,view:'transfers',filter:'dispatched'},
    {label:copy.deviceGaps,value:data.stock.missingDeviceDetails,view:'assets',filter:'missing_details'},
    {label:copy.missingCosts,value:data.stock.missingCosts,view:'stock',filter:'missing_costs'},
  ]:[];
  return <section className="space-y-5" aria-busy={loading}>
    {error ? <div role="alert" className="flex flex-wrap items-center gap-3 text-sm"><span>{operationErrorText(error,copy)}</span><button type="button" className={opsQuietButton} onClick={retry}>{copy.retry}</button></div>:null}
    {loading && !data ? <p role="status">{copy.reviewLoading}</p>:null}
    <div className="grid gap-3 min-[360px]:grid-cols-2 xl:grid-cols-4">{cards.map(card=><button key={card.label} type="button" onClick={()=>onOpen(card.view,card.filter)}
      className="min-h-28 min-w-0 rounded-xl border border-border bg-surface p-4 text-left focus-visible:outline-2 focus-visible:outline-gold hover:border-gold/60">
      <span className="block text-sm text-muted">{card.label}</span><span className="mt-3 block break-words text-2xl font-semibold tabular-nums">{card.value}</span>
    </button>)}</div>
    {data ? <div className="flex flex-wrap gap-x-6 gap-y-2 rounded-xl border border-border p-4 text-sm">
      <span>{copy.physical}: <strong>{data.stock.physicalUnits}</strong></span><span>{copy.inactive}: <strong>{data.stock.inactiveUnits}</strong></span>
      <span>{copy.transit}: <strong>{data.stock.transitUnits}</strong></span></div>:null}
    <p className="text-sm text-muted">{copy.shopUnavailable}</p>
    {health.data && (health.data.branchMismatches || health.data.assetMismatches) ? <p role="alert" className="rounded-xl border border-amber-500/40 p-4 text-sm">{copy.healthWarning}</p>:null}
  </section>;
}
