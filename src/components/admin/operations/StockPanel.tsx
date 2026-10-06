'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect,useRef,useState,type FormEvent } from 'react';
import type { OperationsCopy } from '@/lib/admin-i18n';
import {isSensitiveSearchInput,type StockItem} from '@/lib/operations/types';
import { operationRequest,useOperationsRead } from './use-operations';
import { operationErrorText } from './ReviewDialog';
import { conditionText,Empty,money,opsInput,opsQuietButton } from './shared';

export default function StockPanel({branchId,revision,copy,locale,owner,onSelect,initialFilter=''}: {
  branchId:string;revision:number;copy:OperationsCopy;locale:'de'|'en';owner:boolean;onSelect?:(item:StockItem,assetId?:string)=>void;initialFilter?:string;
}) {
  const [query,setQuery]=useState('');const [search,setSearch]=useState('');const [page,setPage]=useState(1);const [scanBusy,setScanBusy]=useState(false);
  const [filter,setFilter]=useState(initialFilter);const [scanMessage,setScanMessage]=useState<string|null>(null);
  const queue=useRef<string[]>([]);const processing=useRef(false);const stopped=useRef(false);
  useEffect(()=>{stopped.current=false;return()=>{stopped.current=true;queue.current=[];};},[]);
  const input=useRef<HTMLInputElement>(null);
  const url=`/api/admin/operations?view=stock&branchId=${branchId}&q=${encodeURIComponent(search)}&page=${page}&filter=${filter}`;
  const {data,loading,error,retry}=useOperationsRead<{items:StockItem[];total:number}>(url,revision);
  const drain=async()=>{
    if(processing.current) return;processing.current=true;setScanBusy(true);
    try{while(queue.current.length && !stopped.current){const value=queue.current.shift()!;setSearch(value);setPage(1);
      try{
        const results=await operationRequest<{items:StockItem[]}>(`/api/admin/operations?view=stock&branchId=${branchId}&q=${encodeURIComponent(value)}`);
        if(stopped.current) return;
        if(results.items.length!==1){setScanMessage(results.items.length ? 'ambiguous':'missing');continue;}
        const item=results.items[0];let assetId:string|undefined;
        if(/^APF-\d{8,18}$/.test(value.toUpperCase())){
          const scanned=await operationRequest<{asset:{id:string}|null}>(`/api/admin/operations?view=scan&branchId=${branchId}&q=${encodeURIComponent(value.toUpperCase())}`);
          if(stopped.current) return;if(!scanned.asset){setScanMessage('missing');continue;}assetId=scanned.asset.id;
        }else if(item.sku!==value && !/^\d{8,14}$/.test(value) && !/^APS-\d{8,18}$/.test(value.toUpperCase())){setScanMessage('ambiguous');continue;}
        if(item.available>0){onSelect?.(item,assetId);setScanMessage('found');input.current?.focus();}else setScanMessage('missing');
      }catch(error){if(!stopped.current){setQuery(value);setScanMessage(error instanceof Error ? error.message:'network_error');}}
    }}finally{processing.current=false;if(!stopped.current) setScanBusy(false);}
  };
  const submit=(event:FormEvent)=>{
    event.preventDefault();const value=query.trim();if(isSensitiveSearchInput(value)){setQuery('');setScanMessage('private');return;}
    if(!onSelect || !branchId || !value){setSearch(value);setPage(1);return;}
    queue.current.push(value);setQuery('');void drain();
  };
  return <section className="min-w-0 space-y-4">
    <h2 className="sr-only">{copy.stock}</h2>
    <form onSubmit={submit} className="flex min-w-0 gap-2">
      <input ref={input} aria-label={copy.search} placeholder={copy.search} value={query} onChange={e=>setQuery(e.target.value)} className={opsInput} maxLength={80} />
      <button className={opsQuietButton}>{scanBusy ? copy.reviewLoading:copy.scan}</button>
    </form>
    {scanMessage ? <p role="status" className="text-sm">{{found:copy.scanFound,missing:copy.scanMissing,ambiguous:copy.scanAmbiguous,private:copy.scanPrivate}[scanMessage] ?? operationErrorText(scanMessage,copy)}</p>:null}
    <label className="flex flex-wrap items-center gap-2 text-sm">{copy.filter}<select className={opsInput+' sm:max-w-xs'} value={filter} onChange={e=>{setFilter(e.target.value);setPage(1);}}>
      <option value="">{copy.all}</option><option value="low">{copy.low}</option><option value="empty">{copy.empty}</option><option value="reserved">{copy.reserved}</option>
      {owner ? <><option value="inactive">{copy.inactive}</option><option value="missing_costs">{copy.missingCosts}</option></>:null}
    </select></label>
    {error ? <div role="alert" className="flex flex-wrap gap-2 text-sm"><span>{operationErrorText(error,copy)}</span><button type="button" className={opsQuietButton} onClick={retry}>{copy.retry}</button></div>:null}
    <div aria-busy={loading} className="grid gap-2">
      {loading && !data ? [1,2,3].map(n=><div key={n} className="h-24 rounded-xl border border-border bg-surface motion-safe:animate-pulse"/>) : null}
      {data?.items.map(item=><article key={`${item.inventoryId}:${item.branchId}`} className="flex min-w-0 flex-wrap items-center gap-3 rounded-xl border border-border bg-surface p-3 sm:flex-nowrap">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-white">
          {item.image && (item.image.startsWith('/') || item.image.startsWith('https://apfel-park.de/')) ? <Image src={item.image} alt="" fill sizes="56px" unoptimized className="object-contain p-1" /> :
            <svg aria-hidden="true" viewBox="0 0 24 24" className="m-3 h-8 w-8 text-gold" fill="none" stroke="currentColor"><rect x="6" y="2" width="12" height="20" rx="2"/><path d="M10 18h4"/></svg>}
        </div>
        <div className="min-w-0 flex-1"><h3 className="break-words text-sm font-semibold">{item.title}</h3>
          <p className="mt-1 break-all text-xs text-muted">{item.sku} · {conditionText(item.condition,copy)} · {item.branchName}</p>
          <p className="mt-1 text-xs font-medium">{item.available===0 ? copy.empty : `${copy.available}: ${item.available}`} · {copy.reserved}: {item.reserved}</p>
          {item.active===false ? <p className="mt-1 text-xs text-muted">{copy.inactive}</p>:null}
          {owner && item.missingCosts ? <p className="mt-1 text-xs text-amber-600">{copy.missingCosts}: {item.missingCosts}</p> : null}
        </div>
        <div className="ml-auto flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:max-w-[60%]"><span className="text-sm font-semibold tabular-nums">{money(item.priceCents,locale)}</span>
          {onSelect ? <button type="button" className={opsQuietButton} disabled={!owner && item.available===0} onClick={()=>onSelect(item)}>{copy.select}</button> : null}
          {owner ? <Link href={`/admin/products/${item.productId}`} className="p-2 text-xs font-medium text-gold underline">{copy.editProduct}</Link> : null}
          {owner ? <a className="p-2 text-xs font-medium underline" href={`/admin/kasse-lager/labels?inventory=${item.inventoryId}`} target="_blank" rel="noopener noreferrer">{copy.labels}</a> : null}
        </div>
      </article>)}
      {!loading && !error && !data?.items.length ? <Empty copy={copy} /> : null}
    </div>
    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
      <span>{data?.total ?? 0} · {copy.page} {page}</span>
      <div className="flex gap-2"><button type="button" className={opsQuietButton} disabled={page<=1} onClick={()=>setPage(n=>n-1)}>{copy.previous}</button>
        <button type="button" className={opsQuietButton} disabled={page*40>=(data?.total ?? 0)} onClick={()=>setPage(n=>n+1)}>{copy.next}</button></div>
    </div>
  </section>;
}
