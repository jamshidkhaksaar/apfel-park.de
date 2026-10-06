import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { Pool } from 'pg';

const main=async () => {
  if (!process.env.DATABASE_URL) throw new Error('Load the app env for a local isolated database test');
  const url=new URL(process.env.DATABASE_URL);
  assert(['localhost','127.0.0.1','[::1]'].includes(url.hostname),'Tests are restricted to local PostgreSQL');
  const role=decodeURIComponent(url.username);assert(/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(role));
  const database=`apfel_ops_test_${Date.now()}`;
  const creation=spawnSync('sudo',['-u','postgres','createdb',`--owner=${role}`,database],{encoding:'utf8'});
  assert.equal(creation.status,0,'Could not create isolated operations test database');
  url.pathname=`/${database}`;process.env.DATABASE_URL=url.toString();
  const pool=new Pool({connectionString:url.toString()});
  let checks=0;
  try {
    await pool.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto; CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      CREATE TABLE products(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),title text NOT NULL,category text NOT NULL,
        price numeric(10,2) NOT NULL,stock integer NOT NULL DEFAULT 0,variants jsonb DEFAULT '[]',sku text,
        is_active boolean DEFAULT true,images jsonb DEFAULT '[]',condition text DEFAULT 'sealed',created_at timestamptz DEFAULT now(),updated_at timestamptz DEFAULT now());
      CREATE TABLE users(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),email text UNIQUE,role text DEFAULT 'admin',is_active boolean DEFAULT true,security_version integer DEFAULT 0,updated_at timestamptz DEFAULT now());
      CREATE TABLE orders(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),total_amount numeric,subtotal_amount numeric,shipping_amount numeric DEFAULT 0,vat_amount numeric DEFAULT 0,
        paid_at timestamptz,payment_status text DEFAULT 'unpaid',status text DEFAULT 'pending',shipping_method text DEFAULT 'shipping',order_number integer,items jsonb DEFAULT '[]');
      CREATE TABLE store_settings(key text PRIMARY KEY,value jsonb,updated_at timestamptz DEFAULT now());`);
    for (const name of ['20260712_marketplace_foundation.sql','20260818_live_omnichannel_inventory.sql','20261003_operations_workspace.sql','20261006_operations_pilot.sql'])
      await pool.query(await readFile(`supabase/migrations/${name}`,'utf8'));
    process.env.APP_SESSION_SECRET='isolated-operations-preview-secret';
    const {writeOperations:rawWrite}=await import('../../src/lib/operations/write');
    const {previewOperations}=await import('../../src/lib/operations/preview');
    const writeOperations=async(access:import('../../src/lib/operations/types').OperationsAccess,body:Record<string,unknown>)=>{
      if(body.action==='asset_private') return rawWrite(access,body);
      const preview=await previewOperations(access,body);return rawWrite(access,{...body,previewToken:preview.token});
    };
    const {readOperationsStock,readOperationsAssets,reportDates}=await import('../../src/lib/operations/read');
    const {query,withTransaction}=await import('../../src/lib/db');
    const {reserveInventoryBatch,releaseInventoryReservation}=await import('../../src/lib/marketplaces/inventory');
    const ownerId=(await pool.query("INSERT INTO users(email) VALUES('ops-test@example.invalid') RETURNING id")).rows[0].id;
    const access={userId:String(ownerId),email:'ops-test@example.invalid',owner:true,branchId:null};
    const mainId=(await pool.query("SELECT id FROM ops_branches WHERE code='main'")).rows[0].id;
    const product=(await pool.query("INSERT INTO products(title,category,price,sku) VALUES('Test phone','Smartphones',250,'OPS-PHONE') RETURNING id")).rows[0].id;
    const inventory=(await pool.query("INSERT INTO inventory_skus(product_id,sku,location,on_hand,safety_buffer) VALUES($1,'OPS-PHONE','local',1,0) RETURNING id",[product])).rows[0].id;
    const purchase={action:'purchase',branchId:mainId,inventoryId:inventory,quantity:2,unitGross:'100.00',unitNet:'90.00',supplier:'Synthetic supplier',invoiceReference:'TEST-001',idempotencyKey:'purchase-test-001'};
    await writeOperations(access,purchase);await writeOperations(access,purchase);
    assert.equal(Number((await pool.query('SELECT on_hand FROM inventory_skus WHERE id=$1',[inventory])).rows[0].on_hand),3);checks++;
    await assert.rejects(writeOperations(access,{...purchase,quantity:3}),/idempotency_conflict/);checks++;
    const assets=await readOperationsAssets(access,mainId,'',1);assert.equal(assets.length,3);assert.equal(assets.filter(a=>a.costGrossCents===null).length,1);checks++;
    process.env.OPS_ASSET_ENCRYPTION_KEY='0'.repeat(64);
    await writeOperations(access,{action:'asset_update',branchId:mainId,assetId:assets[0].id,serial:'SYNTEST-123456',note:'Synthetic identifier test',idempotencyKey:'private-identifier-test'});
    const privateValue=await writeOperations(access,{action:'asset_private',branchId:mainId,assetId:assets[0].id});
    assert.equal(privateValue.serial,'SYNTEST-123456');checks++;
    await assert.rejects(writeOperations({...access,owner:false,branchId:mainId},{action:'asset_private',branchId:mainId,assetId:assets[0].id}),/owner_required/);checks++;
    const second=await writeOperations(access,{action:'branch',branchId:mainId,name:'Synthetic branch',code:'test-second',address:'Test address',idempotencyKey:'branch-test-001'});
    const secondId=String(second.payload.branchId);
    const transfer=await writeOperations(access,{action:'transfer_dispatch',branchId:mainId,destinationId:secondId,inventoryId:inventory,quantity:1,idempotencyKey:'dispatch-test-001'});
    assert.equal(Number((await pool.query('SELECT reserved FROM inventory_skus WHERE id=$1',[inventory])).rows[0].reserved),1);checks++;
    assert.equal((await pool.query("SELECT count(*)::int AS n FROM ops_assets WHERE inventory_id=$1 AND state='transit'",[inventory])).rows[0].n,1);checks++;
    const receive={action:'transfer_receive',branchId:secondId,documentId:String(transfer.id),idempotencyKey:'receive-test-001'};
    await writeOperations(access,receive);await writeOperations(access,receive);
    assert.equal(Number((await pool.query('SELECT reserved FROM inventory_skus WHERE id=$1',[inventory])).rows[0].reserved),0);checks++;
    assert.equal((await readOperationsStock(access,secondId,'',1)).items[0].available,1);checks++;
    await assert.rejects(writeOperations(access,{...receive,idempotencyKey:'receive-test-002'}),/transfer_not_receivable/);checks++;
    const cashier={...access,owner:false,branchId:mainId};
    await assert.rejects(writeOperations(cashier,{...purchase,idempotencyKey:'denied-test-001'}),/owner_required/);checks++;
    await assert.rejects(writeOperations(cashier,{action:'training_sale',branchId:mainId,items:[{inventoryId:inventory,quantity:1,price:1}],idempotencyKey:'bad-price-test-001'}),/price_override_forbidden/);checks++;
    const till=await writeOperations(cashier,{action:'training_sale',branchId:mainId,items:[{inventoryId:inventory,quantity:1}],idempotencyKey:'training-test-001'});
    assert.equal(till.payload.totalCents,25000);assert.equal((await readOperationsStock(access,mainId,'',1)).items[0].onHand,2);checks++;
    assert.equal('costGrossCents' in (await readOperationsAssets(cashier,mainId,'',1))[0],false);checks++;
    const lastProduct=(await pool.query("INSERT INTO products(title,category,price,sku) VALUES('Last phone','Smartphones',300,'OPS-LAST') RETURNING id")).rows[0].id;
    await pool.query("INSERT INTO inventory_skus(product_id,sku,location,on_hand,safety_buffer) VALUES($1,'OPS-LAST','local',1,0)",[lastProduct]);
    const race=await Promise.allSettled(['website','till'].map(ref=>withTransaction(client=>reserveInventoryBatch([{sku:'OPS-LAST',quantity:1}],'race',ref,'test',client))));
    assert.equal(race.filter(r=>r.status==='fulfilled').length,1);checks++;
    const winner=race.findIndex(r=>r.status==='fulfilled')===0 ? 'website' : 'till';
    await withTransaction(client=>releaseInventoryReservation('race',winner,true,client));
    await withTransaction(client=>releaseInventoryReservation('race',winner,true,client));
    assert.equal(Number((await pool.query("SELECT on_hand FROM inventory_skus WHERE sku='OPS-LAST'")).rows[0].on_hand),0);checks++;
    // Legacy catalog upserts stay reflected in branch balances and cost gaps.
    await pool.query('UPDATE inventory_skus SET on_hand=on_hand+1 WHERE id=$1',[inventory]);
    const mismatch=await pool.query(`SELECT count(*)::int AS n FROM inventory_skus i LEFT JOIN
      (SELECT inventory_id,sum(on_hand) AS on_hand,sum(reserved) AS reserved FROM ops_balances GROUP BY inventory_id) b ON b.inventory_id=i.id
      WHERE i.location='local' AND (i.on_hand<>coalesce(b.on_hand,0) OR i.reserved<>coalesce(b.reserved,0))`);
    assert.equal(mismatch.rows[0].n,0);checks++;
    await withTransaction(client=>reserveInventoryBatch([{sku:'OPS-PHONE',quantity:4}],'checkout_order','split-branch-order','test',client));
    await withTransaction(client=>releaseInventoryReservation('checkout_order','split-branch-order',true,client));
    const partition=(await pool.query('SELECT sum(on_hand)::int AS stock,sum(reserved)::int AS reserved FROM ops_balances WHERE inventory_id=$1',[inventory])).rows[0];
    assert.equal(partition.stock,0);assert.equal(partition.reserved,0);checks++;
    assert.equal((await pool.query("SELECT count(*)::int AS n FROM ops_allocations WHERE reference_id='split-branch-order'")).rows[0].n,0);checks++;
    await writeOperations(access,{...purchase,branchId:secondId,quantity:1,idempotencyKey:'secondary-only-purchase'});
    const pickupOrder=(await pool.query("INSERT INTO orders(shipping_method) VALUES('pickup') RETURNING id")).rows[0].id;
    await assert.rejects(withTransaction(client=>reserveInventoryBatch([{sku:'OPS-PHONE',quantity:1}],'checkout_order',pickupOrder,'test',client)),/selected branch/);checks++;
    assert.equal(Number((await pool.query('SELECT reserved FROM inventory_skus WHERE id=$1',[inventory])).rows[0].reserved),0);checks++;
    assert.throws(()=>reportDates('2026-02-30','2026-03-01'),/invalid_dates/);checks++;
    await assert.rejects(pool.query('UPDATE ops_documents SET payload=$2 WHERE id=$1',[till.id,{totalCents:1}]),/immutable/);checks++;
    // Preview is read-only; cancelled review cannot alter stock or documents.
    const previewBody={...purchase,quantity:1,idempotencyKey:'preview-read-only-001'};
    const before=(await pool.query('SELECT count(*)::int AS n FROM ops_documents')).rows[0].n;
    const preview=await previewOperations(access,previewBody);
    assert.equal((await pool.query('SELECT count(*)::int AS n FROM ops_documents')).rows[0].n,before);checks++;
    await assert.rejects(rawWrite(access,previewBody),/confirmation_required/);checks++;
    await pool.query('UPDATE inventory_skus SET on_hand=on_hand+1 WHERE id=$1',[inventory]);
    await assert.rejects(rawWrite(access,{...previewBody,previewToken:preview.token}),/stale_information/);checks++;
    // A committed replay is returned even after the confirmation expires/is lost.
    const fresh=await previewOperations(access,previewBody);await rawWrite(access,{...previewBody,previewToken:fresh.token});
    assert.equal((await rawWrite(access,previewBody)).replayed,true);checks++;
    const {readOperationsReport}=await import('../../src/lib/operations/report');
    const {readStockSummary}=await import('../../src/lib/operations/stock-summary');
    const {readOperationsDocumentPage}=await import('../../src/lib/operations/read');
    const inactive=(await pool.query("INSERT INTO products(title,category,price,sku,is_active) VALUES('Inactive stock','Accessories',10,'OPS-INACTIVE',false) RETURNING id")).rows[0].id;
    await pool.query("INSERT INTO inventory_skus(product_id,sku,location,on_hand,safety_buffer) VALUES($1,'OPS-INACTIVE','local',3,0)",[inactive]);
    const stats=await withTransaction(client=>readStockSummary(client,null));assert(stats.inactiveUnits>=3);assert(stats.physicalUnits>stats.availableUnits);checks++;
    await pool.query(`INSERT INTO orders(total_amount,subtotal_amount,vat_amount,paid_at,payment_status,order_number,items)
      SELECT 1,1,0,'2026-10-06T12:00:00Z','paid',10000+n,'[{"sku":"REPORT-TEST","quantity":1,"lineAmount":1}]'::jsonb FROM generate_series(1,5101) n`);
    const report=await readOperationsReport(access,null,'2026-10-06','2026-10-06');
    assert.equal(report.summary.orders,5101);assert.equal(report.summary.capturedCents,510100);assert.equal(report.attribution.unassignedOrders,5101);checks++;
    assert.equal(report.summary.contributionCents,null);assert.equal(report.summary.feesCents,null);checks++;
    assert.equal(report.summary.shippingExpenseCents,null);assert.equal(report.summary.missingShippingCosts,5101);checks++;
    const pending=(await pool.query(`INSERT INTO ops_documents(kind,branch_id,destination_id,status,payload,actor_id,idempotency_key,request_hash,created_at)
      VALUES('transfer',$1,$2,'dispatched','{}',$3,'old-pending-transfer','synthetic','2026-01-01') RETURNING id`,[mainId,secondId,ownerId])).rows[0].id;
    await pool.query(`INSERT INTO ops_documents(kind,branch_id,status,payload,actor_id,idempotency_key,request_hash)
      SELECT 'threshold',$1,'recorded','{}',$2,'newer-document-'||n,'synthetic' FROM generate_series(1,150) n`,[mainId,ownerId]);
    const pendingPage=await readOperationsDocumentPage(access,null,{kind:'transfer',status:'dispatched'});
    assert(pendingPage.documents.some(doc=>doc.id===pending));checks++;
    // The global buffer is subtracted once, not once per branch.
    const bufferProduct=(await pool.query("INSERT INTO products(title,category,price,sku) VALUES('Buffer test','Accessories',10,'OPS-BUFFER') RETURNING id")).rows[0].id;
    const bufferInventory=(await pool.query("INSERT INTO inventory_skus(product_id,sku,location,on_hand,safety_buffer) VALUES($1,'OPS-BUFFER','local',10,2) RETURNING id",[bufferProduct])).rows[0].id;
    const baseline=await withTransaction(client=>readStockSummary(client,null));
    await pool.query('UPDATE inventory_skus SET safety_buffer=0 WHERE id=$1',[bufferInventory]);
    const noBuffer=await withTransaction(client=>readStockSummary(client,null));assert.equal(noBuffer.availableUnits-baseline.availableUnits,2);checks++;
    const staffId=(await pool.query("INSERT INTO users(email,role) VALUES('cashier-test@example.invalid','manager') RETURNING id")).rows[0].id;
    await writeOperations(access,{action:'member',branchId:mainId,userId:staffId,role:'cashier',idempotencyKey:'grant-cashier-test'});
    const {getOperationsAccess}=await import('../../src/lib/operations/access');
    const staff=await getOperationsAccess({id:'cashier-test@example.invalid',email:'cashier-test@example.invalid',app_metadata:{role:'cashier'}});
    assert(staff && !staff.owner && staff.branchId===mainId);checks++;
    await assert.rejects(readOperationsReport(staff,null,'2026-10-06','2026-10-06'),/owner_required/);checks++;
    const beforeVersion=(await pool.query('SELECT security_version FROM users WHERE id=$1',[staffId])).rows[0].security_version;
    await writeOperations(access,{action:'member_revoke',branchId:mainId,userId:staffId,idempotencyKey:'revoke-cashier-test'});
    assert.equal((await pool.query('SELECT security_version FROM users WHERE id=$1',[staffId])).rows[0].security_version,beforeVersion+1);
    assert.equal(await getOperationsAccess({id:'cashier-test@example.invalid',email:'cashier-test@example.invalid',app_metadata:{role:'cashier'}}),null);checks++;
    await query('SELECT 1');
    process.stdout.write(JSON.stringify({passed:checks,isolatedDatabase:database,productionTouched:false})+'\n');
  } finally { await pool.end(); }
};
void main().then(()=>process.exit(0)).catch(error=>{ console.error(error);process.exit(1); });
