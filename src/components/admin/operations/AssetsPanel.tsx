'use client';
import { useState,type FormEvent } from 'react';
import type { OperationsCopy } from '@/lib/admin-i18n';
import {isSensitiveSearchInput,type Asset} from '@/lib/operations/types';
import type { Mutate } from './StockActions';
import { useOperationsRead } from './use-operations';
import PrivateIdentifiers from './PrivateIdentifiers';
import { Empty,Field,FormActions,money,opsInput,opsQuietButton,Section,statusText } from './shared';

export default function AssetsPanel({branchId,revision,copy,locale,owner,mutate,busy}: {
  branchId:string;revision:number;copy:OperationsCopy;locale:'de'|'en';owner:boolean;mutate:Mutate;busy:boolean;
}) {
  const [search,setSearch]=useState('');const [page,setPage]=useState(1);const [selected,setSelected]=useState<Asset|null>(null);
  const {data,loading,error}=useOperationsRead<{assets:Asset[]}>(`/api/admin/operations?view=assets&branchId=${branchId}&q=${encodeURIComponent(search)}&page=${page}`,revision);
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
      {error ? <p role="alert">{copy.failed}</p> : null}
      <div className="space-y-2" aria-busy={loading}>{data?.assets.map(asset=><article key={asset.id} className="rounded-xl border border-border bg-surface p-4">
        <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0">
          <h3 className="text-sm font-semibold">{asset.title}</h3><p className="mt-1 break-all font-mono text-xs text-gold">{asset.label}</p>
          <p className="mt-1 text-xs text-muted">{statusText(asset.state,copy)} · {[asset.color,asset.storage,asset.batteryHealth===null ? '' : `${asset.batteryHealth}%`].filter(Boolean).join(' · ')}</p>
          {owner ? <p className="mt-2 text-xs">{asset.costGrossCents===null ? copy.missingCosts : money(asset.costGrossCents ?? 0,locale)} · {asset.identifierRecorded ? copy.identifierStored : copy.identifierMissing}</p> : null}
        </div>{owner ? <div className="flex flex-wrap gap-2">
          <a className={opsQuietButton} href={`/admin/kasse-lager/labels?ids=${asset.id}`} target="_blank" rel="noopener noreferrer">{copy.labels}</a>
          <button type="button" className={opsQuietButton} disabled={asset.state!=='available'} onClick={()=>setSelected(asset)}>{copy.select}</button>
        </div> : null}</div>
        {owner && asset.identifierRecorded ? <PrivateIdentifiers assetId={asset.id} branchId={asset.branchId} copy={copy}/> : null}
      </article>)}{!loading && !data?.assets.length ? <Empty copy={copy}/> : null}</div>
      <div className="flex items-center justify-between gap-2"><button type="button" className={opsQuietButton} disabled={page<=1} onClick={()=>setPage(n=>n-1)}>{copy.previous}</button>
        <span className="text-xs">{copy.page} {page}</span><button type="button" className={opsQuietButton} disabled={(data?.assets.length ?? 0)<40} onClick={()=>setPage(n=>n+1)}>{copy.next}</button></div>
    </div>
    {owner && selected ? <Section title={`${copy.selected}: ${selected.label}`}><form key={selected.id} onSubmit={submit} className="grid gap-3">
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
