import 'server-only';
import { withTransaction } from './db';
import { campaignDateToIso } from './campaign-dates';
import { hamburgDate } from './repair-campaign-rules';
import type { RepairBookingDetails } from './repair-booking';
export const updateRepairBookingRecord=async(input:{id:string;status:string;estimatedCost:number|null;finalCost:number|null;repairSummary:string;notes:string;appointment:string})=>withTransaction(async client=>{
  const initial=(await client.query('SELECT booking_details FROM repairs WHERE id=$1',[input.id])).rows[0];
  if(!initial)throw new Error('missing');
  const couponId=initial.booking_details?.coupon?.id;
  if(couponId)await client.query('SELECT id FROM store_campaigns WHERE id=$1 FOR UPDATE',[couponId]);
  const existing=(await client.query('SELECT * FROM repairs WHERE id=$1 FOR UPDATE',[input.id])).rows[0];
  if(!existing)throw new Error('missing');
  const details=(existing.booking_details||{}) as Partial<RepairBookingDetails>;
  const coupon=details.coupon;
  if(coupon&&existing.status==='cancelled'&&input.status!=='cancelled')throw new Error('cancelled_coupon');
  const appointmentAt=input.appointment?campaignDateToIso(input.appointment):null;
  if(coupon&&appointmentAt&&coupon.rules.dateBasis==='repair_date'&&!coupon.rules.dates.includes(hamburgDate(new Date(appointmentAt))))throw new Error('coupon_date');
  for(const amount of[input.estimatedCost,input.finalCost])if(amount!==null&&(!Number.isFinite(amount)||amount<0||amount>9999999))throw new Error('invalid');
  let finalCost=input.finalCost;
  if(coupon&&finalCost===null&&input.status!=='cancelled')details.finalBaseAmountCents=null;
  if(coupon&&input.status==='cancelled'){finalCost=existing.final_cost;details.couponReleased=true;}
  if(coupon&&finalCost!==null&&input.status!=='cancelled'){
    const base=Math.round(finalCost*100);
    if(base<coupon.minimumOrderCents)throw new Error('coupon_minimum');
    const discount=Math.min(base,coupon.discountType==='percent'?Math.round(base*coupon.discountValue/100):coupon.discountValue);
    finalCost=(base-discount)/100;details.finalBaseAmountCents=base;
  }
  if(details.fingerprint)details.appointmentAt=appointmentAt;
  const estimate=coupon?(existing.estimated_cost===null?null:Number(existing.estimated_cost)):input.estimatedCost;
  await client.query('UPDATE repairs SET status=$2,estimated_cost=$3,final_cost=$4,repair_summary=$5,notes=$6,booking_details=$7::jsonb,status_updated_at=now() WHERE id=$1',[input.id,input.status,estimate,finalCost,input.repairSummary||null,input.notes||null,JSON.stringify(details)]);
  if(coupon&&input.status==='cancelled'){
    const released=await client.query('UPDATE repair_campaign_redemptions SET released_at=now() WHERE repair_id=$1 AND released_at IS NULL RETURNING campaign_id',[input.id]);
    for(const row of released.rows)await client.query('UPDATE store_campaigns SET redemption_count=GREATEST(0,redemption_count-1),updated_at=now() WHERE id=$1',[row.campaign_id]);
  }
  return{existing,details,estimatedCost:estimate,finalCost,changed:existing.status!==input.status||(existing.booking_details?.appointmentAt||null)!==appointmentAt||(existing.final_cost===null?null:Number(existing.final_cost))!==finalCost||(existing.estimated_cost===null?null:Number(existing.estimated_cost))!==estimate};
});
