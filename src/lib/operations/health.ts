import { query, type TransactionClient } from '@/lib/db';
import { requireOperationsOwner } from './access';
import type { OperationsAccess } from './types';

export const inspectOperationsConsistency = async (client?: TransactionClient) => {
  const run=client ? client.query.bind(client) : query;
  const result=await run(`SELECT
    (SELECT count(*)::int FROM inventory_skus i LEFT JOIN (SELECT inventory_id,sum(on_hand) AS stock,sum(reserved) AS reserved FROM ops_balances GROUP BY inventory_id) b ON b.inventory_id=i.id
      WHERE i.location='local' AND (i.on_hand<>coalesce(b.stock,0) OR i.reserved<>coalesce(b.reserved,0))) AS branch_mismatches,
    (SELECT count(*)::int FROM ops_balances b JOIN inventory_skus i ON i.id=b.inventory_id JOIN products p ON p.id=i.product_id
      WHERE i.location='local' AND lower(p.category) IN ('smartphones','tablets') AND b.on_hand<>(SELECT count(*) FROM ops_assets a WHERE a.inventory_id=b.inventory_id AND a.branch_id=b.branch_id AND a.state IN ('available','reserved','inspection','faulty','transit'))) AS asset_mismatches`);
  return {checkedAt:new Date().toISOString(),branchMismatches:Number(result.rows[0].branch_mismatches),assetMismatches:Number(result.rows[0].asset_mismatches)};
};
export const recordOperationsHealth = async () => {
  const health=await inspectOperationsConsistency();
  await query(`INSERT INTO store_settings(key,value,updated_at) VALUES('operations_health',$1::jsonb,now())
    ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=now()`,[JSON.stringify(health)]);
  if(health.branchMismatches || health.assetMismatches) console.error('[operations-health] consistency_warning',JSON.stringify(health));
  return health;
};
export const readOperationsHealth = async (access:OperationsAccess) => {
  requireOperationsOwner(access);
  const [current,last]=await Promise.all([inspectOperationsConsistency(),query("SELECT value FROM store_settings WHERE key='operations_health'")]);
  return {...current,lastWorkerCheck:last.rows[0]?.value ?? null,liveTillEnabled:false};
};
