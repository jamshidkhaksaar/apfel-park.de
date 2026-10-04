'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useRef,useState,type FormEvent } from 'react';
import type { OperationsCopy } from '@/lib/admin-i18n';
import {isSensitiveSearchInput,type StockItem} from '@/lib/operations/types';
import { useOperationsRead } from './use-operations';
import { conditionText,Empty,money,opsInput,opsQuietButton } from './shared';

export default function StockPanel({branchId,revision,copy,locale,owner,onSelect}: {
  branchId:string;revision:number;copy:OperationsCopy;locale:'de'|'en';owner:boolean;onSelect?:(item:StockItem,assetId?:string)=>void;
}) {
  const [query,setQuery]=useState('');const [search,setSearch]=useState('');const [page,setPage]=useState(1);const [scanBusy,setScanBusy]=useState(false);
  const input=useRef<HTMLInputElement>(null);
  const url=`/api/admin/operations?view=stock&branchId=${branchId}&q=${encodeURIComponent(search)}&page=${page}`;
  const {data,loading,error}=useOperationsRead<{items:StockItem[];total:number}>(url,revision);
  const submit=async (event:FormEvent) => {
    event.preventDefault();const value=query.trim();
    if(isSensitiveSearchInput(value)) {setQuery('');return;}
    setSearch(value);setPage(1);
    if (!onSelect || !branchId || !value) return;
    setScanBusy(true);
    try {
      const response=await fetch(`/api/admin/operations?view=stock&branchId=${branchId}&q=${encodeURIComponent(value)}`,{cache:'no-store'});
      if(!response.ok) return;const results=await response.json() as {items:StockItem[]};
      if(results.items.length!==1) return;
      const item=results.items[0];let assetId: string|undefined;
      if(/^APF-\d{8,18}$/.test(value.toUpperCase())) {
        const scan=await fetch(`/api/admin/operations?view=scan&branchId=${branchId}&q=${encodeURIComponent(value.toUpperCase())}`,{cache:'no-store'});
        if(!scan.ok) return;const scanned=await scan.json() as {asset:{id:string}|null};
        if(!scanned.asset) return;assetId=scanned.asset.id;
      } else if (item.sku!==value && !/^\d{8,14}$/.test(value) && !/^APS-\d{8,18}$/.test(value.toUpperCase())) return;
      if(item.available>0) {onSelect(item,assetId);setQuery('');input.current?.focus();}
    } finally {setScanBusy(false);}
  };
  return <section className="min-w-0 space-y-4">
    <h2 className="sr-only">{copy.stock}</h2>
    <form onSubmit={submit} className="flex min-w-0 gap-2">
      <input ref={input} aria-label={copy.search} placeholder={copy.search} value={query} onChange={e=>setQuery(e.target.value)} className={opsInput} maxLength={80} />
      <button className={opsQuietButton} disabled={scanBusy}>{copy.scan}</button>
    </form>
    {error ? <p role="alert" className="text-sm text-red-500">{copy.failed}</p> : null}
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
          {owner && item.missingCosts ? <p className="mt-1 text-xs text-amber-600">{copy.missingCosts}: {item.missingCosts}</p> : null}
        </div>
        <div className="ml-auto flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:max-w-[60%]"><span className="text-sm font-semibold tabular-nums">{money(item.priceCents,locale)}</span>
          {onSelect ? <button type="button" className={opsQuietButton} disabled={!owner && item.available===0} onClick={()=>onSelect(item)}>{copy.select}</button> : null}
          {owner ? <Link href={`/admin/products/${item.productId}`} className="p-2 text-xs font-medium text-gold underline">{copy.editProduct}</Link> : null}
          {owner ? <a className="p-2 text-xs font-medium underline" href={`/admin/kasse-lager/labels?inventory=${item.inventoryId}`} target="_blank" rel="noopener noreferrer">{copy.labels}</a> : null}
        </div>
      </article>)}
      {!loading && !data?.items.length ? <Empty copy={copy} /> : null}
    </div>
    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
      <span>{data?.total ?? 0} · {copy.page} {page}</span>
      <div className="flex gap-2"><button type="button" className={opsQuietButton} disabled={page<=1} onClick={()=>setPage(n=>n-1)}>{copy.previous}</button>
        <button type="button" className={opsQuietButton} disabled={page*40>=(data?.total ?? 0)} onClick={()=>setPage(n=>n+1)}>{copy.next}</button></div>
    </div>
  </section>;
}
