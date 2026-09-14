import { beforeEach, expect, it, vi } from 'vitest';
const query=vi.hoisted(()=>vi.fn());
vi.mock('server-only',()=>({}));vi.mock('../db',()=>({query}));
import { getPublicPromotion } from '../promotion-server';
const id='11111111-1111-4111-8111-111111111111';
const campaign={id,code:'MONTAG10',discount_type:'percent',discount_value:'10.00',minimum_order:'0',eligible_categories:['smartphones','tablets','laptops'],eligible_product_ids:[],starts_at:null,ends_at:null,maximum_redemptions:100,redemption_count:0,is_active:true};
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
it('hides inactive and limit-exhausted campaigns without a product query',async()=>{
  seed({...campaign,redemption_count:100});expect(await getPublicPromotion({slug:'phone'})).toBeNull();expect(query).toHaveBeenCalledTimes(2);
});
