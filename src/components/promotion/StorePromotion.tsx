'use client';
import { usePathname, useSearchParams } from 'next/navigation';
import { promotionSurface, type PublicPromotion } from '@/lib/promotion';
import { usePromotion } from './usePromotion';
import PromotionBanner from './PromotionBanner';
export default function StorePromotion({locale,initial=null}:{locale:'de'|'en';initial?:PublicPromotion|null}){
  const path=usePathname(),search=useSearchParams();
  const context=promotionSurface(path,search.toString());
  const query=context?new URLSearchParams(context).toString():null;
  const seed=context&&!context.slug&&(!context.category||initial?.categories.includes(context.category))?initial:null;
  const promotion=usePromotion(query,seed);
  if(!context||!promotion)return null;
  if(promotion.categories.includes('repairs')&&!/^\/(de|en)(?:\/repairs(?:\/.*)?)?$/.test(path))return null;
  return <div className="container-page py-3"><PromotionBanner key={promotion.id} promotion={promotion} locale={locale} compact={Boolean(context.slug)}/></div>;
}
