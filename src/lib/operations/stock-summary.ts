import type { TransactionClient } from '@/lib/db';
import type { StockSummary } from './types';

// Branch capacities share a single SKU buffer: they are not additive. Global
// availability subtracts that buffer once, after excluding held/inactive stock.
export const stockAvailabilitySql = `least(greatest(0,s.on_hand-s.reserved),greatest(0,
  (SELECT coalesce(sum(bs.on_hand-bs.reserved),0) FROM ops_balances bs JOIN ops_branches bb ON bb.id=bs.branch_id
    WHERE bs.inventory_id=i.id AND bb.active AND bb.code<>'transit')-i.safety_buffer))`;
export const readStockSummary = async (client: TransactionClient, branchId: string | null): Promise<StockSummary> => {
  const result = await client.query(`WITH eligible AS (
    SELECT i.id,i.safety_buffer,coalesce(sum(s.on_hand-s.reserved) FILTER(WHERE b.active AND b.code<>'transit'),0) AS free,
      coalesce(sum(s.on_hand-s.reserved) FILTER(WHERE s.branch_id=$1 AND b.active),0) AS branch_free,
      coalesce(sum(s.reserved) FILTER(WHERE b.active AND b.code<>'transit' AND ($1::uuid IS NULL OR b.id=$1)),0) AS reserved,
      max(s.minimum) FILTER(WHERE $1::uuid IS NULL OR b.id=$1) AS minimum
    FROM inventory_skus i JOIN products p ON p.id=i.product_id JOIN ops_balances s ON s.inventory_id=i.id JOIN ops_branches b ON b.id=s.branch_id
    WHERE i.location='local' AND i.is_active AND p.is_active GROUP BY i.id
  ), capacity AS (SELECT *,CASE WHEN $1::uuid IS NULL THEN greatest(0,free-safety_buffer)
    ELSE least(greatest(0,branch_free),greatest(0,free-safety_buffer)) END AS available FROM eligible)
  SELECT (SELECT coalesce(sum(s.on_hand),0) FROM ops_balances s JOIN ops_branches b ON b.id=s.branch_id
    WHERE b.code<>'transit' AND ($1::uuid IS NULL OR b.id=$1)) AS physical,
    (SELECT coalesce(sum(s.on_hand),0) FROM ops_balances s JOIN ops_branches b ON b.id=s.branch_id JOIN inventory_skus i ON i.id=s.inventory_id JOIN products p ON p.id=i.product_id
      WHERE b.code<>'transit' AND (NOT b.active OR NOT i.is_active OR NOT p.is_active) AND ($1::uuid IS NULL OR b.id=$1)) AS inactive,
    (SELECT coalesce(sum(s.on_hand),0) FROM ops_balances s JOIN ops_branches b ON b.id=s.branch_id WHERE b.code='transit' AND $1::uuid IS NULL) AS transit,
    coalesce(sum(available),0) AS available,coalesce(sum(reserved),0) AS reserved,
    count(*) FILTER(WHERE available>0 AND available<=minimum)::int AS low,count(*) FILTER(WHERE available=0)::int AS empty,
    (SELECT count(*) FROM ops_assets WHERE state IN ('available','reserved','inspection','transit') AND cost_gross_cents IS NULL AND ($1::uuid IS NULL OR branch_id=$1))+
    (SELECT coalesce(sum(remaining),0) FROM ops_cost_batches WHERE cost_gross_cents IS NULL AND ($1::uuid IS NULL OR branch_id=$1)) AS missing_costs,
    (SELECT count(*) FROM ops_assets WHERE state IN ('available','reserved') AND (color='' OR storage='') AND ($1::uuid IS NULL OR branch_id=$1)) AS missing_details,
    (SELECT coalesce(sum(cost_gross_cents),0) FROM ops_assets WHERE state IN ('available','reserved','inspection','transit') AND ($1::uuid IS NULL OR branch_id=$1))+
    (SELECT coalesce(sum(remaining*cost_gross_cents),0) FROM ops_cost_batches WHERE ($1::uuid IS NULL OR branch_id=$1)) AS stock_value
  FROM capacity`, [branchId]);
  const r=result.rows[0];
  return {physicalUnits:Number(r.physical),inactiveUnits:Number(r.inactive),transitUnits:Number(r.transit),availableUnits:Number(r.available),
    reservedUnits:Number(r.reserved),lowStock:Number(r.low),outOfStock:Number(r.empty),missingCosts:Number(r.missing_costs),
    missingDeviceDetails:Number(r.missing_details),stockValueCents:Number(r.stock_value)};
};
