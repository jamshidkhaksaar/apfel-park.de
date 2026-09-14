'use client';
import { useEffect, useState } from 'react';
import type { PublicPromotion } from '@/lib/promotion';

export const usePromotion = (query:string|null,initial:PublicPromotion|null=null) => {
  const [state,setState]=useState<{key:string|null;value:PublicPromotion|null}>({key:query,value:initial});
  useEffect(()=>{
    if(query===null)return;
    let closed=false,version=0;const controller=new AbortController();
    const refresh=async()=>{const current=++version;try{
      const response=await fetch(`/api/store/promotion${query?'?'+query:''}`,{cache:'no-store',signal:controller.signal});
      const data=await response.json();if(!closed&&current===version)setState({key:query,value:response.ok?data.promotion:null});
    }catch{if(!closed&&current===version)setState({key:query,value:null});}};
    void refresh();const timer=setInterval(()=>{if(!document.hidden)void refresh();},30_000);
    const visible=()=>{if(!document.hidden)void refresh();};document.addEventListener('visibilitychange',visible);
    return()=>{closed=true;controller.abort();clearInterval(timer);document.removeEventListener('visibilitychange',visible);};
  },[query]);
  return state.key===query?state.value:null;
};
