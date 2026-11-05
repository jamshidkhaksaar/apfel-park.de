'use client';
import Image from 'next/image';
import { useState,type FormEvent } from 'react';
import { adminDictionary,type OperationsCopy } from '@/lib/admin-i18n';
import {isSensitiveSearchInput,type Asset} from '@/lib/operations/types';
import type { Mutate } from './StockActions';
import { useDebouncedSearch,useOperationsRead } from './use-operations';
import PrivateIdentifiers from './PrivateIdentifiers';
import { operationErrorText } from './ReviewDialog';
import { conditionText,Empty,Field,FormActions,money,opsInput,opsQuietButton,Section,statusText } from './shared';

export default function AssetsPanel({branchId,revision,copy,locale,owner,mutate,busy,initialFilter=''}: {
  branchId:string;revision:number;copy:OperationsCopy;locale:'de'|'en';owner:boolean;mutate:Mutate;busy:boolean;initialFilter?:string;
}) {
  const [search,setSearch]=useState('');const [page,setPage]=useState(1);const [selected,setSelected]=useState<Asset|null>(null);
  const [filter,setFilter]=useState(initialFilter);const [status,setStatus]=useState('');
  const [brand,setBrand]=useState('');const [category,setCategory]=useState('');const [condition,setCondition]=useState('');
  const debouncedSearch=useDebouncedSearch(search);
  const params=`branchId=${branchId}&q=${encodeURIComponent(debouncedSearch)}&page=${page}&filter=${filter}&status=${status}`
    +`&brand=${encodeURIComponent(brand)}&category=${encodeURIComponent(category)}&condition=${encodeURIComponent(condition)}`;
  const {data,loading,error,retry}=useOperationsRead<{assets:Asset[];total:number;filterOptions:{brands:string[];categories:string[];conditions:string[]}}>(`/api/admin/operations?view=assets&${params}`,revision);
  const brands=data?.filterOptions?.brands ?? [];const categories=data?.filterOptions?.categories ?? [];const conditions=data?.filterOptions?.conditions ?? [];
  const categoryLabels=adminDictionary[locale].productForm.categories as Record<string,string>;
  const submit=async (event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault();if(!selected) return;
    const form=event.currentTarget;const body:Record<string,unknown>={action:'asset_update',assetId:selected.id,branchId:selected.branchId};
    for(const [key,value] of new FormData(form)) body[key]=String(value);
    if(await mutate(body)) setSelected(null);
  };
  return <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
    <div className="min-w-0 space-y-3">
      <h2 className="sr-only">{copy.assets}</h2>
      <input aria-label={copy.search} placeholder={copy.search} className={opsInput} value={search} maxLength={80} onChange={e=>{setSearch(isSensitiveSearchInput(e.target.value) ? '' : e.target.value);setPage(1);}}/>
      <div className="flex flex-wrap gap-3">
        <label className="min-w-0 flex-1 text-xs">{copy.status}<select className={opsInput} value={status} onChange={e=>{setStatus(e.target.value);setPage(1);}}><option value="">{copy.all}</option>{['available','reserved','sold','inspection','transit','faulty','written_off'].map(value=><option key={value} value={value}>{statusText(value,copy)}</option>)}</select></label>
        <label className="min-w-0 flex-1 text-xs">{copy.brand}<select className={opsInput} value={brand} onChange={e=>{setBrand(e.target.value);setPage(1);}}><option value="">{copy.all}</option>{brands.map(value=><option key={value} value={value}>{value}</option>)}</select></label>
        <label className="min-w-0 flex-1 text-xs">{copy.category}<select className={opsInput} value={category} onChange={e=>{setCategory(e.target.value);setPage(1);}}><option value="">{copy.all}</option>{categories.map(value=><option key={value} value={value}>{categoryLabels[value] ?? value}</option>)}</select></label>
        <label className="min-w-0 flex-1 text-xs">{copy.condition}<select className={opsInput} value={condition} onChange={e=>{setCondition(e.target.value);setPage(1);}}><option value="">{copy.all}</option>{conditions.map(value=><option key={value} value={value}>{conditionText(value,copy)}</option>)}</select></label>
        {owner ? <label className="min-w-0 flex-1 text-xs">{copy.filter}<select className={opsInput} value={filter} onChange={e=>{setFilter(e.target.value);setPage(1);}}><option value="">{copy.all}</option><option value="missing_details">{copy.missingDetails}</option><option value="missing_costs">{copy.missingCosts}</option></select></label>:null}
      </div>
      {error ? <div role="alert" className="flex flex-wrap gap-2 text-sm"><span>{operationErrorText(error,copy)}</span><button type="button" className={opsQuietButton} onClick={retry}>{copy.retry}</button></div>:null}
      <div className="space-y-2" aria-busy={loading}>{data?.assets.map(asset=><article key={asset.id} className="rounded-xl border border-border bg-surface p-4">
        <div className="flex flex-wrap items-start gap-3">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-white">
            {asset.image ? <Image src={asset.image} alt="" fill sizes="64px" unoptimized className="object-contain p-1" /> :
              <svg aria-hidden="true" viewBox="0 0 24 24" className="m-3 h-10 w-10 text-gold" fill="none" stroke="currentColor"><rect x="6" y="2" width="12" height="20" rx="2"/><path d="M10 18h4"/></svg>}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold">{asset.title}</h3><p className="mt-1 break-all font-mono text-xs text-gold">{asset.label}</p>
            <p className="mt-1 text-xs text-muted">{statusText(asset.state,copy)} · {[asset.color,asset.storage,asset.batteryHealth===null ? '' : `${asset.batteryHealth}%`].filter(Boolean).join(' · ')}</p>
            {asset.createdAt ? <p className="mt-1 text-xs text-muted">{copy.created}: {new Date(asset.createdAt).toLocaleString(locale==='de'?'de-DE':'en-GB',{timeZone:'Europe/Berlin'})}</p> : null}
            {!asset.color || !asset.storage ? <p className="mt-2 text-xs text-amber-600">{copy.missingDetails}</p>:null}
            {owner ? <p className="mt-2 text-xs">{asset.costGrossCents===null ? copy.missingCosts : money(asset.costGrossCents ?? 0,locale)} · {asset.identifierRecorded ? copy.identifierStored : copy.identifierMissing}</p> : null}
          </div>
          {owner ? <div className="flex flex-wrap gap-2">
            <a className={opsQuietButton} href={`/admin/kasse-lager/labels?ids=${asset.id}`} target="_blank" rel="noopener noreferrer">{copy.labels}</a>
            <button type="button" className={opsQuietButton} disabled={asset.state!=='available'} onClick={()=>setSelected(asset)}>{copy.select}</button>
          </div> : null}
        </div>
        {owner && asset.identifierRecorded ? <PrivateIdentifiers assetId={asset.id} branchId={asset.branchId} copy={copy}/> : null}
      </article>)}{!loading && !error && !data?.assets.length ? <Empty copy={copy}/> : null}</div>
      <div className="flex items-center justify-between gap-2"><button type="button" className={opsQuietButton} disabled={page<=1} onClick={()=>setPage(n=>n-1)}>{copy.previous}</button>
        <span className="text-xs">{data?.total ?? 0} · {copy.page} {page}</span><button type="button" className={opsQuietButton} disabled={page*40>=(data?.total ?? 0)} onClick={()=>setPage(n=>n+1)}>{copy.next}</button></div>
    </div>
    {owner && selected ? <Section title={`${copy.selected}: ${selected.label}`}><form key={selected.id} onSubmit={submit} className="grid gap-3">
      <p className="text-xs text-muted">{copy.assetListingNote}</p>
      <Field label={copy.color}><input name="color" defaultValue={selected.color} className={opsInput}/></Field>
      <Field label={copy.storage}><input name="storage" defaultValue={selected.storage} placeholder="128 GB" className={opsInput}/></Field>
      <Field label={copy.battery}><input name="batteryHealth" type="number" min="0" max="100" defaultValue={selected.batteryHealth ?? ''} className={opsInput}/></Field>
      <Field label={copy.unitGross}><input name="unitGross" inputMode="decimal" defaultValue={selected.costGrossCents===null ? '' : String((selected.costGrossCents ?? 0)/100)} className={opsInput}/></Field>
      <Field label={copy.unitNet}><input name="unitNet" inputMode="decimal" defaultValue={selected.costNetCents===null ? '' : String((selected.costNetCents ?? 0)/100)} className={opsInput}/></Field>
      <Field label={copy.serial}><input name="serial" autoComplete="off" maxLength={40} className={opsInput}/></Field>
      <Field label={copy.imei}><input name="imei" autoComplete="off" maxLength={40} className={opsInput}/></Field>
      <p className="text-xs leading-relaxed text-muted">{copy.serialNote}</p>
      <Field label={copy.note}><textarea name="note" required maxLength={500} className={opsInput}/></Field>
      <FormActions copy={copy} busy={busy} label={copy.saveAsset}/>
    </form></Section> : null}
  </div>;
}
