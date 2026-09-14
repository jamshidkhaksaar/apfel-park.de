import 'server-only';
import { createHash, randomUUID } from 'node:crypto';
import { query, withTransaction } from './db';
import { sanitizeCatalogForSave } from './repair-catalog';
import { calculateCampaignDiscount, type CouponCampaign } from './coupon';
import { normalizeRepairRules, repairDateAllowed } from './repair-campaign-rules';
import { resolveRepairOption, validateRepairRequestDate, type RepairBookingDetails, type RepairBookingInput } from './repair-booking';

type Queryable={query:typeof query};
const fingerprint=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export const resolveRepairQuote=async(input:RepairBookingInput,db:Queryable={query},lock=false):Promise<RepairBookingDetails>=>{
  const date=validateRepairRequestDate(input.requestedDate,input.preferredTime);
  const record=await db.query("SELECT value FROM store_settings WHERE key='repair_catalog' LIMIT 1");
  const catalog=sanitizeCatalogForSave(record.rows[0]?.value);
  const option=resolveRepairOption(catalog,input.selection);
  let coupon:RepairBookingDetails['coupon']=null,discountAmountCents=0;
  if(input.couponCode){
    if(option.baseAmountCents===null)throw new Error('repair_price_required');
    const result=await db.query(`SELECT * FROM store_campaigns WHERE lower(code)=lower($1) ${lock?'FOR UPDATE':''}`,[String(input.couponCode).trim().slice(0,64)]);
    const row=result.rows[0];
    if(!row||row.eligible_categories?.length!==1||row.eligible_categories[0]!=='repairs'||row.eligible_product_ids?.length)throw new Error('invalid_coupon');
    const rules=normalizeRepairRules(row.repair_rules);
    if(!repairDateAllowed(rules,date.requestedDate))throw new Error('repair_date_ineligible');
    const campaign:CouponCampaign={id:String(row.id),code:String(row.code),discountType:row.discount_type==='fixed'?'fixed':'percent',discountValue:row.discount_type==='fixed'?Math.round(Number(row.discount_value)*100):Number(row.discount_value),minimumOrderCents:Math.round(Number(row.minimum_order)*100),eligibleProductIds:[],eligibleCategories:['repairs'],startsAt:row.starts_at?new Date(row.starts_at).toISOString():null,endsAt:row.ends_at?new Date(row.ends_at).toISOString():null,maximumRedemptions:row.maximum_redemptions,redemptionCount:row.redemption_count,isActive:row.is_active};
    const discount=calculateCampaignDiscount(campaign,{subtotalAmountCents:option.baseAmountCents,items:[{productId:'repair',category:'repairs',lineAmountCents:option.baseAmountCents}]});
    if(!discount.ok)throw new Error('coupon_unavailable');
    discountAmountCents=discount.discountAmountCents;
    coupon={id:campaign.id,code:campaign.code,discountType:campaign.discountType,discountValue:campaign.discountValue,minimumOrderCents:campaign.minimumOrderCents,rules};
  }
  const value={...option,...date,coupon,discountAmountCents,totalAmountCents:option.baseAmountCents===null?null:option.baseAmountCents-discountAmountCents};
  return {...value,fingerprint:fingerprint(value)};
};

export type RepairCustomer={customerName:string;customerEmail:string;customerPhone:string;deviceModel:string;issueDescription:string;locale:'de'|'en'};
export const saveRepairBooking=async(customer:RepairCustomer,input:RepairBookingInput)=>{
  const key=typeof input.bookingKey==='string'?input.bookingKey.toLowerCase():input.bookingKey? 'invalid':randomUUID();
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(key))throw new Error('invalid_booking_key');
  const hash=fingerprint({customer,selection:input.selection||null,requestedDate:input.requestedDate||null,preferredTime:input.preferredTime||null,couponCode:input.couponCode?.trim().toUpperCase()||null});
  return withTransaction(async client=>{
    await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[`repair:${key}`]);
    const existing=(await client.query('SELECT id,ticket_number,booking_hash,booking_details FROM repairs WHERE booking_key=$1',[key])).rows[0];
    if(existing){if(existing.booking_hash!==hash)throw new Error('booking_conflict');return{...existing,duplicate:true};}
    const quote=await resolveRepairQuote(input,client as Queryable,true);
    if(input.couponCode&&quote.fingerprint!==input.quoteFingerprint)throw new Error('quote_changed');
    const result=await client.query(`INSERT INTO repairs(customer_name,customer_email,customer_phone,customer_locale,device_model,issue_description,status,status_updated_at,estimated_cost,booking_details,booking_key,booking_hash)
      VALUES($1,$2,$3,$4,$5,$6,'new',now(),$7,$8::jsonb,$9,$10) RETURNING id,ticket_number,booking_details`,[customer.customerName,customer.customerEmail,customer.customerPhone,customer.locale,quote.repairLabel?quote.deviceLabel:customer.deviceModel,customer.issueDescription,quote.totalAmountCents===null?null:quote.totalAmountCents/100,JSON.stringify(quote),key,hash]);
    const saved=result.rows[0];
    if(quote.coupon){
      await client.query('INSERT INTO repair_campaign_redemptions(campaign_id,repair_id,discount_amount) VALUES($1,$2,$3)',[quote.coupon.id,saved.id,quote.discountAmountCents/100]);
      await client.query('UPDATE store_campaigns SET redemption_count=redemption_count+1,updated_at=now() WHERE id=$1',[quote.coupon.id]);
    }
    return{...saved,duplicate:false};
  });
};
