'use client';
import { useEffect,useState } from 'react';
import type { OperationsCopy } from '@/lib/admin-i18n';
import { opsQuietButton } from './shared';
export default function PrivateIdentifiers({assetId,branchId,copy}: {assetId:string;branchId:string;copy:OperationsCopy}) {
  const [data,setData]=useState<{serial:string|null;imei:string|null}|null>(null);const [busy,setBusy]=useState(false);const [failed,setFailed]=useState(false);
  useEffect(()=>{if(!data) return;const timer=setTimeout(()=>setData(null),60000);return()=>clearTimeout(timer);},[data]);
  const reveal=async()=>{
    setBusy(true);setFailed(false);
    try {
      const response=await fetch('/api/admin/operations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'asset_private',assetId,branchId})});
      if(!response.ok) throw new Error('private_read_failed');setData(await response.json());
    } catch {setFailed(true);} finally {setBusy(false);}
  };
  return <div className="mt-3">
    <button type="button" disabled={busy} className={opsQuietButton} onClick={()=>data ? setData(null) : void reveal()}>{data ? copy.hideIdentifiers : copy.showIdentifiers}</button>
    {failed ? <p role="alert" className="mt-2 text-xs">{copy.failed}</p> : null}
    {data ? <dl className="mt-3 grid gap-1 break-all text-xs"><dt>{copy.serial}</dt><dd className="font-mono">{data.serial ?? '—'}</dd><dt>{copy.imei}</dt><dd className="font-mono">{data.imei ?? '—'}</dd></dl> : null}
  </div>;
}
