import assert from 'node:assert/strict';
import { mkdir,readFile,writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { Pool } from 'pg';
let stage='setup';

const main=async()=>{
  const original=new URL(process.env.DATABASE_URL ?? '');
  assert(['localhost','127.0.0.1','[::1]'].includes(original.hostname));
  const role=decodeURIComponent(original.username);const liveDatabase=decodeURIComponent(original.pathname.slice(1));
  assert(/^[A-Za-z_][A-Za-z0-9_]*$/.test(role));assert(/^[A-Za-z_][A-Za-z0-9_]*$/.test(liveDatabase));
  const backupRoot='/srv/backups/apfel-park-operations';await mkdir(backupRoot,{recursive:true,mode:0o700});
  stage='backup';
  const dump=spawnSync('sudo',['-u','postgres','pg_dump','--format=custom',`--dbname=${liveDatabase}`],{maxBuffer:512*1024*1024});
  assert.equal(dump.status,0,'Production read-only backup failed');
  const backup=`${backupRoot}/pre-operations-${Date.now()}.dump`;await writeFile(backup,dump.stdout,{mode:0o600});
  const database=`apfel_ops_rehearsal_${Date.now()}`;
  stage='create';
  const create=spawnSync('sudo',['-u','postgres','createdb',`--owner=${role}`,database]);assert.equal(create.status,0);
  stage='restore';
  const restore=spawnSync('sudo',['-u','postgres','pg_restore','--clean','--if-exists',`--dbname=${database}`,'--exit-on-error'],{input:dump.stdout,maxBuffer:4*1024*1024});
  assert.equal(restore.status,0,'Private rehearsal restore failed');
  const migration=await readFile('supabase/migrations/20261006_operations_pilot.sql','utf8');
  stage='migration';
  const apply=spawnSync('sudo',['-u','postgres','env',`PGOPTIONS=-c apfel.runtime_role=${role}`,'psql','--no-psqlrc',`--dbname=${database}`,'--set=ON_ERROR_STOP=1','--single-transaction','--file=-'],{input:migration,maxBuffer:4*1024*1024});
  assert.equal(apply.status,0,'Rehearsal migration failed');
  original.pathname=`/${database}`;process.env.DATABASE_URL=original.toString();
  const pool=new Pool({connectionString:original.toString()});
  stage='balance-verification';
  const mismatch=(await pool.query(`SELECT count(*)::int AS count FROM inventory_skus i LEFT JOIN (
    SELECT inventory_id,sum(on_hand) AS on_hand,sum(reserved) AS reserved FROM ops_balances GROUP BY inventory_id
  ) b ON b.inventory_id=i.id WHERE i.location='local' AND (i.on_hand<>coalesce(b.on_hand,0) OR i.reserved<>coalesce(b.reserved,0))`)).rows[0].count;
  assert.equal(mismatch,0);
  const totals=(await pool.query("SELECT coalesce(sum(on_hand),0)::int AS on_hand,coalesce(sum(reserved),0)::int AS reserved FROM inventory_skus WHERE location='local'")).rows[0];
  const user=(await pool.query("SELECT id,email FROM users WHERE role='admin' AND is_active LIMIT 1")).rows[0];assert(user);
  const access={userId:String(user.id),email:String(user.email),owner:true,branchId:null};
  const {readOperationsStock,readOperationsAssets,readOperationsOverview}=await import('../../src/lib/operations/read');
  stage='stock-read';
  const stock=await readOperationsStock(access,null,'',1);const assets=await readOperationsAssets(access,null,'',1);
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  stage='report-read';await readOperationsOverview(access,null,today.slice(0,7)+'-01',today);
  await pool.end();
  process.stdout.write(JSON.stringify({rehearsalDatabase:database,backup,branchMismatches:mismatch,ledgerTotals:totals,stockRowsValidated:stock.items.length,assetRowsValidated:assets.length,productionWrites:false})+'\n');
};
void main().then(()=>process.exit(0)).catch(error=>{console.error(JSON.stringify({rehearsalFailedAt:stage,sqlstate:typeof error?.code==='string' && /^[0-9A-Z]{5}$/.test(error.code) ? error.code:null,
  schemaError:error?.code==='42883' ? error.message : null,productionWrites:false}));process.exit(1);});
