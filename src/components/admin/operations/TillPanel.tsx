'use client';
import { useState } from 'react';
import type { OperationsCopy } from '@/lib/admin-i18n';
import type { StockItem } from '@/lib/operations/types';
import type { Mutate } from './StockActions';
import { money,opsButton,opsQuietButton,Section } from './shared';
import StockPanel from './StockPanel';

type Line = {item:StockItem;assetId?:string;quantity:number};
export default function TillPanel({branchId,revision,copy,locale,mutate,busy,blocked=false}: {
  branchId:string;revision:number;copy:OperationsCopy;locale:'de'|'en';mutate:Mutate;busy:boolean;blocked?:boolean;
}) {
  const [lines,setLines]=useState<Line[]>([]);const [receipt,setReceipt]=useState<string|null>(null);
  const add=(item:StockItem,assetId?:string)=>{
    setReceipt(null);
    setLines(previous=>{
      const old=previous.find(line=>line.item.inventoryId===item.inventoryId && line.assetId===assetId);
      if(old) return previous.map(line=>line===old ? {...line,quantity:Math.min(assetId ? 1 : item.available,line.quantity+1)} : line);
      return item.available>0 ? [...previous,{item,assetId,quantity:1}] : previous;
    });
  };
  const submit=async ()=>{
    const result=await mutate({action:'training_sale',branchId,items:lines.map(line=>({inventoryId:line.item.inventoryId,quantity:line.quantity,...(line.assetId ? {assetId:line.assetId}:{})}))},{expectedTotalCents:lines.reduce((sum,line)=>sum+line.quantity*line.item.priceCents,0)});
    if(result) {setReceipt(String(result.id));setLines([]);}
  };
  return <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
    <div className="min-w-0"><p className="mb-4 rounded-xl border border-gold/30 bg-gold/5 p-4 text-sm leading-relaxed">{copy.trainingNote}</p>
      <StockPanel branchId={branchId} revision={revision} copy={copy} locale={locale} owner={false} onSelect={add}/></div>
    <div className="min-w-0 self-start xl:sticky xl:top-0"><Section title={copy.basket}>
      {lines.length ? <ul className="divide-y divide-border">{lines.map((line,index)=><li key={`${line.item.inventoryId}:${line.assetId ?? ''}`} className="py-3">
        <p className="text-sm font-medium">{line.item.title}</p><p className="mt-1 break-all text-xs text-muted">{line.item.sku}{line.assetId ? ' · '+copy.assets : ''}</p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2"><label className="flex items-center gap-2 text-xs">{copy.quantity}<input type="number" min="1" max={line.assetId ? 1:line.item.available}
          value={line.quantity} disabled={busy || Boolean(line.assetId)} aria-label={`${copy.quantity}: ${line.item.title}`} className="min-h-11 w-16 rounded-lg border border-border bg-background px-2"
          onChange={e=>{const quantity=Number(e.target.value);if(Number.isInteger(quantity) && quantity>=1 && quantity<=line.item.available) setLines(old=>old.map((item,n)=>n===index ? {...item,quantity}:item));}} /></label><span className="text-sm tabular-nums">{money(line.item.priceCents,locale)}</span>
          <button className={opsQuietButton} type="button" aria-label={`${copy.remove}: ${line.item.title}`} onClick={()=>setLines(old=>old.filter((_,n)=>n!==index))}>{copy.remove}</button></div>
      </li>)}</ul> : <p className="py-6 text-sm text-muted">{copy.basketEmpty}</p>}
      <div className="mt-4 flex justify-between border-t border-border pt-4 text-lg font-semibold"><span>{copy.total}</span><span className="tabular-nums">{money(lines.reduce((sum,line)=>sum+line.quantity*line.item.priceCents,0),locale)}</span></div>
      <button className={`${opsButton} mt-4 w-full`} type="button" disabled={busy || blocked || !lines.length || !branchId} onClick={()=>void submit()}>{busy ? copy.saving : copy.trainingReceipt}</button>
      {receipt ? <a className={`${opsQuietButton} mt-3 block text-center`} href={`/api/admin/operations/documents/${receipt}`} target="_blank" rel="noopener noreferrer">{copy.print}</a> : null}
    </Section></div>
  </div>;
}
