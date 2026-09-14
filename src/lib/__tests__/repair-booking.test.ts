import { describe,expect,it } from 'vitest';
import { normalizeRepairRules,repairDateAllowed,hamburgDate } from '../repair-campaign-rules';
import { sanitizeCampaignInput } from '../coupon';
import { repairBookingSummary,resolveRepairOption,validateRepairRequestDate } from '../repair-booking';
import { promotionCampaignIssue,promotionSurface } from '../promotion';
describe('repair campaign rules',()=>{
 it('uses exact calendar dates, never a recurring weekday',()=>{
  const rules=normalizeRepairRules({dateBasis:'repair_date',dates:['2026-09-16','2026-09-16']});expect(rules.dates).toEqual(['2026-09-16']);
  expect(repairDateAllowed(rules,'2026-09-16',new Date('2026-09-14T10:00Z'))).toBe(true);expect(repairDateAllowed(rules,'2026-09-23',new Date('2026-09-14T10:00Z'))).toBe(false);
 });
 it('uses the Hamburg calendar at UTC boundaries',()=>{expect(hamburgDate(new Date('2026-09-15T22:30Z'))).toBe('2026-09-16');});
 it('rejects impossible dates and repair/product mixed campaigns',()=>{
  expect(()=>normalizeRepairRules({dates:['2026-02-30']})).toThrow();
  expect(()=>sanitizeCampaignInput({code:'REPAIR15',discountValue:15,eligibleCategories:['repairs','smartphones']})).toThrow('repair_scope_only');
  expect(()=>sanitizeCampaignInput({code:'REPAIR15',discountValue:15,eligibleCategories:['repairs'],isActive:true})).toThrow('invalid_repair_dates');
 });
 it('keeps a repair draft inactive until dates are selected',()=>{expect(sanitizeCampaignInput({code:'REPAIR15',discountValue:15,eligibleCategories:['repairs'],isActive:false}).repairRules).toEqual({dateBasis:'repair_date',dates:[]});});
 it('rejects past requested dates and bad time strings',()=>{
  expect(()=>validateRepairRequestDate('2026-09-13','12:00',new Date('2026-09-14T10:00Z'))).toThrow();expect(()=>validateRepairRequestDate('2026-09-14','25:00',new Date('2026-09-14T10:00Z'))).toThrow();
 });
 it('does not price an unspecified repair from a generic model starting price',()=>{
  const c={brands:[{id:'b',name:'Brand',icon:'b',families:[{id:'f',name:'Phone',models:[{id:'m',name:'Model',price:999}]}]}]};
  expect(resolveRepairOption(c,{brandId:'b',familyId:'f',modelId:'m',partId:'',variantId:''}).baseAmountCents).toBeNull();
 });
 it('routes repair offers to repair pages and hides expired repair dates',()=>{
  expect(promotionSurface('/de/repairs/display-akku','')).toEqual({category:'repairs'});
  expect(promotionCampaignIssue({id:'id',code:'REPAIR15',discount_type:'percent',discount_value:15,minimum_order:0,eligible_categories:['repairs'],eligible_product_ids:[],starts_at:null,ends_at:null,maximum_redemptions:null,redemption_count:0,is_active:true,repair_rules:{dateBasis:'repair_date',dates:['2026-09-16']}},[],Date.parse('2026-09-17T10:00Z'))).toBe('expired');
 });
 it('renders an unconfirmed booking without promising a paid or guaranteed appointment',()=>{expect(repairBookingSummary({fingerprint:'f',requestedDate:'2026-09-16'},'de')).toContain('noch nicht bestätigt');});
});
