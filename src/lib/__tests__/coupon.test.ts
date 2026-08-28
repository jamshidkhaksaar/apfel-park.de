import { describe, expect, it } from "vitest";

import { applyCouponToTotals, calculateCampaignDiscount, canReserveCampaignRedemption, getCampaignRemovalMode, resolveOptionalAvailability, sanitizeCampaignInput, type CouponCampaign } from "../coupon";

const base: CouponCampaign = { id:"c",code:"SAVE10",discountType:"percent",discountValue:10,minimumOrderCents:0,eligibleProductIds:[],eligibleCategories:[],startsAt:null,endsAt:null,maximumRedemptions:null,redemptionCount:0,isActive:true };
const cart={subtotalAmountCents:15000,items:[{productId:"p1",category:"smartphones",lineAmountCents:10000},{productId:"p2",category:"accessories",lineAmountCents:5000}]};
describe("calculateCampaignDiscount",()=>{
 it("calculates cents exactly and scopes eligibility",()=>{expect(calculateCampaignDiscount({...base,eligibleCategories:["smartphones"]},cart,new Date("2026-01-01"))).toMatchObject({ok:true,eligibleSubtotalCents:10000,discountAmountCents:1000});});
 it("caps fixed discounts to eligible subtotal",()=>{expect(calculateCampaignDiscount({...base,discountType:"fixed",discountValue:2000,eligibleProductIds:["p2"]},cart,new Date())).toMatchObject({ok:true,discountAmountCents:2000});expect(calculateCampaignDiscount({...base,discountType:"fixed",discountValue:9000,eligibleProductIds:["p2"]},cart,new Date())).toMatchObject({ok:true,discountAmountCents:5000});});
 it("fails closed for inactive, expired, minimum and redemption limits",()=>{expect(calculateCampaignDiscount({...base,isActive:false},cart,new Date()).ok).toBe(false);expect(calculateCampaignDiscount({...base,endsAt:"2025-01-01"},cart,new Date("2026-01-01")).ok).toBe(false);expect(calculateCampaignDiscount({...base,minimumOrderCents:20000},cart,new Date()).ok).toBe(false);expect(calculateCampaignDiscount({...base,maximumRedemptions:2,redemptionCount:2},cart,new Date()).ok).toBe(false);});
});
describe("sanitizeCampaignInput",()=>{
 it("normalizes admin campaign fields",()=>{const value=sanitizeCampaignInput({code:" save-10 ",title:{de:"Sparen",en:"Save"},description:{de:"Aktion",en:"Campaign"},discountType:"percent",discountValue:10,minimumOrder:25,eligibleProductIds:["11111111-1111-4111-8111-111111111111","bad"],eligibleCategories:["smartphones","<script>"],maximumRedemptions:100,isActive:true});expect(value.code).toBe("SAVE-10");expect(value.eligibleProductIds).toHaveLength(1);expect(value.eligibleCategories).toEqual(["smartphones"]);});
 it("rejects invalid codes and values",()=>{expect(()=>sanitizeCampaignInput({code:"***",discountValue:10})).toThrow();expect(()=>sanitizeCampaignInput({code:"SAVE",discountValue:0})).toThrow();});
});
describe("applyCouponToTotals",()=>{
 it("produces one canonical discounted total and VAT",()=>{expect(applyCouponToTotals({subtotalAmountCents:10000,shippingAmountCents:690,vatRate:.19},{campaignId:"c",code:"SAVE10",discountAmountCents:1000})).toEqual({campaignId:"c",couponCode:"SAVE10",originalSubtotalAmountCents:10000,discountAmountCents:1000,discountedSubtotalAmountCents:9000,shippingAmountCents:690,totalAmountCents:9690,vatAmountCents:1547});});
});
describe("campaign removal",()=>{
 it("deletes campaigns without history and archives campaigns with any accounting history",()=>{expect(getCampaignRemovalMode(false)).toBe("delete");expect(getCampaignRemovalMode(true)).toBe("archive");});
});
describe("campaign capacity reservation",()=>{
 it("allows unlimited or existing reservations and rejects a new reservation at capacity",()=>{expect(canReserveCampaignRedemption(null,999,false)).toBe(true);expect(canReserveCampaignRedemption(2,2,true)).toBe(true);expect(canReserveCampaignRedemption(2,2,false)).toBe(false);expect(canReserveCampaignRedemption(2,1,false)).toBe(true);});
});
describe("optional campaign availability",()=>{
 it("fails closed when the optional database read is unavailable",async()=>{expect(await resolveOptionalAvailability(async()=>{throw new Error("database unavailable")})).toBe(false);expect(await resolveOptionalAvailability(async()=>true)).toBe(true);});
});
