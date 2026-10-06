import { query } from '@/lib/db';
import { assertOperationsBranch, requireOperationsOwner } from './access';
import { readOperationsReport, readOrderPage, validateReportDates } from './report';
import { stockAvailabilitySql } from './stock-summary';
import { assetLabel, isSensitiveSearchInput, uuidPattern, type Asset, type Branch, type OperationsAccess, type StockItem, type ListOptions } from './types';

export { readOperationsReport, readOperationsDashboard } from './report';
export const reportDates=validateReportDates;
export const operationsBranches=async(access:OperationsAccess):Promise<Branch[]> => (await query(`SELECT id,code,name,address,active FROM ops_branches
  WHERE code<>'transit' AND ($1::uuid IS NULL OR id=$1) ORDER BY code`,[access.owner ? null:access.branchId])).rows as Branch[];
export const branchFilter=(access:OperationsAccess,input?:string|null):string|null => {
  const id=input && uuidPattern.test(input) ? input:null;if(input && !id) throw new Error('invalid_branch');
  if(id) assertOperationsBranch(access,id);return access.owner ? id:access.branchId;
};
const safeSearch=(input:string) => {if(isSensitiveSearchInput(input)) throw new Error('private_identifier_search_blocked');return input.trim().slice(0,80);};
const boundedPage=(page=1) => Math.max(1,Math.min(10000,page));
const missingCostSql=`((SELECT count(*) FROM ops_assets a WHERE a.inventory_id=i.id AND a.branch_id=b.id AND a.state IN ('available','reserved') AND a.cost_gross_cents IS NULL)
  +(SELECT coalesce(sum(cb.remaining),0) FROM ops_cost_batches cb WHERE cb.inventory_id=i.id AND cb.branch_id=b.id AND cb.cost_gross_cents IS NULL))`;
export const readOperationsStock=async(access:OperationsAccess,branchId:string|null,search:string,page:number,options:ListOptions={}) => {
  const q=safeSearch(search);const filterName=options.filter ?? '';const pageNumber=boundedPage(page);
  if(!['','low','empty','reserved','inactive','missing_costs'].includes(filterName)) throw new Error('invalid_filter');
  if(!access.owner && ['inactive','missing_costs'].includes(filterName)) throw new Error('owner_required');
  const available=`CASE WHEN i.is_active AND p.is_active AND b.active THEN ${stockAvailabilitySql} ELSE 0 END`;
  const filters:Record<string,string>={low:`p.is_active AND b.active AND ${available}>0 AND ${available}<=s.minimum`,
    empty:`p.is_active AND b.active AND ${available}=0`,reserved:'s.reserved>0',inactive:'NOT p.is_active OR NOT b.active',missing_costs:`${missingCostSql}>0`};
  const where=`WHERE i.location='local' AND b.code<>'transit' AND i.is_active AND ($1::uuid IS NULL OR b.id=$1)
    AND ($4::boolean OR (p.is_active AND b.active)) ${filterName ? 'AND ('+filters[filterName]+')':''}
    AND ($2='' OR p.title ILIKE '%'||$2||'%' OR i.sku ILIKE '%'||$2||'%' OR p.gtin=$2 OR v.value->>'gtin'=$2
      OR EXISTS(SELECT 1 FROM ops_item_labels l WHERE l.inventory_id=i.id AND 'APS-'||lpad(l.label_number::text,8,'0')=upper($2))
      OR EXISTS(SELECT 1 FROM ops_assets a WHERE a.inventory_id=i.id AND a.branch_id=b.id AND 'APF-'||lpad(a.label_number::text,8,'0')=upper($2)))`;
  const from=`FROM ops_balances s JOIN inventory_skus i ON i.id=s.inventory_id JOIN products p ON p.id=i.product_id JOIN ops_branches b ON b.id=s.branch_id
    LEFT JOIN LATERAL(SELECT value FROM jsonb_array_elements(CASE WHEN jsonb_typeof(p.variants)='array' THEN p.variants ELSE '[]' END) WHERE value->>'sku'=i.sku LIMIT 1) v ON true`;
  const [items,count]=await Promise.all([
    query(`SELECT i.id AS inventory_id,i.product_id,i.sku,i.version,p.title,p.category,p.condition,to_jsonb(p.images)->>0 AS image,
      round(coalesce(nullif(v.value->>'price','')::numeric,p.price)*100)::bigint AS price_cents,
      v.value->>'color' AS color,v.value->>'storage' AS storage,s.branch_id,b.name AS branch_name,s.on_hand,s.reserved,s.minimum,s.target,
      p.is_active AND b.active AS active,${available} AS available ${access.owner ? ','+missingCostSql+' AS missing_costs':''}
      ${from} ${where} ORDER BY CASE WHEN ${available}=0 THEN 1 ELSE 0 END,p.title,i.sku,b.code LIMIT 40 OFFSET $3`,[branchId,q,(pageNumber-1)*40,access.owner]),
    query(`SELECT count(*)::int AS total ${from} ${where.replace('$4::boolean','$3::boolean')}`,[branchId,q,access.owner]),
  ]);
  return {total:Number(count.rows[0].total),page:pageNumber,asOf:new Date().toISOString(),items:items.rows.map(r=>({
    inventoryId:String(r.inventory_id),productId:String(r.product_id),sku:String(r.sku),inventoryVersion:String(r.version),active:Boolean(r.active),
    title:[String(r.title),r.color,r.storage].filter(Boolean).join(' · '),category:String(r.category),condition:String(r.condition),
    image:typeof r.image==='string' ? r.image:null,priceCents:Number(r.price_cents),branchId:String(r.branch_id),branchName:String(r.branch_name),
    onHand:Number(r.on_hand),reserved:Number(r.reserved),available:Number(r.available),minimum:Number(r.minimum),target:Number(r.target),
    ...(access.owner ? {missingCosts:Number(r.missing_costs)}:{}),
  })) as StockItem[]};
};

export const readOperationsAssetPage=async(access:OperationsAccess,branchId:string|null,search:string,page:number,options:ListOptions={}) => {
  const q=safeSearch(search);const status=options.status ?? '';const filter=options.filter ?? '';
  if(status && !['available','reserved','sold','inspection','faulty','transit','written_off'].includes(status)) throw new Error('invalid_status');
  if(filter && !['missing_details','missing_costs'].includes(filter)) throw new Error('invalid_filter');
  if(!access.owner && filter==='missing_costs') throw new Error('owner_required');
  const where=`WHERE ($1::uuid IS NULL OR a.branch_id=$1) AND ($3::boolean OR (a.state='available' AND p.is_active AND i.is_active))
    AND ($5='' OR a.state=$5) AND ($6='' OR ($6='missing_details' AND (a.color='' OR a.storage='')) OR ($6='missing_costs' AND a.cost_gross_cents IS NULL))
    AND ($2='' OR p.title ILIKE '%'||$2||'%' OR i.sku ILIKE '%'||$2||'%' OR 'APF-'||lpad(a.label_number::text,8,'0')=upper($2))`;
  const from='FROM ops_assets a JOIN inventory_skus i ON i.id=a.inventory_id JOIN products p ON p.id=i.product_id';
  const [result,count]=await Promise.all([
    query(`SELECT a.id,a.label_number,a.inventory_id,a.branch_id,a.state,a.color,a.storage,a.battery_health,a.updated_at,p.title,i.sku
      ${access.owner ? ',a.cost_gross_cents,a.cost_net_cents,(a.serial_encrypted IS NOT NULL OR a.imei_encrypted IS NOT NULL) AS identifier_recorded':''}
      ${from} ${where} ORDER BY a.label_number DESC,a.id DESC LIMIT 40 OFFSET $4`,[branchId,q,access.owner,(boundedPage(page)-1)*40,status,filter]),
    query(`SELECT count(*)::int AS total ${from} ${where}`.replaceAll('$5','$4').replaceAll('$6','$5'),[branchId,q,access.owner,status,filter]),
  ]);
  const assets=result.rows.map(r=>({id:String(r.id),label:assetLabel(r.label_number),inventoryId:String(r.inventory_id),branchId:String(r.branch_id),
    title:String(r.title),sku:String(r.sku),state:String(r.state),color:String(r.color),storage:String(r.storage),batteryHealth:r.battery_health===null ? null:Number(r.battery_health),
    updatedAt:new Date(r.updated_at).toISOString(),...(access.owner ? {costGrossCents:r.cost_gross_cents===null ? null:Number(r.cost_gross_cents),
    costNetCents:r.cost_net_cents===null ? null:Number(r.cost_net_cents),identifierRecorded:Boolean(r.identifier_recorded)}:{})})) as Asset[];
  return {assets,total:Number(count.rows[0].total),page:boundedPage(page),asOf:new Date().toISOString()};
};
export const readOperationsAssets=async(access:OperationsAccess,branchId:string|null,search:string,page:number) => (await readOperationsAssetPage(access,branchId,search,page)).assets;

export const readOperationsDocumentPage=async(access:OperationsAccess,branchId:string|null,options:ListOptions={}) => {
  const page=boundedPage(options.page);const from=options.from ?? '';const to=options.to ?? '';if(from || to) reportDates(from || to,to || from);
  const kind=options.kind ?? '';const status=options.status ?? '';
  if(kind && !['purchase','transfer','training_sale','expense','asset_update','threshold','branch_setup','membership','refund_request'].includes(kind)) throw new Error('invalid_kind');
  if(status && !['recorded','training','dispatched','received','needs_owner_review'].includes(status)) throw new Error('invalid_status');
  const params=[branchId,access.owner,access.userId,kind,status,from,to];
  const where=`WHERE ($1::uuid IS NULL OR branch_id=$1 OR destination_id=$1) AND ($2::boolean OR (kind='training_sale' AND actor_id=$3))
    AND ($4='' OR kind=$4) AND ($5='' OR status=$5)
    AND ($6='' OR (created_at AT TIME ZONE 'Europe/Berlin')::date >= nullif($6,'')::date)
    AND ($7='' OR (created_at AT TIME ZONE 'Europe/Berlin')::date <= nullif($7,'')::date)`;
  const [rows,total]=await Promise.all([query(`SELECT id,number,kind,status,branch_id,destination_id,payload,created_at FROM ops_documents ${where}
    ORDER BY created_at DESC,id DESC LIMIT 40 OFFSET $8`,[...params,(page-1)*40]),query(`SELECT count(*)::int AS total FROM ops_documents ${where}`,params)]);
  return {documents:rows.rows,total:Number(total.rows[0].total),page,asOf:new Date().toISOString()};
};
export const readOperationsDocuments=async(access:OperationsAccess,branchId:string|null) => (await readOperationsDocumentPage(access,branchId)).documents;
export const readOperationsOrders=(access:OperationsAccess,branchId:string|null=null,options:ListOptions={}) => readOrderPage(access,branchId,options);
export const readOperationsOverview=async(access:OperationsAccess,branchId:string|null,from:string,to:string) => (await readOperationsReport(access,branchId,from,to)).summary;

export const readOperationsSettings=async(access:OperationsAccess) => {
  const value=(await query("SELECT value FROM store_settings WHERE key='operations_settings'")).rows[0]?.value ?? {};
  const [members,users]=access.owner ? await Promise.all([
    query('SELECT m.user_id,m.role,m.branch_id,m.active,u.email FROM ops_members m JOIN users u ON u.id=m.user_id ORDER BY u.email'),
    query('SELECT id,email,role FROM users WHERE is_active=true ORDER BY email'),
  ]):[{rows:[]},{rows:[]}];
  return {liveTillEnabled:false,fiscalReady:false,taxRulesConfirmed:value.taxRulesConfirmed===true,
    identifierStorageReady:/^[a-f0-9]{64}$/i.test(process.env.OPS_ASSET_ENCRYPTION_KEY ?? ''),members:members.rows,users:users.rows};
};
export const readOperationsExpenses=async(access:OperationsAccess,branchId:string|null,options:ListOptions={}) => {
  requireOperationsOwner(access);const {from,to}=reportDates(options.from ?? '',options.to ?? '');const category=options.category ?? '';
  if(category && !['shipping','return_shipping','payment_fee','rent','salary','other','write_off'].includes(category)) throw new Error('invalid_category');
  const page=boundedPage(options.page);const params=[branchId,from,to,category];
  const where="WHERE ($1::uuid IS NULL OR branch_id=$1) AND incurred_on BETWEEN $2::date AND $3::date AND ($4='' OR category=$4)";
  const [items,total]=await Promise.all([query(`SELECT id,category,gross_cents,net_cents,note,incurred_on,order_id FROM ops_expenses ${where}
    ORDER BY incurred_on DESC,id DESC LIMIT 40 OFFSET $5`,[...params,(page-1)*40]),query(`SELECT count(*)::int AS total FROM ops_expenses ${where}`,params)]);
  return {items:items.rows,total:Number(total.rows[0].total),page,asOf:new Date().toISOString()};
};
