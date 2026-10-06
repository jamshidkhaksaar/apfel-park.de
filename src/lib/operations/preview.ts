import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import type { TransactionClient } from '@/lib/db';
import { requireOperationsOwner, assertOperationsBranch } from './access';
import { readSnapshot } from './snapshot';
import { buildTillLines } from './till';
import { moneyCents, wholeQuantity, uuidPattern, assertCashierPayload, type OperationPreview, type OperationsAccess } from './types';

export const canonicalOperation=(value:unknown):unknown=>value instanceof Date ? value.toISOString():typeof value==='bigint' ? value.toString():Array.isArray(value) ? value.map(canonicalOperation) : value && typeof value==='object'
  ? Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([key,item])=>[key,canonicalOperation(item)])):value;
export const operationBody=(body:Record<string,unknown>) => Object.fromEntries(Object.entries(body).filter(([key])=>key!=='previewToken'));
const digest=(value:unknown)=>createHash('sha256').update(JSON.stringify(canonicalOperation(value))).digest('hex');
const key=()=>{const secret=process.env.APP_SESSION_SECRET;if(!secret) throw new Error('preview_not_configured');return secret;};
const sign=(encoded:string)=>createHmac('sha256',key()).update('apfel-operations-preview-v1:'+encoded).digest('base64url');
type Claims={v:1;actor:string;hash:string;state:string;expires:number};
export const signOperationPreview=(claims:Claims):string=>{const encoded=Buffer.from(JSON.stringify(claims)).toString('base64url');return encoded+'.'+sign(encoded);};
export const readOperationPreview=(token:unknown):Claims=>{
  if(typeof token!=='string' || token.length>3000) throw new Error('confirmation_required');
  const [encoded,signature,...extra]=token.split('.');if(!encoded || !signature || extra.length) throw new Error('invalid_confirmation');
  const expected=Buffer.from(sign(encoded));const supplied=Buffer.from(signature);
  if(expected.length!==supplied.length || !timingSafeEqual(expected,supplied)) throw new Error('invalid_confirmation');
  let claims:Claims;try{claims=JSON.parse(Buffer.from(encoded,'base64url').toString());}catch{throw new Error('invalid_confirmation');}
  if(claims.v!==1 || !Number.isSafeInteger(claims.expires) || typeof claims.actor!=='string' || typeof claims.hash!=='string' || typeof claims.state!=='string') throw new Error('invalid_confirmation');
  return claims;
};
const validId=(value:unknown):string=>{const id=String(value ?? '');if(!uuidPattern.test(id)) throw new Error('invalid_reference');return id;};
export const operationState=async(client:TransactionClient,body:Record<string,unknown>,lock=false) => {
  const branchId=validId(body.branchId);const suffix=lock ? ' FOR UPDATE':'';
  const branchIds=[branchId,...(body.destinationId ? [validId(body.destinationId)]:[])].sort();
  const branches=(await client.query('SELECT id,name,active FROM ops_branches WHERE id=ANY($1::uuid[]) AND code<>\'transit\' ORDER BY id'+suffix,[branchIds])).rows;
  const branch=branches.find(row=>row.id===branchId);
  if(!branch?.active) throw new Error('branch_inactive');
  const state:Record<string,unknown>={branch};let inventoryId=body.inventoryId ? validId(body.inventoryId):null;
  if(body.assetId) {
    const asset=(await client.query('SELECT inventory_id FROM ops_assets WHERE id=$1',[validId(body.assetId)])).rows[0];if(!asset) throw new Error('asset_not_found');inventoryId=String(asset.inventory_id);
  }
  if(body.documentId) {
    const doc=(await client.query('SELECT payload FROM ops_documents WHERE id=$1',[validId(body.documentId)])).rows[0];if(!doc) throw new Error('document_not_found');inventoryId=String(doc.payload.inventoryId);
  }
  const inventoryIds=body.action==='training_sale' && Array.isArray(body.items)
    ? [...new Set(body.items.map(item=>validId(item.inventoryId)))].sort():inventoryId ? [inventoryId]:[];
  if(inventoryIds.length) {
    state.inventory=(await client.query(`SELECT id,version,on_hand,reserved,safety_buffer,is_active,product_id FROM inventory_skus
      WHERE id=ANY($1::uuid[]) AND location='local' ORDER BY id${suffix}`,[inventoryIds])).rows;
    state.products=(await client.query(`SELECT p.id,p.updated_at,p.price,p.variants,p.is_active,p.condition FROM products p
      WHERE p.id IN (SELECT product_id FROM inventory_skus WHERE id=ANY($1::uuid[])) ORDER BY p.id${suffix}`,[inventoryIds])).rows;
    state.balance=(await client.query(`SELECT inventory_id,branch_id,on_hand,reserved,minimum,target,updated_at FROM ops_balances
      WHERE inventory_id=ANY($1::uuid[]) AND branch_id=$2 ORDER BY inventory_id${suffix}`,[inventoryIds,branchId])).rows;
  }
  if(body.assetId) state.asset=(await client.query('SELECT id,state,branch_id,updated_at,color,storage,battery_health,cost_gross_cents,cost_net_cents FROM ops_assets WHERE id=$1'+suffix,[validId(body.assetId)])).rows[0];
  if(body.documentId) state.document=(await client.query('SELECT id,status,destination_id,payload FROM ops_documents WHERE id=$1'+suffix,[validId(body.documentId)])).rows[0];
  if(body.destinationId) state.destination=branches.find(row=>row.id===body.destinationId);
  if(body.userId) state.user=(await client.query('SELECT id,email,is_active,role,security_version FROM users WHERE id=$1'+suffix,[validId(body.userId)])).rows[0];
  if(body.orderId) state.order=(await client.query('SELECT id,payment_status,updated_at FROM orders WHERE id=$1'+suffix,[validId(body.orderId)])).rows[0];
  return state;
};
export const verifyOperationConfirmation=async(client:TransactionClient,access:OperationsAccess,body:Record<string,unknown>) => {
  const claims=readOperationPreview(body.previewToken);
  if(claims.actor!==access.userId || claims.hash!==digest(operationBody(body))) throw new Error('invalid_confirmation');
  if(claims.expires<Date.now()) throw new Error('confirmation_expired');
  const state=await operationState(client,body,true);
  if(claims.state!==digest(state)) throw new Error('stale_information');
};
export const previewOperations=async(access:OperationsAccess,input:Record<string,unknown>):Promise<OperationPreview> => {
  const body=operationBody(input);const action=String(body.action);const branchId=validId(body.branchId);assertOperationsBranch(access,branchId);
  if(action==='training_sale') assertCashierPayload(body);else requireOperationsOwner(access);
  if(!['purchase','transfer_dispatch','transfer_receive','threshold','asset_update','expense','branch','member','member_revoke','training_sale','refund_request'].includes(action)) throw new Error(action==='live_sale' ? 'fiscal_not_configured':'invalid_action');
  if(!/^[A-Za-z0-9:_-]{8,120}$/.test(String(body.idempotencyKey ?? ''))) throw new Error('invalid_idempotency_key');
  return readSnapshot(async client=>{
    const existing=(await client.query('SELECT payload,request_hash FROM ops_documents WHERE idempotency_key=$1',[access.userId+':'+body.idempotencyKey])).rows[0];
    if(existing) {
      if(existing.request_hash!==digest(body)) throw new Error('idempotency_conflict');
      const expires=Date.now()+600000;
      const branch=(await client.query('SELECT name FROM ops_branches WHERE id=$1',[branchId])).rows[0];
      return {token:signOperationPreview({v:1,actor:access.userId,hash:digest(body),state:'already-applied',expires}),expiresAt:new Date(expires).toISOString(),branchName:String(branch?.name ?? ''),action,changes:[],alreadyApplied:true,
        ...(action==='training_sale' ? {lines:existing.payload.lines,totalCents:existing.payload.totalCents}:{})};
    }
    const state=await operationState(client,body);const branch=state.branch as {name:string};
    const balances=state.balance as Array<{on_hand:number;reserved:number;minimum:number;target:number}>|undefined;const balance=balances?.[0];
    const changes:OperationPreview['changes']=[];let totalCents:number|undefined;let lines:OperationPreview['lines'];
    if(action==='purchase' || action==='transfer_dispatch') {
      if(!balance) throw new Error('stock_not_found');const quantity=wholeQuantity(body.quantity);
      changes.push({field:'onHand',before:balance.on_hand,after:balance.on_hand+(action==='purchase' ? quantity:-quantity)});
      if(action==='transfer_dispatch') {
        if(quantity>balance.on_hand-balance.reserved) throw new Error('insufficient_stock');
        const destination=state.destination as {active:boolean;name:string}|undefined;if(!destination?.active || body.destinationId===branchId) throw new Error('invalid_destination');
        changes.push({field:'destination',before:branch.name,after:destination.name});
      } else {
        const gross=moneyCents(body.unitGross);const net=body.unitNet!=='' && body.unitNet!==undefined ? moneyCents(body.unitNet):null;
        if(net!==null && net>gross) throw new Error('invalid_amount');
        if(!String(body.supplier ?? '').trim() || !String(body.invoiceReference ?? '').trim() || body.inputVatConfirmed===true && net===null) throw new Error('purchase_evidence_required');
        totalCents=gross*quantity;changes.push({field:'supplier',before:null,after:String(body.supplier)},{field:'invoiceReference',before:null,after:String(body.invoiceReference)},
          {field:'cost_gross_cents',before:null,after:gross},{field:'cost_net_cents',before:null,after:net},{field:'totalCents',before:null,after:totalCents});
      }
    } else if(action==='transfer_receive') {
      const doc=state.document as {status:string;destination_id:string;payload:{quantity:number}};
      if(doc.status!=='dispatched' || doc.destination_id!==branchId) throw new Error('transfer_not_receivable');
      changes.push({field:'onHand',before:balance?.on_hand ?? 0,after:(balance?.on_hand ?? 0)+doc.payload.quantity});
    } else if(action==='threshold') {
      if(!balance) throw new Error('stock_not_found');const minimum=Number(body.minimum);const target=Number(body.target);
      if(!Number.isSafeInteger(minimum) || !Number.isSafeInteger(target) || minimum<0 || target<minimum || target>10000) throw new Error('invalid_threshold');
      changes.push({field:'minimum',before:balance.minimum,after:minimum},{field:'target',before:balance.target,after:target});
    } else if(action==='asset_update') {
      const asset=state.asset as Record<string,unknown>;if(asset.state!=='available' || asset.branch_id!==branchId) throw new Error('asset_unavailable');
      for(const field of ['color','storage','batteryHealth','unitGross','unitNet']) {
        const column={color:'color',storage:'storage',batteryHealth:'battery_health',unitGross:'cost_gross_cents',unitNet:'cost_net_cents'}[field]!;
        const monetary=field.startsWith('unit');const old=asset[column]===null ? null:monetary ? Number(asset[column]):String(asset[column]);
        const after=monetary ? body[field] ? moneyCents(body[field]):old:String(body[field] ?? '');
        changes.push({field:monetary ? column:field,before:old,after});
      }
      if(body.serial || body.imei) changes.push({field:'identifier',before:null,after:'encrypted'});
    } else if(action==='expense') {totalCents=moneyCents(body.gross);changes.push({field:'totalCents',before:null,after:totalCents});}
    else if(action==='training_sale') {lines=await buildTillLines(client,branchId,body.items);totalCents=lines.reduce((n,line)=>n+line.totalCents,0);}
    else if(action==='branch') changes.push({field:'name',before:null,after:String(body.name ?? '')},{field:'address',before:null,after:String(body.address ?? '')},{field:'code',before:null,after:String(body.code ?? '')});
    else if(action==='member' || action==='member_revoke') {
      const user=state.user as {email?:string;role?:string}|undefined;
      changes.push({field:'user',before:null,after:user?.email ?? String(body.userId)},{field:'role',before:user?.role ?? null,after:action==='member_revoke' ? 'revoked':String(body.role)});
    }else changes.push({field:'action',before:null,after:action});
    const expires=Date.now()+600000;
    return {token:signOperationPreview({v:1,actor:access.userId,hash:digest(body),state:digest(state),expires}),expiresAt:new Date(expires).toISOString(),branchName:branch.name,action,changes,totalCents,lines};
  });
};
