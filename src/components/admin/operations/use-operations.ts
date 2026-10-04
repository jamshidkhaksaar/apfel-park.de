'use client';
import { useEffect,useRef,useState } from 'react';

export const useOperationsRead = <T,>(url: string, revision: number) => {
  const [data,setData]=useState<T|null>(null);const [loadedUrl,setLoadedUrl]=useState('');const [loading,setLoading]=useState(true);const [error,setError]=useState(false);
  useEffect(()=>{
    if (!url) return;
    const controller=new AbortController();
    const load=async () => {
      try {
        const response=await fetch(url,{signal:controller.signal,cache:'no-store'});
        if (!response.ok) throw new Error('load_failed');
        const result=await response.json() as T;
        if (!controller.signal.aborted) {setData(result);setLoadedUrl(url);setError(false);}
      } catch { if (!controller.signal.aborted) setError(true); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    };
    void load();return ()=>controller.abort();
  },[url,revision]);
  return {data:loadedUrl===url ? data : null,loading:loading || (!error && loadedUrl!==url),error};
};

export const useOperationsLive = () => {
  const [revision,setRevision]=useState(0);const [live,setLive]=useState(false);const [updated,setUpdated]=useState<Date|null>(null);
  const refresh=() => {setRevision(n=>n+1);setUpdated(new Date());};
  useEffect(()=>{
    let stopped=false;let connected=false;let source: EventSource|null=null;
    const update=() => {if (!stopped) {setRevision(n=>n+1);setUpdated(new Date());}};
    if (typeof EventSource!=='undefined') {
      source=new EventSource('/api/admin/operations/events');
      source.onopen=()=>{connected=true;setLive(true);};
      source.onmessage=()=>update();
      source.onerror=()=>{connected=false;setLive(false);};
    }
    const interval=setInterval(()=>{if (!connected && !document.hidden && navigator.onLine) update();},5000);
    const resume=()=>{if(!document.hidden) update();};document.addEventListener('visibilitychange',resume);
    return ()=>{stopped=true;source?.close();clearInterval(interval);document.removeEventListener('visibilitychange',resume);};
  },[]);
  return {revision,live,updated,refresh};
};

export const useOperationsMutation = (afterSave: () => void) => {
  const [busy,setBusy]=useState(false);const [message,setMessage]=useState<'saved'|'failed'|null>(null);
  const pending=useRef(false);const keys=useRef(new Map<string,string>());
  const mutate=async (body: Record<string,unknown>): Promise<Record<string,unknown>|null> => {
    if (pending.current) return null;
    pending.current=true;setBusy(true);setMessage(null);
    const fingerprint=JSON.stringify(body);let storageKey='';let persisted:string|null=null;
    try {
      const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(fingerprint));
      storageKey='apfel-ops-request:'+Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
      persisted=sessionStorage.getItem(storageKey);
    } catch { /* Private browsing can disable storage; keep the in-memory retry key. */ }
    const key=keys.current.get(fingerprint) ?? persisted ?? crypto.randomUUID();keys.current.set(fingerprint,key);
    try {if(storageKey) sessionStorage.setItem(storageKey,key);} catch { /* The server still enforces idempotency. */ }
    try {
      const response=await fetch('/api/admin/operations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...body,idempotencyKey:key})});
      if(!response.ok) throw new Error('save_failed');
      const result=await response.json() as Record<string,unknown>;
      keys.current.delete(fingerprint);try {if(storageKey) sessionStorage.removeItem(storageKey);} catch { /* Ignore unavailable preference storage. */ }
      setMessage('saved');afterSave();return result;
    } catch {setMessage('failed');return null;}
    finally {pending.current=false;setBusy(false);}
  };
  return {mutate,busy,message};
};
