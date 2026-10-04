import { createHash } from 'node:crypto';
import { query, withTransaction, type TransactionClient } from '@/lib/db';
import { adjustInventory, releaseInventoryReservation, reserveInventoryBatch } from '@/lib/marketplaces/inventory';
import { assertOperationsBranch, requireOperationsOwner } from './access';
import { decryptDeviceIdentifier,encryptDeviceIdentifier } from './private-identifiers';
import { reportDates } from './read';
import { assertCashierPayload, moneyCents, wholeQuantity, uuidPattern, type OperationsAccess, type TillLine } from './types';

const text = (value: unknown, max=500): string => typeof value==='string' ? value.trim().slice(0,max) : '';
const id = (value: unknown): string => { const s=text(value,40); if (!uuidPattern.test(s)) throw new Error('invalid_reference'); return s; };
const optionalMoney = (value: unknown): number | null => value===undefined || value===null || value==='' ? null : moneyCents(value);
const canonical = (value: unknown): unknown => Array.isArray(value) ? value.map(canonical) : value && typeof value==='object'
  ? Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([key,item])=>[key,canonical(item)])) : value;
const lockInventory = async (client: TransactionClient, inventoryId: string) => {
  const result=await client.query("SELECT * FROM inventory_skus WHERE id=$1 AND location='local' AND is_active=true FOR UPDATE", [inventoryId]);
  if (!result.rows[0]) throw new Error('stock_not_found'); return result.rows[0];
};
const activeBranch = async (client: TransactionClient, branchId: string) => {
  const result=await client.query("SELECT * FROM ops_branches WHERE id=$1 AND active AND code<>'transit'", [branchId]);
  if (!result.rows[0]) throw new Error('branch_inactive'); return result.rows[0];
};
const setBranch = async (client: TransactionClient, branchId: string) => {
  await client.query("SELECT set_config('apfel.ops_branch',$1,true)", [branchId]);
};
const moveCostBatches = async (client: TransactionClient, inventoryId: string, source: string, destination: string, quantity: number) => {
  const result=await client.query(`SELECT * FROM ops_cost_batches WHERE inventory_id=$1 AND branch_id=$2 AND remaining>0 ORDER BY created_at,id FOR UPDATE`, [inventoryId,source]);
  let remaining=quantity;
  for (const batch of result.rows) {
    const take=Math.min(remaining,Number(batch.remaining)); if (!take) break;
    await client.query('UPDATE ops_cost_batches SET remaining=remaining-$2 WHERE id=$1', [batch.id,take]);
    await client.query(`INSERT INTO ops_cost_batches(inventory_id,branch_id,remaining,cost_gross_cents,cost_net_cents,reference_id,created_at)
      VALUES($1,$2,$3,$4,$5,$6,$7)`, [inventoryId,destination,take,batch.cost_gross_cents,batch.cost_net_cents,batch.reference_id,batch.created_at]);
    remaining-=take;
  }
};

export const buildTillLines = async (client: TransactionClient, branchId: string, input: unknown): Promise<TillLine[]> => {
  if (!Array.isArray(input) || input.length<1 || input.length>100) throw new Error('invalid_basket');
  const lines: TillLine[]=[]; const totals=new Map<string,number>(); const assets=new Set<string>();
  for (const value of input) {
    if (!value || typeof value!=='object') throw new Error('invalid_basket');
    const item=value as Record<string,unknown>; const inventoryId=id(item.inventoryId); const quantity=wholeQuantity(item.quantity);
    const assetId=item.assetId ? id(item.assetId) : undefined;
    if (assetId && (quantity!==1 || assets.has(assetId))) throw new Error('invalid_basket');
    if (assetId) assets.add(assetId);
    const result=await client.query(`SELECT i.sku,p.title,p.condition,round(coalesce(nullif(v.value->>'price','')::numeric,p.price)*100)::bigint AS price,
      s.on_hand-s.reserved AS branch_available,available_inventory(i.on_hand,i.reserved,i.safety_buffer) AS total_available
      FROM inventory_skus i JOIN products p ON p.id=i.product_id JOIN ops_balances s ON s.inventory_id=i.id AND s.branch_id=$2
      LEFT JOIN LATERAL(SELECT value FROM jsonb_array_elements(CASE WHEN jsonb_typeof(p.variants)='array' THEN p.variants ELSE '[]' END)
        WHERE value->>'sku'=i.sku LIMIT 1) v ON true WHERE i.id=$1 AND i.location='local' AND i.is_active AND p.is_active`, [inventoryId,branchId]);
    const product=result.rows[0]; if (!product || Number(product.price)<=0) throw new Error('product_not_sellable');
    const total=(totals.get(inventoryId) ?? 0)+quantity;totals.set(inventoryId,total);
    if (total>Math.min(Number(product.branch_available),Number(product.total_available))) throw new Error('insufficient_stock');
    if (assetId) {
      const asset=await client.query("SELECT 1 FROM ops_assets WHERE id=$1 AND inventory_id=$2 AND branch_id=$3 AND state='available'", [assetId,inventoryId,branchId]);
      if (!asset.rows[0]) throw new Error('asset_unavailable');
    }
    const unitCents=Number(product.price);
    lines.push({ inventoryId,quantity,assetId,title:String(product.title),sku:String(product.sku),condition:String(product.condition),unitCents,totalCents:unitCents*quantity });
  }
  return lines;
};

export const writeOperations = async (access: OperationsAccess, body: Record<string,unknown>) => {
  const action=text(body.action,50);
  if (action==='live_sale') throw new Error('fiscal_not_configured');
  if (action==='training_sale') assertCashierPayload(body); else requireOperationsOwner(access);
  const branchId=id(body.branchId);assertOperationsBranch(access,branchId);
  if(action==='asset_private') {
    const assetId=id(body.assetId);
    return withTransaction(async client=>{
      const asset=(await client.query('SELECT serial_encrypted,imei_encrypted FROM ops_assets WHERE id=$1 AND branch_id=$2',[assetId,branchId])).rows[0];
      if(!asset) throw new Error('asset_not_found');
      await client.query("INSERT INTO ops_audit(actor_id,action,branch_id,reference_id) VALUES($1,'identifier_read',$2,$3)",[access.userId,branchId,assetId]);
      return {serial:decryptDeviceIdentifier(asset.serial_encrypted),imei:decryptDeviceIdentifier(asset.imei_encrypted)};
    });
  }
  const rawKey=text(body.idempotencyKey,120);
  if (!/^[A-Za-z0-9:_-]{8,120}$/.test(rawKey)) throw new Error('invalid_idempotency_key');
  const key=`${access.userId}:${rawKey}`;
  const hash=createHash('sha256').update(JSON.stringify(canonical(body))).digest('hex');
  return withTransaction(async client => {
    await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [key]);
    const existing=await client.query('SELECT id,number,kind,status,payload,request_hash FROM ops_documents WHERE idempotency_key=$1', [key]);
    if (existing.rows[0]) {
      if (existing.rows[0].request_hash!==hash) throw new Error('idempotency_conflict');
      return { ...existing.rows[0],replayed:true,request_hash:undefined };
    }
    const branch=await activeBranch(client,branchId);
    let kind=action; let status='recorded'; let destination: string|null=null; let payload: Record<string,unknown>={};
    if (action==='purchase') {
      const inventoryId=id(body.inventoryId);const quantity=wholeQuantity(body.quantity);
      const gross=moneyCents(body.unitGross);const net=optionalMoney(body.unitNet);
      if (net!==null && net>gross) throw new Error('invalid_amount');
      if(body.inputVatConfirmed===true && net===null) throw new Error('purchase_evidence_required');
      const costBasis=body.inputVatConfirmed===true ? net! : gross;
      const supplier=text(body.supplier,180);const invoice=text(body.invoiceReference,100);
      if (!supplier || !invoice) throw new Error('purchase_evidence_required');
      const stock=await lockInventory(client,inventoryId);await setBranch(client,branchId);
      await client.query("SELECT set_config('apfel.ops_cost_gross',$1,true),set_config('apfel.ops_cost_net',$2,true)", [String(gross),String(costBasis)]);
      await adjustInventory({ sku:String(stock.sku),type:'restock',quantity,referenceType:'ops_purchase',referenceId:key,actor:access.email,
        metadata:{supplier,invoiceReference:invoice} },client);
      payload={ inventoryId,sku:stock.sku,quantity,supplier,invoiceReference:invoice,unitGrossCents:gross,unitNetCents:net,
        totalGrossCents:gross*quantity,inputVatCents:body.inputVatConfirmed===true && net!==null ? (gross-net)*quantity : 0,
        costBasisCents:costBasis,purchaseTaxConfirmed:body.inputVatConfirmed===true,paid:body.paid===true };
    } else if (action==='transfer_dispatch') {
      kind='transfer';status='dispatched';destination=id(body.destinationId);
      if (destination===branchId) throw new Error('invalid_destination');await activeBranch(client,destination);
      const inventoryId=id(body.inventoryId);const quantity=wholeQuantity(body.quantity);
      const stock=await lockInventory(client,inventoryId);await setBranch(client,branchId);
      await reserveInventoryBatch([{sku:String(stock.sku),quantity}],'ops_transfer',key,access.email,client);
      const transit=(await client.query("SELECT id FROM ops_branches WHERE code='transit'")).rows[0].id;
      await client.query(`INSERT INTO ops_balances(inventory_id,branch_id) VALUES($1,$2) ON CONFLICT DO NOTHING`, [inventoryId,transit]);
      await client.query('UPDATE ops_balances SET on_hand=on_hand-$3,reserved=reserved-$3,updated_at=now() WHERE inventory_id=$1 AND branch_id=$2', [inventoryId,branchId,quantity]);
      await client.query('UPDATE ops_balances SET on_hand=on_hand+$3,reserved=reserved+$3,updated_at=now() WHERE inventory_id=$1 AND branch_id=$2', [inventoryId,transit,quantity]);
      await client.query(`UPDATE ops_allocations SET branch_id=$3 WHERE inventory_id=$1 AND reference_type='ops_transfer' AND reference_id=$2`, [inventoryId,key,transit]);
      await client.query(`UPDATE ops_assets SET branch_id=$3,state='transit',updated_at=now() WHERE inventory_id=$1 AND reservation_type='ops_transfer' AND reservation_id=$2`, [inventoryId,key,transit]);
      await moveCostBatches(client,inventoryId,branchId,transit,quantity);
      payload={inventoryId,sku:stock.sku,quantity,reservationKey:key,note:text(body.note)};
    } else if (action==='transfer_receive') {
      kind='transfer';status='received';
      const originalId=id(body.documentId);
      const doc=(await client.query("SELECT * FROM ops_documents WHERE id=$1 AND kind='transfer' AND status='dispatched' FOR UPDATE", [originalId])).rows[0];
      if (!doc || doc.destination_id!==branchId) throw new Error('transfer_not_receivable');
      const inventoryId=String(doc.payload.inventoryId);const quantity=Number(doc.payload.quantity);await lockInventory(client,inventoryId);
      const transit=(await client.query("SELECT id FROM ops_branches WHERE code='transit'")).rows[0].id;
      await client.query('INSERT INTO ops_balances(inventory_id,branch_id) VALUES($1,$2) ON CONFLICT DO NOTHING', [inventoryId,branchId]);
      await client.query('UPDATE ops_balances SET on_hand=on_hand-$3,reserved=reserved-$3,updated_at=now() WHERE inventory_id=$1 AND branch_id=$2', [inventoryId,transit,quantity]);
      await client.query('UPDATE ops_balances SET on_hand=on_hand+$3,reserved=reserved+$3,updated_at=now() WHERE inventory_id=$1 AND branch_id=$2', [inventoryId,branchId,quantity]);
      await client.query("UPDATE ops_allocations SET branch_id=$3 WHERE inventory_id=$1 AND reference_type='ops_transfer' AND reference_id=$2", [inventoryId,doc.payload.reservationKey,branchId]);
      await client.query("UPDATE ops_assets SET branch_id=$3,state='reserved',updated_at=now() WHERE inventory_id=$1 AND reservation_type='ops_transfer' AND reservation_id=$2", [inventoryId,doc.payload.reservationKey,branchId]);
      await moveCostBatches(client,inventoryId,transit,branchId,quantity);
      await releaseInventoryReservation('ops_transfer',String(doc.payload.reservationKey),false,client);
      await client.query("UPDATE ops_documents SET status='received' WHERE id=$1", [originalId]);
      payload={originalId,inventoryId,quantity};
    } else if (action==='threshold') {
      const inventoryId=id(body.inventoryId);const minimum=Number(body.minimum);const target=Number(body.target);
      if (!Number.isSafeInteger(minimum) || !Number.isSafeInteger(target) || minimum<0 || target<minimum || target>10000) throw new Error('invalid_threshold');
      await lockInventory(client,inventoryId);
      await client.query(`INSERT INTO ops_balances(inventory_id,branch_id,minimum,target) VALUES($1,$2,$3,$4)
        ON CONFLICT(inventory_id,branch_id) DO UPDATE SET minimum=$3,target=$4,updated_at=now()`, [inventoryId,branchId,minimum,target]);
      payload={inventoryId,minimum,target};
    } else if (action==='asset_update') {
      const assetId=id(body.assetId);
      const initial=(await client.query('SELECT inventory_id FROM ops_assets WHERE id=$1', [assetId])).rows[0];
      if (!initial) throw new Error('asset_not_found');await lockInventory(client,String(initial.inventory_id));
      const asset=(await client.query("SELECT * FROM ops_assets WHERE id=$1 AND branch_id=$2 AND state='available' FOR UPDATE", [assetId,branchId])).rows[0];
      if (!asset) throw new Error('asset_unavailable');
      const gross=optionalMoney(body.unitGross);const net=optionalMoney(body.unitNet);
      if (net!==null && (gross===null || net>gross)) throw new Error('invalid_amount');
      const effectiveGross=gross ?? (asset.cost_gross_cents===null ? null : Number(asset.cost_gross_cents));
      const effectiveNet=net ?? (asset.cost_net_cents===null ? null : Number(asset.cost_net_cents));
      if(effectiveNet!==null && (effectiveGross===null || effectiveNet>effectiveGross)) throw new Error('invalid_amount');
      const battery=body.batteryHealth==='' || body.batteryHealth===undefined ? null : Number(body.batteryHealth);
      if (battery!==null && (!Number.isInteger(battery) || battery<0 || battery>100)) throw new Error('invalid_battery');
      const serial=text(body.serial,40) ? encryptDeviceIdentifier(text(body.serial,40)) : null;
      const imei=text(body.imei,40) ? encryptDeviceIdentifier(text(body.imei,40)) : null;
      const note=text(body.note);if (!note) throw new Error('reason_required');
      await client.query(`UPDATE ops_assets SET color=$3,storage=$4,battery_health=$5,
        cost_gross_cents=coalesce($6,cost_gross_cents),cost_net_cents=coalesce($7,cost_net_cents),
        serial_encrypted=coalesce($8,serial_encrypted),imei_encrypted=coalesce($9,imei_encrypted),identifier_hash=coalesce($10,identifier_hash),
        serial_hash=coalesce($11,serial_hash),imei_hash=coalesce($12,imei_hash),updated_at=now()
        WHERE id=$1 AND branch_id=$2`, [assetId,branchId,text(body.color,80),text(body.storage,40),battery,gross,net,serial?.encrypted,imei?.encrypted,imei?.hash ?? serial?.hash,serial?.hash,imei?.hash]);
      payload={assetId,color:text(body.color,80),storage:text(body.storage,40),batteryHealth:battery,costGrossCents:gross,costNetCents:net,identifierRecorded:Boolean(serial || imei),note};
    } else if (action==='expense') {
      const categories=['shipping','return_shipping','payment_fee','rent','salary','other','write_off'];const category=text(body.category,40);
      if (!categories.includes(category)) throw new Error('invalid_category');
      const gross=moneyCents(body.gross);const net=optionalMoney(body.net);const vat=optionalMoney(body.inputVat);
      if (net!==null && net>gross || vat!==null && vat>gross) throw new Error('invalid_amount');
      if (net!==null && vat!==null && net+vat!==gross) throw new Error('invalid_amount');
      const note=text(body.note);if (!note) throw new Error('reason_required');
      const date=text(body.date,10);reportDates(date,date);const orderId=body.orderId ? id(body.orderId) : null;
      await client.query(`INSERT INTO ops_expenses(branch_id,order_id,category,gross_cents,net_cents,input_vat_cents,note,incurred_on,actor_id,idempotency_key)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, [branchId,orderId,category,gross,net,vat,note,date,access.userId,key]);
      payload={category,grossCents:gross,netCents:net,inputVatCents:vat,note,date,orderId};
    } else if (action==='branch') {
      kind='branch_setup';const name=text(body.name,100);const address=text(body.address,300);const code=text(body.code,30).toLowerCase();
      if (!name || !address || !/^[a-z][a-z0-9-]{1,29}$/.test(code) || code==='transit') throw new Error('invalid_branch');
      const created=(await client.query('INSERT INTO ops_branches(code,name,address) VALUES($1,$2,$3) RETURNING id', [code,name,address])).rows[0];
      await client.query("INSERT INTO ops_balances(inventory_id,branch_id) SELECT id,$1 FROM inventory_skus WHERE location='local' ON CONFLICT DO NOTHING", [created.id]);
      payload={branchId:created.id,name,address,code};
    } else if (action==='member') {
      kind='membership';const userId=id(body.userId);const role=text(body.role,20);
      if (!['cashier','owner'].includes(role)) throw new Error('invalid_role');
      const target=(await client.query('SELECT * FROM users WHERE id=$1 AND is_active FOR UPDATE', [userId])).rows[0];
      if (!target || userId===access.userId && role==='cashier' || target.role==='admin' && role==='cashier') throw new Error('invalid_role');
      await client.query(`INSERT INTO ops_members(user_id,role,branch_id) VALUES($1,$2,$3)
        ON CONFLICT(user_id) DO UPDATE SET role=$2,branch_id=$3,active=true`, [userId,role,role==='cashier' ? branchId : null]);
      if (target.role!=='admin') {
        await client.query('UPDATE users SET role=$2,security_version=security_version+1,updated_at=now() WHERE id=$1', [userId,role==='cashier' ? 'cashier' : 'manager']);
      }
      payload={userId,role,branchId:role==='cashier' ? branchId : null};
    } else if (action==='training_sale') {
      const lines=await buildTillLines(client,branchId,body.items);status='training';
      payload={lines,totalCents:lines.reduce((sum,line)=>sum+line.totalCents,0),branchName:String(branch.name),training:true};
    } else if (action==='refund_request') {
      const orderId=id(body.orderId);const note=text(body.note);if (!note) throw new Error('reason_required');
      const order=(await client.query("SELECT id,payment_status FROM orders WHERE id=$1 AND paid_at IS NOT NULL", [orderId])).rows[0];
      if (!order) throw new Error('order_not_found');
      status='needs_owner_review';payload={orderId,note,requestedCents:moneyCents(body.amount),moneyRefunded:false};
    } else throw new Error('invalid_action');
    const document=(await client.query(`INSERT INTO ops_documents(kind,branch_id,destination_id,status,payload,actor_id,idempotency_key,request_hash)
      VALUES($1,$2,$3,$4,$5::jsonb,$6,$7,$8) RETURNING id,number,kind,status,payload`, [kind,branchId,destination,status,JSON.stringify(payload),access.userId,key,hash])).rows[0];
    await client.query('INSERT INTO ops_audit(actor_id,action,branch_id,reference_id) VALUES($1,$2,$3,$4)', [access.userId,action,branchId,String(document.id)]);
    await client.query('INSERT INTO ops_events(kind,branch_id) VALUES($1,$2)', [kind,branchId]);
    return { ...document,replayed:false };
  });
};

export const lookupScannedAsset = async (access: OperationsAccess, branchId: string, label: string) => {
  assertOperationsBranch(access,branchId);
  if (!/^APF-\d{8,18}$/.test(label)) return null;
  const result=await query(`SELECT a.id,a.inventory_id,a.branch_id,a.state FROM ops_assets a
    WHERE a.label_number=$1::bigint AND a.branch_id=$2 AND a.state='available'`, [label.slice(4),branchId]);
  return result.rows[0] ?? null;
};
