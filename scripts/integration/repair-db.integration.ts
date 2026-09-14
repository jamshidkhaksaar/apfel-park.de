import { afterAll, beforeAll, beforeEach, expect, it, vi } from 'vitest';
import { Pool } from 'pg';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
vi.mock('server-only',()=>({}));
import { resolveRepairQuote, saveRepairBooking } from '../../src/lib/repair-booking-server';
import { updateRepairBookingRecord } from '../../src/lib/repair-booking-admin';
import { hamburgDate } from '../../src/lib/repair-campaign-rules';
if(process.env.APFEL_AUDIT_DISPOSABLE!=='apfel_audit_wave2'||new URL(process.env.DATABASE_URL!).pathname!=='/apfel_audit_wave2')throw new Error('Disposable DB required');
const pool=new Pool({connectionString:process.env.DATABASE_URL});
const today=hamburgDate(),tomorrow=new Date(Date.parse(today+'T12:00Z')+86400000).toISOString().slice(0,10);
const selection={brandId:'test',familyId:'phone',modelId:'fixture',partId:'display',variantId:'premium'};
const customer={customerName:'Fixture',customerEmail:'fixture@example.invalid',customerPhone:'0000000000',deviceModel:'Test Phone Fixture',issueDescription:'Fixture only',locale:'de' as const};
const catalog={brands:[{id:'test',name:'Test',families:[{id:'phone',name:'Phone',models:[{id:'fixture',name:'Fixture',price:999,parts:[{id:'display',name:'Display',variants:[{id:'premium',label:'Premium',quality:'premium',price:100},{id:'quote-only',label:'On request',quality:'genuine',price:null}]}]}]}]}]};
let campaignId:string;
beforeAll(async()=>{
  await pool.query(`CREATE TABLE store_settings(key text PRIMARY KEY,value jsonb);CREATE TABLE store_campaigns(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),code text UNIQUE,discount_type text,discount_value numeric,minimum_order numeric DEFAULT 0,eligible_categories text[] DEFAULT '{}',eligible_product_ids uuid[] DEFAULT '{}',starts_at timestamptz,ends_at timestamptz,maximum_redemptions integer,redemption_count integer DEFAULT 0,is_active boolean,updated_at timestamptz);CREATE TABLE repairs(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),ticket_number integer GENERATED ALWAYS AS IDENTITY,customer_name text,customer_email text,customer_phone text,customer_locale text,device_model text,issue_description text,status text,status_updated_at timestamptz,estimated_cost numeric,final_cost numeric,repair_summary text,notes text);`);
  await pool.query(await readFile(new URL('../../supabase/migrations/20260914_repair_coupon_bookings.sql',import.meta.url),'utf8'));
});
beforeEach(async()=>{
  await pool.query('DELETE FROM repair_campaign_redemptions;DELETE FROM repairs;DELETE FROM store_campaigns;DELETE FROM store_settings');
  await pool.query("INSERT INTO store_settings VALUES('repair_catalog',$1)",[JSON.stringify(catalog)]);
  campaignId=(await pool.query("INSERT INTO store_campaigns(code,discount_type,discount_value,eligible_categories,is_active,maximum_redemptions,repair_rules) VALUES('MITTWOCH15','percent',15,ARRAY['repairs'],true,1,$1) RETURNING id",[JSON.stringify({dateBasis:'repair_date',dates:[today]})])).rows[0].id;
});
afterAll(async()=>pool.end());
const input=async()=>{const base={selection,requestedDate:today,couponCode:'MITTWOCH15',bookingKey:randomUUID()};return{...base,quoteFingerprint:(await resolveRepairQuote(base)).fingerprint};};
it('prices the exact catalog option, not the generic model price or client amount',async()=>{
  const q=await resolveRepairQuote({...await input(),price:1} as Parameters<typeof resolveRepairQuote>[0]);expect(q.baseAmountCents).toBe(10000);expect(q.totalAmountCents).toBe(8500);
  await expect(resolveRepairQuote({selection:{...selection,variantId:'quote-only'},requestedDate:today,couponCode:'MITTWOCH15'})).rejects.toThrow('repair_price_required');
});
it('replays a booking exactly once without consuming another coupon',async()=>{
  const i=await input();const rows=await Promise.all(Array.from({length:6},(_,n)=>saveRepairBooking(customer,n%2?{...i,bookingKey:i.bookingKey.toUpperCase()}:i)));
  expect(new Set(rows.map(r=>r.id)).size).toBe(1);expect(rows.filter(r=>!r.duplicate)).toHaveLength(1);
  expect((await pool.query('SELECT redemption_count FROM store_campaigns')).rows[0].redemption_count).toBe(1);
  await expect(saveRepairBooking({...customer,customerName:'Other'},i)).rejects.toThrow('booking_conflict');
});
it('serializes concurrent bookings at the redemption limit',async()=>{
  const inputs=await Promise.all([input(),input(),input()]);const results=await Promise.allSettled(inputs.map(i=>saveRepairBooking(customer,i)));
  expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);expect((await pool.query('SELECT count(*)::int AS count FROM repairs')).rows[0].count).toBe(1);
});
it('rejects stale price previews without inserting a job or redemption',async()=>{
  const i=await input();const changed=JSON.parse(JSON.stringify(catalog));changed.brands[0].families[0].models[0].parts[0].variants[0].price=200;
  await pool.query("UPDATE store_settings SET value=$1 WHERE key='repair_catalog'",[JSON.stringify(changed)]);
  await expect(saveRepairBooking(customer,i)).rejects.toThrow('quote_changed');expect((await pool.query('SELECT count(*)::int AS count FROM repairs')).rows[0].count).toBe(0);
});
it('rolls the entire job back if the redemption insert fails',async()=>{
  const i=await input();await pool.query('ALTER TABLE repair_campaign_redemptions ADD CONSTRAINT force_failure CHECK(false)');
  try{await expect(saveRepairBooking(customer,i)).rejects.toThrow();expect((await pool.query('SELECT count(*)::int AS count FROM repairs')).rows[0].count).toBe(0);expect((await pool.query('SELECT redemption_count FROM store_campaigns')).rows[0].redemption_count).toBe(0);}finally{await pool.query('ALTER TABLE repair_campaign_redemptions DROP CONSTRAINT force_failure');}
});
it('applies the saved coupon once to final gross cost and rejects an ineligible confirmed date',async()=>{
  const r=await saveRepairBooking(customer,await input());const update={id:r.id,status:'ready',estimatedCost:1,finalCost:120,repairSummary:'Test',notes:'',appointment:today+'T12:00'};
  expect((await updateRepairBookingRecord(update)).finalCost).toBe(102);expect((await updateRepairBookingRecord(update)).finalCost).toBe(102);
  const cleared=await updateRepairBookingRecord({...update,finalCost:null});expect(cleared.finalCost).toBeNull();expect(cleared.details.finalBaseAmountCents).toBeNull();
  await expect(updateRepairBookingRecord({...update,appointment:tomorrow+'T12:00'})).rejects.toThrow('coupon_date');
});
it('releases cancellation exactly once and does not silently reopen a cancelled coupon',async()=>{
  const r=await saveRepairBooking(customer,await input());const update={id:r.id,status:'cancelled',estimatedCost:null,finalCost:null,repairSummary:'',notes:'',appointment:''};
  await Promise.all([updateRepairBookingRecord(update),updateRepairBookingRecord(update)]);
  expect((await pool.query('SELECT redemption_count FROM store_campaigns')).rows[0].redemption_count).toBe(0);
  expect((await pool.query('SELECT count(*)::int AS count FROM repair_campaign_redemptions WHERE released_at IS NOT NULL')).rows[0].count).toBe(1);
  await expect(updateRepairBookingRecord({...update,status:'new'})).rejects.toThrow('cancelled_coupon');
  await saveRepairBooking(customer,await input());
});
it('checks booking-date campaigns against server Hamburg time, not the requested repair date',async()=>{
  await pool.query('UPDATE store_campaigns SET repair_rules=$1 WHERE id=$2',[JSON.stringify({dateBasis:'booking_date',dates:[today]}),campaignId]);
  const q=await resolveRepairQuote({selection,requestedDate:tomorrow,couponCode:'MITTWOCH15'});expect(q.totalAmountCents).toBe(8500);
});
