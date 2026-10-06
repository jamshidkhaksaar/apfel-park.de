'use client';
import { useCallback,useMemo,useState } from 'react';
import Link from 'next/link';
import { useAdmin } from '@/lib/admin-context';
import { operationsDictionary } from '@/lib/admin-i18n';
import type { Branch,StockItem } from '@/lib/operations/types';
import { OperationsReadFeedback,useOperationsLive,useOperationsMutation,useOperationsRead } from './use-operations';
import StockPanel from './StockPanel';
import StockActions from './StockActions';
import TillPanel from './TillPanel';
import AssetsPanel from './AssetsPanel';
import ReportsPanel from './ReportsPanel';
import OverviewPanel from './OverviewPanel';
import ReviewDialog,{operationErrorText} from './ReviewDialog';
import SettingsPanel from './SettingsPanel';
import DocumentsPanel from './DocumentsPanel';
import { opsInput,opsQuietButton } from './shared';

type View='overview'|'till'|'stock'|'assets'|'purchases'|'transfers'|'documents'|'reports'|'settings';
export default function OperationsWorkspace({owner,branches,initialBranchId,initialView,initialFilter=''}: {owner:boolean;branches:Branch[];initialBranchId:string|null;initialView?:string;initialFilter?:string}) {
  const {lang}=useAdmin();const copy=operationsDictionary[lang];
  const [branchId,setBranchId]=useState(initialBranchId ?? (initialView==='till' ? branches.find(b=>b.code==='main')?.id ?? '' : ''));
  const allowed: View[]=owner ? ['overview','till','stock','assets','purchases','transfers','documents','reports','settings'] : ['till','stock','assets','documents'];
  const [view,setView]=useState<View>(allowed.includes(initialView as View) ? initialView as View : owner ? 'overview':'till');
  const [selected,setSelected]=useState<StockItem|null>(null);
  const [filter,setFilter]=useState(initialFilter);const [updated,setUpdated]=useState<Date|null>(null);const [readErrors,setReadErrors]=useState<Record<string,string>>({});
  const sessionExpired=Object.values(readErrors).includes('session_expired');
  const success=useCallback((asOf:Date,url:string)=>{setUpdated(previous=>!previous || asOf>previous ? asOf:previous);setReadErrors(previous=>{const next={...previous};delete next[url];return next;});},[]);
  const failure=useCallback((code:string,url:string)=>setReadErrors(previous=>({...previous,[url]:code})),[]);
  const clear=useCallback((url:string)=>setReadErrors(previous=>{if(previous[url]==='session_expired') return previous;const next={...previous};delete next[url];return next;}),[]);
  const feedback=useMemo(()=>({success,failure,clear}),[success,failure,clear]);
  const {revision,live,online,refresh}=useOperationsLive(sessionExpired);
  const mutation=useOperationsMutation(refresh);
  const bootstrap=useOperationsRead<{branches:Branch[]}>('/api/admin/operations?view=bootstrap',revision);
  const currentBranches=bootstrap.data?.branches ?? branches;
  const workingBranch=branchId || currentBranches.find(b=>b.code==='main')?.id || currentBranches[0]?.id || '';
  const chooseView=(next:View,nextFilter='')=>{
    if(next==='till' && !branchId) setBranchId(workingBranch);
    setView(next);setFilter(nextFilter);setSelected(null);setReadErrors(previous=>Object.fromEntries(Object.entries(previous).filter(([,code])=>code==='session_expired')));
    const url=new URL(window.location.href);url.searchParams.set('view',next);if(nextFilter) url.searchParams.set('filter',nextFilter);else url.searchParams.delete('filter');
    const effectiveBranch=next==='till' && !branchId ? workingBranch:branchId;if(effectiveBranch) url.searchParams.set('branchId',effectiveBranch);else url.searchParams.delete('branchId');window.history.replaceState(null,'',url);
  };
  const chooseStock=(item:StockItem)=>setSelected(item);
  return <OperationsReadFeedback.Provider value={feedback}><div className="mx-auto w-full min-w-0 max-w-[1500px] space-y-5">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-gold">APFEL PARK · BETRIEB</p><h1 className="mt-1 text-2xl font-semibold">{copy.title}</h1>
        <p className="mt-2 text-sm text-muted">{copy.subtitle}</p>
        <p role="status" className="mt-2 flex items-center gap-2 text-xs text-muted"><span aria-hidden="true" className={`h-2 w-2 rounded-full ${live ? 'bg-emerald-500':'bg-amber-500'}`}/>
          {sessionExpired ? copy.errorSession:!online ? copy.offline:Object.keys(readErrors).length ? copy.stale:live ? copy.live:copy.reconnecting}{updated ? ` · ${copy.updated} ${updated.toLocaleTimeString(lang==='de'?'de-DE':'en-GB',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Berlin'})}` : ''}</p>
        {sessionExpired ? <Link href="/login?redirectTo=/admin/kasse-lager" className="mt-2 inline-block min-h-11 py-3 text-sm text-gold underline">{copy.signIn}</Link>:null}
      </div>
      <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto"><label className="min-w-0 flex-1 sm:w-64"><span className="sr-only">{copy.source}</span>
        <select className={opsInput} value={branchId} disabled={!owner} onChange={e=>{setBranchId(e.target.value);setSelected(null);const url=new URL(window.location.href);if(e.target.value) url.searchParams.set('branchId',e.target.value);else url.searchParams.delete('branchId');window.history.replaceState(null,'',url);}}>
          {owner ? <option value="">{copy.allShops}</option> : null}{currentBranches.map(branch=><option key={branch.id} value={branch.id}>{branch.name}</option>)}
        </select></label><button type="button" className={opsQuietButton} onClick={refresh}>{copy.refresh}</button></div>
    </header>
    <nav aria-label={copy.title} className="flex flex-wrap gap-1 rounded-xl border border-border bg-surface p-1.5">
      {allowed.map(tab=><button key={tab} type="button" aria-current={tab===view ? 'page':undefined} onClick={()=>chooseView(tab)}
        className={`min-h-11 rounded-lg px-3.5 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-gold ${tab===view ? 'bg-gold text-black':'text-muted hover:bg-background hover:text-foreground'}`}>{copy[tab]}</button>)}
    </nav>
    {mutation.message ? <p role={mutation.message==='failed' ? 'alert':'status'} className={`rounded-xl border bg-surface p-3 text-sm ${mutation.message==='failed' ? 'border-red-500/30 text-foreground':'border-emerald-500/30 text-foreground'}`}>
      {mutation.message==='failed' ? operationErrorText(mutation.errorCode,copy) : copy.saved}</p> : null}
    {view==='overview' && owner ? <OverviewPanel branchId={branchId} revision={revision} copy={copy} locale={lang} onOpen={(next,selectedFilter)=>chooseView(next as View,selectedFilter)}/>:null}
    {view==='reports' && owner ? <ReportsPanel key={`${branchId}:${filter}`} branchId={branchId} revision={revision} copy={copy} locale={lang} initialFilter={filter} busy={mutation.busy || sessionExpired} mutate={mutation.mutate}/> : null}
    {view==='till' ? <TillPanel key={workingBranch} branchId={workingBranch} revision={revision} copy={copy} locale={lang} busy={mutation.busy} blocked={sessionExpired} mutate={mutation.mutate}/> : null}
    {view==='assets' ? <AssetsPanel key={`${branchId}:${filter}`} branchId={branchId} revision={revision} copy={copy} locale={lang} owner={owner} busy={mutation.busy || sessionExpired} mutate={mutation.mutate} initialFilter={filter}/> : null}
    {view==='stock' || view==='purchases' || view==='transfers' ? <>
      {owner ? <div className="flex justify-end"><Link className={opsQuietButton} href="/admin/products/new">{copy.newProduct}</Link></div> : null}
      <div className={`grid min-w-0 gap-5 ${owner ? 'xl:grid-cols-[minmax(0,1fr)_360px]':''}`}>
        <StockPanel key={`${branchId}:${filter}`} branchId={branchId} revision={revision} copy={copy} locale={lang} owner={owner} onSelect={owner ? chooseStock:undefined} initialFilter={filter}/>
        {owner ? <StockActions key={`${selected?.inventoryId}:${selected?.branchId}`} mode={view} item={selected} branches={currentBranches} copy={copy} busy={mutation.busy || sessionExpired} mutate={mutation.mutate}/> : null}
      </div>
      {view==='transfers' ? <DocumentsPanel key={`${branchId}:${filter}`} branchId={branchId} revision={revision} copy={copy} locale={lang} owner={owner} busy={mutation.busy || sessionExpired} mutate={mutation.mutate} transfers initialStatus={filter}/> : null}
    </> : null}
    {view==='documents' ? <DocumentsPanel branchId={branchId} revision={revision} copy={copy} locale={lang} owner={owner} busy={mutation.busy} mutate={mutation.mutate}/> : null}
    {view==='settings' && owner ? <SettingsPanel branchId={workingBranch} revision={revision} copy={copy} busy={mutation.busy} mutate={mutation.mutate}/> : null}
    {mutation.review ? <ReviewDialog preview={mutation.review.preview} action={String(mutation.review.body.action)} expectedTotal={mutation.review.options?.expectedTotalCents}
      sending={mutation.sending} errorCode={mutation.errorCode} copy={copy} locale={lang} onConfirm={()=>void mutation.confirm()} onCancel={mutation.cancel} onRetry={mutation.retry}/>:null}
  </div></OperationsReadFeedback.Provider>;
}
