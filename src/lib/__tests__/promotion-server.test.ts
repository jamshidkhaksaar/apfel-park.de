import { beforeEach, expect, it, vi } from 'vitest';
const query=vi.hoisted(()=>vi.fn());
vi.mock('server-only',()=>({}));vi.mock('../db',()=>({query}));
import { getPublicPromotion } from '../promotion-server';
import type { PromotionCampaign } from '../promotion';
const id='11111111-1111-4111-8111-111111111111';
const campaign: PromotionCampaign={id,code:'MONTAG10',discount_type:'percent',discount_value:'10.00',minimum_order:'0',eligible_categories:['smartphones','tablets','laptops'],eligible_product_ids:[],starts_at:null,ends_at:null,maximum_redemptions:100,redemption_count:0,is_active:true};
beforeEach(()=>query.mockReset());
const seed=(value=campaign)=>{query.mockResolvedValueOnce({rows:[{value:{enabled:true,campaignId:id,headline:{de:'',en:''}}}]}).mockResolvedValueOnce({rows:[value]});};
it('does not expose unselected or disabled coupon codes',async()=>{
  query.mockResolvedValueOnce({rows:[]});expect(await getPublicPromotion()).toBeNull();expect(query).toHaveBeenCalledTimes(1);
});
it('returns only the selected public campaign data, not admin records',async()=>{
  seed();const result=await getPublicPromotion();expect(result?.code).toBe('MONTAG10');expect(result).not.toHaveProperty('eligible_product_ids');expect(result).not.toHaveProperty('redemption_count');
});
it('hides the banner on an ineligible product detail page',async()=>{
  seed();query.mockResolvedValueOnce({rows:[{id:'accessory',category:'accessories'}]});expect(await getPublicPromotion({slug:'phone-case'})).toBeNull();
});
it('returns the selected campaign on an eligible product detail page',async()=>{
  seed();query.mockResolvedValueOnce({rows:[{id:'phone',category:'smartphones'}]});expect((await getPublicPromotion({slug:'phone'}))?.code).toBe('MONTAG10');
});
it('hides exhausted selected campaigns when no weekly offer is active',async()=>{
  seed({...campaign,redemption_count:100});query.mockResolvedValueOnce({rows:[]});
  expect(await getPublicPromotion({slug:'phone'})).toBeNull();expect(query).toHaveBeenCalledTimes(3);
});
it('rotates from a scheduled Wednesday repair offer to Monday smartphones',async()=>{
  vi.useFakeTimers();vi.setSystemTime(new Date('2026-09-21T10:00:00Z'));
  try{
    seed({...campaign,code:'MITTWOCH15',eligible_categories:['repairs'],repair_rules:{dateBasis:'booking_date',weeklyDays:[3]}});
    query.mockResolvedValueOnce({rows:[{id:'monday'}]})
      .mockResolvedValueOnce({rows:[{...campaign,id:'monday',repair_rules:{weeklyDays:[1]}}]});
    const result=await getPublicPromotion();
    expect(result).toMatchObject({code:'MONTAG10',upcomingDates:['2026-09-21','2026-09-28','2026-10-05']});
    expect(result?.endsAt).toBe('2026-09-21T21:59:59.000Z');
  }finally{vi.useRealTimers();}
});
it('preserves mixed scope through the public API projection',async()=>{
  const selectedId='22222222-2222-4222-8222-222222222222';
  query.mockResolvedValueOnce({rows:[{value:{enabled:true,campaignId:id}}]}).mockResolvedValueOnce({rows:[{...campaign,eligible_categories:['smartphones'],eligible_product_ids:[selectedId]}]}).mockResolvedValueOnce({rows:[{id:selectedId,category:'accessories',is_active:true}]});
  const result=await getPublicPromotion({category:'accessories'});
  expect(result).toMatchObject({categories:['smartphones','accessories'],categoryWide:['smartphones'],selectedProductIds:[selectedId],selectedOnly:false});
});
it('does not publish inactive selected products or their IDs',async()=>{
  const selectedId='22222222-2222-4222-8222-222222222222';
  query.mockResolvedValueOnce({rows:[{value:{enabled:true,campaignId:id}}]}).mockResolvedValueOnce({rows:[{...campaign,eligible_categories:[],eligible_product_ids:[selectedId]}]}).mockResolvedValueOnce({rows:[{id:selectedId,category:'accessories',is_active:false}]});
  expect(await getPublicPromotion()).toBeNull();
});
