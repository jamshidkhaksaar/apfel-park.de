import { describe, expect, it } from 'vitest';
import { normalizeWeeklyDays, weeklyDayIsActive, currentWeeklyEnd, upcomingWeeklyDates } from '@/lib/campaign-weekly';
import { calculateCampaignDiscount, sanitizeCampaignInput, type CouponCampaign } from '@/lib/coupon';
import { normalizeRepairRules, repairDateAllowed } from '@/lib/repair-campaign-rules';
import { promotionCampaignIssue, type PromotionCampaign } from '@/lib/promotion';

const base: CouponCampaign={id:'1',code:'MONTAG10',discountType:'percent',discountValue:10,
  minimumOrderCents:0,eligibleProductIds:[],eligibleCategories:['smartphones'],startsAt:null,endsAt:null,
  maximumRedemptions:null,redemptionCount:0,isActive:true,weeklyDays:[1]};
const cart={subtotalAmountCents:10000,items:[{productId:'p',category:'smartphones',lineAmountCents:10000}]};

describe('weekly campaigns in Hamburg',()=>{
  it('runs the correct day across UTC midnight and limits the countdown to local midnight',()=>{
    expect(weeklyDayIsActive([1],new Date('2026-09-20T22:30:00Z'))).toBe(true);
    expect(weeklyDayIsActive([1],new Date('2026-09-21T22:00:00Z'))).toBe(false);
    expect(currentWeeklyEnd([1],new Date('2026-09-20T22:30:00Z'))).toBe('2026-09-21T21:59:59.000Z');
    expect(currentWeeklyEnd([1],new Date('2026-10-25T23:30:00Z'))).toBe('2026-10-26T22:59:59.000Z');
  });
  it('prices each weekly code only on its day',()=>{
    expect(calculateCampaignDiscount(base,cart,new Date('2026-09-20T22:30:00Z'))).toMatchObject({ok:true,discountAmountCents:1000});
    expect(calculateCampaignDiscount(base,cart,new Date('2026-09-21T22:30:00Z'))).toEqual({ok:false,error:'not_today'});
    expect(calculateCampaignDiscount({...base,weeklyDays:[]},cart,new Date('2026-09-21T22:30:00Z')).ok).toBe(true);
    expect(calculateCampaignDiscount({...base,endsAt:'2026-09-01T00:00:00Z'},cart,new Date('2026-09-20T22:30:00Z'))).toEqual({ok:false,error:'expired'});
  });
  it('shows exact upcoming calendar dates and rejects malformed schedules',()=>{
    expect(upcomingWeeklyDates([1,2,3],4,new Date('2026-09-23T10:00:00Z'))).toEqual(['2026-09-23','2026-09-28','2026-09-29','2026-09-30']);
    expect(normalizeWeeklyDays({weeklyDays:[3,1,3]})).toEqual([1,3]);
    for(const value of [[0],[8],['1'],[1.5],'1'])expect(()=>normalizeWeeklyDays({weeklyDays:value})).toThrow('invalid_weekly_days');
  });
  it('keeps repair appointment dates and booking dates distinct',()=>{
    const booking=normalizeRepairRules({dateBasis:'booking_date',weeklyDays:[3]});
    expect(repairDateAllowed(booking,'2026-09-28',new Date('2026-09-23T10:00:00Z'))).toBe(true);
    expect(repairDateAllowed(booking,'2026-09-23',new Date('2026-09-22T10:00:00Z'))).toBe(false);
    const appointment=normalizeRepairRules({dateBasis:'repair_date',weeklyDays:[3]});
    expect(repairDateAllowed(appointment,'2026-09-30',new Date('2026-09-23T10:00:00Z'))).toBe(true);
    expect(repairDateAllowed(appointment,'2026-09-29',new Date('2026-09-23T10:00:00Z'))).toBe(false);
    expect(()=>normalizeRepairRules({dates:['2026-09-23'],weeklyDays:[3]})).toThrow('invalid_repair_dates');
  });
  it('accepts weekly admin schedules and keeps one-time campaigns one-time',()=>{
    const monday=sanitizeCampaignInput({code:'MONTAG10',discountValue:10,eligibleCategories:['smartphones'],repairRules:{weeklyDays:[1]},isActive:true});
    expect(monday.repairRules).toEqual({weeklyDays:[1]});
    const repair=sanitizeCampaignInput({code:'MITTWOCH15',discountValue:15,eligibleCategories:['repairs'],repairRules:{dateBasis:'booking_date',weeklyDays:[3]},isActive:true});
    expect(repair.repairRules).toEqual({dateBasis:'booking_date',dates:[],weeklyDays:[3]});
    const privateOffer=sanitizeCampaignInput({code:'KARL50',discountType:'fixed',discountValue:50,isActive:true});
    expect(privateOffer.repairRules).toEqual({});
  });
  it('hides weekly banners off-day',()=>{
    const campaign: PromotionCampaign={id:'1',code:'MONTAG10',discount_type:'percent',discount_value:10,minimum_order:0,
      eligible_categories:['smartphones'],eligible_product_ids:[],starts_at:null,ends_at:null,
      maximum_redemptions:null,redemption_count:0,is_active:true,repair_rules:{weeklyDays:[1]}};
    expect(promotionCampaignIssue(campaign,[],Date.parse('2026-09-21T10:00:00Z'))).toBeNull();
    expect(promotionCampaignIssue(campaign,[],Date.parse('2026-09-22T10:00:00Z'))).toBe('scheduled');
  });
});
