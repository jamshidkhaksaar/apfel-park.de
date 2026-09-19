'use client';
import { useEffect, useRef, useState } from 'react';
import type { ShippingMethod } from '@/lib/checkout';
import type { StoredCartItem } from '@/components/checkout/cart';
import { promotionDiscount, promotionExclusions, promotionScope, promotionMatchesCart } from '@/lib/promotion';
import { usePromotion } from './usePromotion';

export type CartCouponPreview = {key:string;code:string;discountAmountCents:number;previewTotalAmountCents:number;previewVatAmountCents:number;expiresAt:number|null};
export default function CartPromotion({locale,items,eligibilityItems,shippingMethod,cartKey,applied,onApplied,onBusy}:{locale:'de'|'en';items:StoredCartItem[];eligibilityItems:Array<{productId:string;category:string}>;shippingMethod:ShippingMethod;cartKey:string;applied:CartCouponPreview|null;onApplied:(value:CartCouponPreview|null)=>void;onBusy:(busy:boolean)=>void}){
  const promotion=usePromotion(''),de=locale==='de';
  const [busy,setBusy]=useState(false),[message,setMessage]=useState('');
  const alive=useRef(true);
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
  const apply=async()=>{
    if(!promotion)return;
    setBusy(true);onBusy(true);setMessage('');
    try{
      const response=await fetch('/api/coupons/validate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code:promotion.code,items,shippingMethod})});
      const data=await response.json();
      if(!alive.current)return;
      if(!response.ok||!data.success)throw new Error('invalid_coupon');
      if(![data.discountAmountCents,data.previewTotalAmountCents,data.previewVatAmountCents].every(n=>Number.isFinite(n)&&n>=0))throw new Error('invalid_coupon');
      onApplied({key:cartKey,code:String(data.code),discountAmountCents:data.discountAmountCents,previewTotalAmountCents:data.previewTotalAmountCents,previewVatAmountCents:data.previewVatAmountCents,expiresAt:promotion.endsAt?Date.now()+promotion.expiresInSeconds*1000:null});
      setMessage(de?'Gutschein geprüft und angewendet.':'Coupon validated and applied.');
    }catch{if(alive.current){onApplied(null);setMessage(de?'Dieser Gutschein passt aktuell nicht zum Warenkorb oder ist nicht mehr gültig. Mindestbestellwert und Artikel prüfen.':'This coupon is not valid for the current basket or is no longer available. Check the minimum spend and eligible items.');}}
    finally{if(alive.current){setBusy(false);onBusy(false);}}
  };
  if(!applied&&(!promotion||!promotionMatchesCart(promotion,eligibilityItems)))return null;
  return <div className="mt-5 rounded-xl border border-gold/40 bg-gold/5 p-4" data-cart-promotion>
    <p className="text-sm font-semibold text-foreground">{applied?`${de?'Gutschein':'Coupon'} ${applied.code}`:`${promotionDiscount(promotion!,locale)} ${de?'mit Gutscheincode':'with code'} ${promotion!.code}`}</p>
    {promotion?<p className="mt-1 text-xs leading-5 text-muted">{promotionScope(promotion,locale)}. {promotion.categories.includes('repairs')?(de?'Nur bepreiste Katalog-Reparaturen.':'Priced catalog repairs only.'):promotionExclusions(promotion,locale)}</p>:null}
    {promotion?.minimumOrder? <p className="mt-1 text-xs text-muted">{de?'Mindestbestellwert':'Minimum spend'}: {new Intl.NumberFormat(locale,{style:'currency',currency:'EUR'}).format(promotion.minimumOrder)}</p>:null}
    <button type="button" disabled={busy} onClick={()=>{if(applied){onApplied(null);setMessage('');}else void apply();}} className="btn-secondary mt-3 min-h-11 w-full justify-center text-sm disabled:opacity-50">{busy?(de?'Wird geprüft…':'Checking…'):applied?(de?'Gutschein entfernen':'Remove coupon'):(de?'Gutschein anwenden':'Apply coupon')}</button>
    {message?<p role="status" className="mt-2 text-xs leading-5 text-muted">{message}</p>:null}
  </div>;
}
