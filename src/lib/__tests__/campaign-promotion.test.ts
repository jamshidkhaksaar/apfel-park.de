import { describe, expect, it } from 'vitest';
import { campaignDateForInput, campaignDateToIso, campaignErrorMessage, campaignWindow } from '../campaign-dates';
import { sanitizeCampaignInput } from '../coupon';
import { canAccessAdminPath, canManageCampaigns } from '../admin-auth';
import { emptyPromotion, promotionCampaignIssue, promotionDiscount, promotionExclusions, promotionScope, promotionSurface, sanitizePromotionSettings, type PromotionCampaign, type PublicPromotion } from '../promotion';

const campaign:PromotionCampaign={id:'11111111-1111-4111-8111-111111111111',code:'MONDAY10',discount_type:'percent',discount_value:10,minimum_order:0,eligible_categories:['smartphones','tablets','laptops'],eligible_product_ids:[],starts_at:'2026-09-12T18:39:00Z',ends_at:'2026-09-14T18:39:00Z',maximum_redemptions:100,redemption_count:0,is_active:true};
const now=Date.parse('2026-09-13T10:00:00Z');
describe('Hamburg campaign dates',()=>{
  it('uses Hamburg summer and winter time independent of server timezone',()=>{
    expect(campaignDateToIso('2026-09-14T20:39')).toBe('2026-09-14T18:39:00.000Z');
    expect(campaignDateToIso('2026-12-14T20:39')).toBe('2026-12-14T19:39:00.000Z');
  });
  it('round trips stored UTC dates through the editor without shifting',()=>{
    for(const stored of ['2026-09-14T18:39:00.000Z','2026-12-14T19:39:00.000Z'])expect(campaignDateToIso(campaignDateForInput(stored))).toBe(stored);
    expect(campaignDateToIso('2026-09-14T20:39:00+02:00')).toBe('2026-09-14T18:39:00.000Z');
  });
  it('rejects impossible, malformed and ambiguous dates instead of guessing',()=>{
    for(const value of ['invalid','2026-02-30T10:00','2026-03-29T02:30','2026-09-14T25:00'])expect(()=>campaignDateToIso(value)).toThrow('invalid_date');
    expect(()=>campaignDateToIso('2026-10-25T02:30')).toThrow('ambiguous_date');
  });
  it('accepts open ended dates and requires end strictly after start',()=>{
    expect(campaignWindow('','')).toEqual({startsAt:null,endsAt:null});
    for(const end of ['2026-09-14T10:00','2026-09-13T10:00'])expect(()=>campaignWindow('2026-09-14T10:00',end)).toThrow('invalid_window');
    expect(sanitizeCampaignInput({code:'MONDAY10',discountValue:10,startsAt:'2026-09-14T10:00',endsAt:'2026-09-14T11:00'}).endsAt).toBe('2026-09-14T09:00:00.000Z');
    expect(campaignErrorMessage('invalid_window','de')).toContain('nach dem Start');
  });
});
describe('campaign-backed promotion safety',()=>{
  it('defaults unpublished and requires a saved campaign when enabled',()=>{
    expect(emptyPromotion().enabled).toBe(false);
    expect(()=>sanitizePromotionSettings({enabled:true,campaignId:'bad'})).toThrow('select_campaign');
    expect(sanitizePromotionSettings({enabled:true,campaignId:campaign.id,headline:{de:' X '},code:'INJECTED'})).toEqual({enabled:true,campaignId:campaign.id,headline:{de:'X',en:''}});
  });
  it('fails closed for inactive, expired, exhausted or invalid campaigns',()=>{
    expect(promotionCampaignIssue(campaign,[],now)).toBeNull();
    expect(promotionCampaignIssue({...campaign,is_active:false},[],now)).toBe('inactive');
    expect(promotionCampaignIssue(campaign,[],Date.parse(String(campaign.ends_at)))).toBe('expired');
    expect(promotionCampaignIssue({...campaign,redemption_count:100},[],now)).toBe('limit_reached');
    expect(promotionCampaignIssue({...campaign,discount_value:101},[],now)).toBe('invalid_campaign');
    expect(promotionCampaignIssue({...campaign,starts_at:'2026-09-14T10:00Z'},[],now)).toBe('scheduled');
  });
  it('allows device, accessory and product-scoped campaigns but rejects unrestricted scope',()=>{
    expect(promotionCampaignIssue({...campaign,eligible_categories:[]},[],now)).toBe('device_scope_required');
    expect(promotionCampaignIssue({...campaign,eligible_categories:['accessories']},[],now)).toBeNull();
    expect(promotionCampaignIssue({...campaign,eligible_categories:['smartphones','accessories']},[],now)).toBeNull();
    expect(promotionCampaignIssue({...campaign,eligible_categories:[],eligible_product_ids:[campaign.id]},['accessories'],now)).toBeNull();
  });
  it('targets shopping surfaces including accessories without exposing admin, checkout or cart routes',()=>{
    for(const path of ['/de','/en/store','/de/tablets','/de/laptops','/de/accessories','/en/gebrauchte-iphones'])expect(promotionSurface(path,'')).not.toBeNull();
    for(const path of ['/admin','/de/checkout','/de/cart','/en/about'])expect(promotionSurface(path,'')).toBeNull();
    expect(promotionSurface('/de/store','category=accessories')).toEqual({category:'accessories'});
    expect(promotionSurface('/de/accessories','')).toEqual({category:'accessories'});
    expect(promotionSurface('/de/store/example-phone','')).toEqual({slug:'example-phone'});
  });
  it('keeps promotional settings restricted to campaign managers',()=>{
    const manager={id:'x',email:'manager@example.invalid',app_metadata:{role:'manager'}},editor={id:'x',email:'editor@example.invalid',app_metadata:{role:'product_editor'}};
    expect(canAccessAdminPath(manager,'/admin/promotion-banner')).toBe(true);
    expect(canManageCampaigns(editor)).toBe(false);
    expect(canAccessAdminPath(editor,'/admin/promotion-banner')).toBe(false);
  });
  it('uses the actual discount and qualifies selected-device offers',()=>{
    const publicPromo={discountType:'percent',discountValue:10,categories:['smartphones'],includesSelected:true,selectedOnly:true} as PublicPromotion;
    expect(promotionDiscount(publicPromo,'de')).toBe('10 %');
    expect(promotionScope(publicPromo,'de')).toContain('ausgewählte');
  });
  it('labels accessory scope and excludes the right item groups',()=>{
    const accessoryPromo={discountType:'percent',discountValue:20,categories:['accessories'],includesSelected:false,selectedOnly:false} as PublicPromotion;
    expect(promotionScope(accessoryPromo,'de')).toContain('Zubehör');
    expect(promotionScope(accessoryPromo,'en')).toContain('accessories');
    expect(promotionExclusions(accessoryPromo,'de')).toContain('Geräte');
    expect(promotionExclusions({...accessoryPromo,categories:['smartphones']},'en')).toContain('Accessories and repairs');
    expect(promotionExclusions({...accessoryPromo,categories:['smartphones','accessories']},'de')).toContain('Reparaturen');
  });
});
