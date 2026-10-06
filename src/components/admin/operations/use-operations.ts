'use client';
import { createContext,useContext,useEffect,useRef,useState } from 'react';
import type { OperationPreview } from '@/lib/operations/types';

export const OperationsReadFeedback=createContext<{success:(asOf:Date,url:string)=>void;failure:(code:string,url:string)=>void;clear:(url:string)=>void}>({success:()=>{},failure:()=>{},clear:()=>{}});
export const useDebouncedSearch=(value:string) => {
  const [debounced,setDebounced]=useState(value);
  useEffect(()=>{const timer=setTimeout(()=>setDebounced(value),300);return()=>clearTimeout(timer);},[value]);return debounced;
};
export const operationRequest=async<T,>(url:string,init:RequestInit={}):Promise<T> => {
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),15000);
  const abort=()=>controller.abort();init.signal?.addEventListener('abort',abort,{once:true});
  try {
    const response=await fetch(url,{...init,signal:controller.signal,cache:'no-store'});
    let body:Record<string,unknown>;try{body=await response.json();}catch{throw new Error('invalid_response');}
    if(!response.ok) throw new Error(response.status===401 ? 'session_expired':typeof body.error==='string' && /^[a-z_]{3,80}$/.test(body.error) ? body.error:'operations_failed');
    return body as T;
  }catch(error){if(controller.signal.aborted) throw new Error('request_timeout');throw error instanceof Error ? error:new Error('network_error');}
  finally{clearTimeout(timer);init.signal?.removeEventListener('abort',abort);}
};
export const useOperationsRead=<T,>(url:string,revision:number) => {
  const [data,setData]=useState<T|null>(null);const [loadedUrl,setLoadedUrl]=useState('');const [loading,setLoading]=useState(Boolean(url));
  const [error,setError]=useState<string|null>(null);const [retryRevision,setRetryRevision]=useState(0);const feedback=useContext(OperationsReadFeedback);
  const feedbackRef=useRef(feedback);feedbackRef.current=feedback;const expired=useRef(false);
  useEffect(()=>()=>feedbackRef.current.clear(url),[url]);
  useEffect(()=>{
    if(!url || expired.current) return;const controller=new AbortController();setLoading(true);setError(null);
    const load=async()=>{
      try {
        const result=await operationRequest<T>(url,{signal:controller.signal});if(controller.signal.aborted) return;
        setData(result);setLoadedUrl(url);const asOf=(result as {asOf?:string})?.asOf;const parsed=asOf ? new Date(asOf):new Date();
        feedbackRef.current.success(Number.isFinite(parsed.getTime()) ? parsed:new Date(),url);
      }catch(error){if(!controller.signal.aborted){const code=error instanceof Error ? error.message:'network_error';setError(code);
        if(code==='session_expired') expired.current=true;feedbackRef.current.failure(code,url);}}
      finally{if(!controller.signal.aborted) setLoading(false);}
    };void load();return()=>controller.abort();
  },[url,revision,retryRevision]);
  return {data:loadedUrl===url ? data:null,loading,error,retry:()=>setRetryRevision(n=>n+1)};
};
export const useOperationsLive=(sessionExpired=false) => {
  const [revision,setRevision]=useState(0);const [live,setLive]=useState(false);const [online,setOnline]=useState(true);
  const refresh=()=>setRevision(n=>n+1);
  useEffect(()=>{
    if(sessionExpired) return;let source:EventSource|null=null;let connected=false;let stopped=false;
    const update=()=>{if(!stopped && !document.hidden && navigator.onLine) setRevision(n=>n+1);};
    const connection=()=>{setOnline(navigator.onLine);if(!navigator.onLine){connected=false;setLive(false);}else update();};
    setOnline(navigator.onLine);
    if(typeof EventSource!=='undefined') {source=new EventSource('/api/admin/operations/events');
      source.onopen=()=>{connected=true;setLive(true);update();};source.onmessage=update;
      source.onerror=()=>{connected=false;setLive(false);};}
    let ticks=0;const timer=setInterval(()=>{ticks++;if(!connected || ticks%6===0) update();},5000);
    document.addEventListener('visibilitychange',update);window.addEventListener('online',connection);window.addEventListener('offline',connection);
    return()=>{stopped=true;source?.close();clearInterval(timer);document.removeEventListener('visibilitychange',update);window.removeEventListener('online',connection);window.removeEventListener('offline',connection);};
  },[sessionExpired]);
  return {revision,live:live && !sessionExpired,online,refresh};
};

export type MutationOptions={expectedTotalCents?:number};
type PendingReview={body:Record<string,unknown>;preview:OperationPreview|null;options?:MutationOptions};
export const useOperationsMutation=(afterSave:()=>void) => {
  const [sending,setSending]=useState(false);const [message,setMessage]=useState<'saved'|'failed'|null>(null);const [errorCode,setErrorCode]=useState<string|null>(null);
  const [review,setReview]=useState<PendingReview|null>(null);const reviewRef=useRef<PendingReview|null>(null);
  const resolver=useRef<((value:Record<string,unknown>|null)=>void)|null>(null);const pending=useRef(false);const keyCache=useRef(new Map<string,string>());
  const notifyReview=(value:PendingReview|null)=>{reviewRef.current=value;setReview(value);};
  useEffect(()=>()=>{resolver.current?.(null);resolver.current=null;},[]);
  const requestKey=async(body:Record<string,unknown>) => {
    const fingerprint=JSON.stringify(body);let storageKey='';let stored:string|null=null;
    try {const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(fingerprint));storageKey='apfel-ops-request:'+Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');stored=sessionStorage.getItem(storageKey);}catch{}
    const key=keyCache.current.get(fingerprint) ?? stored ?? crypto.randomUUID();keyCache.current.set(fingerprint,key);
    try{if(storageKey) sessionStorage.setItem(storageKey,key);}catch{}
    return {key,storageKey,fingerprint};
  };
  const loadPreview=async(value:PendingReview) => {
    setSending(true);setErrorCode(null);
    try{const preview=await operationRequest<OperationPreview>('/api/admin/operations/preview',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(value.body)});notifyReview({...value,preview});}
    catch(error){setErrorCode(error instanceof Error ? error.message:'network_error');setMessage('failed');}
    finally{setSending(false);}
  };
  const mutate=async(body:Record<string,unknown>,options?:MutationOptions):Promise<Record<string,unknown>|null> => {
    if(pending.current) return null;pending.current=true;setMessage(null);setErrorCode(null);
    const savedKey=await requestKey(body);const value={body:{...body,idempotencyKey:savedKey.key},preview:null,options};
    notifyReview(value);const promise=new Promise<Record<string,unknown>|null>(resolve=>{resolver.current=resolve;});void loadPreview(value);return promise;
  };
  const cancel=()=>{notifyReview(null);pending.current=false;resolver.current?.(null);resolver.current=null;setSending(false);};
  const confirm=async()=>{
    const value=reviewRef.current;if(!value?.preview || sending) return;
    setSending(true);setErrorCode(null);
    try{
      const result=await operationRequest<Record<string,unknown>>('/api/admin/operations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...value.body,previewToken:value.preview.token})});
      const original=Object.fromEntries(Object.entries(value.body).filter(([key])=>key!=='idempotencyKey'));const savedKey=await requestKey(original);
      keyCache.current.delete(savedKey.fingerprint);try{if(savedKey.storageKey) sessionStorage.removeItem(savedKey.storageKey);}catch{}
      notifyReview(null);pending.current=false;setMessage('saved');afterSave();resolver.current?.(result);resolver.current=null;
    }catch(error){setErrorCode(error instanceof Error ? error.message:'network_error');setMessage('failed');}
    finally{setSending(false);}
  };
  return {mutate,busy:sending || review!==null,sending,message,errorCode,review,confirm,cancel,retry:()=>{if(reviewRef.current) void loadPreview(reviewRef.current);}};
};
