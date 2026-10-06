import type { TransactionClient } from '@/lib/db';
import { requireOperationsOwner } from './access';
import { readSnapshot } from './snapshot';
import { readStockSummary } from './stock-summary';
import type { OperationsAccess, OperationsReport, OperationsOverview, Overview, StockSummary, ListOptions } from './types';

export const berlinDay = (): string => new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export const validateReportDates=(from:string,to:string) => {
  const valid=(s:string)=>/^\d{4}-\d{2}-\d{2}$/.test(s) && Number.isFinite(Date.parse(s+'T12:00:00Z')) && new Date(s+'T12:00:00Z').toISOString().startsWith(s);
  if(!valid(from) || !valid(to) || to<from || Date.parse(to)-Date.parse(from)>366*86400000) throw new Error('invalid_dates');
  return {from,to};
};
export const previousReportDates=(from:string,to:string) => {
  validateReportDates(from,to);
  const length=(Date.parse(to)-Date.parse(from))/86400000+1;
  const end=new Date(from+'T12:00:00Z');end.setUTCDate(end.getUTCDate()-1);
  const start=new Date(end);start.setUTCDate(start.getUTCDate()-length+1);
  return {from:start.toISOString().slice(0,10),to:end.toISOString().slice(0,10)};
};

// All money is aggregated in SQL; detail pagination never limits summary totals.
// Existing checkout uses a single fulfilment branch. Missing/mixed allocations
// remain unassigned rather than inventing historic shop attribution.
export const orderFactsSql=`WITH facts AS (
  SELECT o.id,o.order_number,o.payment_status,o.paid_at,o.items,coalesce(o.shipping_method,'unknown') AS shipping_method,
    round(o.total_amount*100)::bigint AS gross,round(o.shipping_amount*100)::bigint AS shipping,round(o.vat_amount*100)::bigint AS vat,
    coalesce(lines.units,0) AS units,coalesce(cost.units,0) AS cost_units,coalesce(cost.net_known,0) AS net_known,
    coalesce(cost.net_cost,0) AS net_cost,
    CASE WHEN cost.branch_count=1 AND cost.units=lines.units THEN cost.branch_id ELSE NULL END AS fulfilment_branch,
    EXISTS(SELECT 1 FROM ops_expenses e WHERE e.order_id=o.id AND e.category='payment_fee' AND e.net_cents IS NOT NULL) AS fee_recorded,
    EXISTS(SELECT 1 FROM ops_expenses e WHERE e.order_id=o.id AND e.category='shipping' AND e.net_cents IS NOT NULL) AS shipping_cost_recorded
  FROM orders o
  LEFT JOIN LATERAL (SELECT sum((x->>'quantity')::integer)::bigint AS units
    FROM jsonb_array_elements(CASE WHEN jsonb_typeof(o.items)='array' THEN o.items ELSE '[]' END) x) lines ON true
  LEFT JOIN LATERAL (SELECT sum(c.quantity)::bigint AS units,sum(c.net_known_units)::bigint AS net_known,sum(c.net_cents)::bigint AS net_cost,
    count(DISTINCT c.branch_id) AS branch_count,min(c.branch_id::text)::uuid AS branch_id
    FROM ops_cost_events c JOIN inventory_adjustments a ON a.id=c.event_id
    WHERE a.reference_type='checkout_order' AND a.reference_id=o.id::text AND a.event_type='sale') cost ON true
  WHERE o.paid_at IS NOT NULL AND (o.paid_at AT TIME ZONE 'Europe/Berlin')::date BETWEEN $2::date AND $3::date
    AND o.payment_status IN ('paid','refunded','partially_refunded')
), scoped AS (SELECT * FROM facts WHERE $1::uuid IS NULL OR fulfilment_branch=$1)`;

const readPeriod=async (client:TransactionClient,branchId:string|null,from:string,to:string,stock:StockSummary,asOf:string):Promise<Overview> => {
  const orders=(await client.query(`${orderFactsSql} SELECT count(*)::int AS orders,coalesce(sum(gross),0)::bigint AS captured,
    coalesce(sum(gross) FILTER(WHERE payment_status='refunded'),0)::bigint AS refunded,
    count(*) FILTER(WHERE payment_status='partially_refunded')::int AS partial,
    count(*) FILTER(WHERE fulfilment_branch IS NULL)::int AS unassigned,
    count(*) FILTER(WHERE payment_status<>'refunded' AND NOT fee_recorded)::int AS missing_fees,
    count(*) FILTER(WHERE shipping_method<>'pickup' AND NOT shipping_cost_recorded)::int AS missing_shipping,
    coalesce(sum(shipping) FILTER(WHERE payment_status<>'refunded'),0)::bigint AS shipping,
    coalesce(sum(vat) FILTER(WHERE payment_status<>'refunded'),0)::bigint AS vat,
    coalesce(sum(units) FILTER(WHERE payment_status<>'refunded'),0)::bigint AS units,
    coalesce(sum(net_known) FILTER(WHERE payment_status<>'refunded'),0)::bigint AS known_units,
    coalesce(sum(net_cost) FILTER(WHERE payment_status<>'refunded'),0)::bigint AS cost FROM scoped`,[branchId,from,to])).rows[0];
  const expenses=(await client.query(`SELECT category,coalesce(sum(net_cents),0)::bigint AS net,coalesce(sum(input_vat_cents),0)::bigint AS vat,
    count(*) FILTER(WHERE net_cents IS NULL)::int AS incomplete FROM ops_expenses WHERE incurred_on BETWEEN $2::date AND $3::date
    AND ($1::uuid IS NULL OR branch_id=$1) GROUP BY category`,[branchId,from,to])).rows;
  const purchases=(await client.query(`SELECT coalesce(sum((payload->>'totalGrossCents')::bigint),0)::bigint AS gross,
    coalesce(sum((payload->>'inputVatCents')::bigint),0)::bigint AS vat FROM ops_documents WHERE kind='purchase'
    AND (created_at AT TIME ZONE 'Europe/Berlin')::date BETWEEN $2::date AND $3::date AND ($1::uuid IS NULL OR branch_id=$1)`,[branchId,from,to])).rows[0];
  const shop=(await client.query(`SELECT coalesce(sum(c.quantity),0)::int AS units FROM ops_cost_events c JOIN inventory_adjustments a ON a.id=c.event_id
    WHERE a.metadata->>'adjustmentType'='shop_sale' AND (a.created_at AT TIME ZONE 'Europe/Berlin')::date BETWEEN $2::date AND $3::date
    AND ($1::uuid IS NULL OR c.branch_id=$1)`,[branchId,from,to])).rows[0];
  const taxRules=(await client.query("SELECT value->>'taxRulesConfirmed' AS confirmed FROM store_settings WHERE key='operations_settings'")).rows[0]?.confirmed==='true';
  const sumExpense=(categories:string[])=>expenses.filter(e=>categories.includes(e.category)).reduce((n,e)=>n+Number(e.net),0);
  const incomplete=(categories:string[])=>expenses.some(e=>categories.includes(e.category) && Number(e.incomplete)>0);
  const shippingCategories=['shipping','return_shipping'];const overheadCategories=['rent','salary','other','write_off'];
  const partial=Number(orders.partial);const missingFees=Number(orders.missing_fees);const units=Number(orders.units);const known=Number(orders.known_units);
  const incompleteExpenses=expenses.reduce((n,e)=>n+Number(e.incomplete),0);const refunded=Number(orders.refunded);
  const missingShipping=Number(orders.missing_shipping);
  const reasons=[...(known<units ? ['purchase_costs']:[]),...(partial ? ['partial_refunds']:[]),...(missingFees ? ['payment_fees']:[]),...(missingShipping ? ['shipping_costs']:[]),
    ...(incompleteExpenses ? ['expense_net_missing']:[]),...(Number(shop.units) ? ['historic_shop_sales']:[]),...(!taxRules ? ['tax_rules_unconfirmed']:[]),
    ...(refunded ? ['refund_cost_basis']:[]),...(Number(orders.unassigned) ? ['branch_attribution']:[])];
  const revenue=partial ? null : Number(orders.captured)-refunded;
  const shipping=missingShipping || incomplete(shippingCategories) ? null : sumExpense(shippingCategories);
  const fees=missingFees || incomplete(['payment_fee']) ? null : sumExpense(['payment_fee']);
  const overhead=incomplete(overheadCategories) ? null : sumExpense(overheadCategories);
  const contribution=revenue!==null && shipping!==null && fees!==null && overhead!==null && known===units && !refunded && !Number(shop.units) && taxRules
    ? revenue-Number(orders.vat)-Number(orders.cost)-shipping-fees-overhead : null;
  return {asOf,units:stock.availableUnits,reserved:stock.reservedUnits,lowStock:stock.lowStock,outOfStock:stock.outOfStock,missingCosts:stock.missingCosts,
    capturedCents:Number(orders.captured),refundedCents:refunded,revenueCents:revenue,shippingIncomeCents:Number(orders.shipping),shippingExpenseCents:shipping,
    feesCents:fees,overheadCents:overhead,purchasesCents:Number(purchases.gross),unitsSold:units,orders:Number(orders.orders),partialRefundsUnknown:partial,
    knownCostCents:Number(orders.cost),costUnits:known,stockValueCents:stock.stockValueCents,contributionCents:contribution,outputVatCents:Number(orders.vat),
    inputVatCents:Number(purchases.vat)+expenses.reduce((n,e)=>n+Number(e.vat),0),taxEstimateCents:null,incompleteExpenses,windowStart:from,windowEnd:to,
    historicalCostGap:known<units || refunded>0,missingPaymentFees:missingFees,missingShippingCosts:missingShipping,unpricedShopUnits:Number(shop.units),completenessReasons:reasons,unassignedOrders:Number(orders.unassigned)};
};

export const readOperationsReport=async(access:OperationsAccess,branchId:string|null,from:string,to:string):Promise<OperationsReport> => {
  requireOperationsOwner(access);validateReportDates(from,to);const previousDates=previousReportDates(from,to);
  return readSnapshot(async client=>{
    const asOf=(await client.query('SELECT transaction_timestamp() AS at')).rows[0].at.toISOString();
    const currentStock=await readStockSummary(client,branchId);
    const summary=await readPeriod(client,branchId,from,to,currentStock,asOf);
    const previous=await readPeriod(client,branchId,previousDates.from,previousDates.to,currentStock,asOf);
    return {asOf,currentStock,summary,previous,attribution:{knownOrders:summary.orders-summary.unassignedOrders,unassignedOrders:summary.unassignedOrders},refundBasis:'selected_sales_cohort',shopRevenueAvailable:false};
  });
};
export const readOperationsDashboard=async(access:OperationsAccess,branchId:string|null):Promise<OperationsOverview> => {
  requireOperationsOwner(access);
  return readSnapshot(async client=>{
    const asOf=(await client.query('SELECT transaction_timestamp() AS at')).rows[0].at.toISOString();
    const stock=await readStockSummary(client,branchId);const day=berlinDay();const today=await readPeriod(client,branchId,day,day,stock,asOf);
    const pendingTransfers=Number((await client.query(`SELECT count(*)::int AS count FROM ops_documents WHERE kind='transfer' AND status='dispatched'
      AND ($1::uuid IS NULL OR branch_id=$1 OR destination_id=$1)`,[branchId])).rows[0].count);
    return {asOf,stock,today,pendingTransfers};
  });
};
export const readOrderPage=async(access:OperationsAccess,branchId:string|null,options:ListOptions={}) => {
  requireOperationsOwner(access);const today=berlinDay();const from=options.from || today.slice(0,7)+'-01';const to=options.to || today;validateReportDates(from,to);
  const page=Math.max(1,Math.min(10000,options.page ?? 1));const search=(options.q ?? '').trim().slice(0,80);
  return readSnapshot(async client=>{
    const params=[branchId,from,to,search];const filter="WHERE ($4='' OR order_number::text ILIKE '%'||$4||'%')";
    const total=Number((await client.query(`${orderFactsSql} SELECT count(*)::int AS count FROM scoped ${filter}`,params)).rows[0].count);
    const items=(await client.query(`${orderFactsSql} SELECT id,order_number,payment_status,paid_at,gross AS total_cents,
      fulfilment_branch,CASE WHEN fulfilment_branch IS NULL THEN 'unassigned' ELSE 'recorded' END AS attribution FROM scoped ${filter}
      ORDER BY paid_at DESC,id DESC LIMIT 40 OFFSET $5`,[...params,(page-1)*40])).rows;
    return {items,orders:items.map(item=>({...item,total_amount:String(Number(item.total_cents)/100)})),total,page,asOf:new Date().toISOString()};
  });
};
export const readOrderExport=async(access:OperationsAccess,branchId:string|null,from:string,to:string) => {
  requireOperationsOwner(access);validateReportDates(from,to);
  return readSnapshot(async client=>(await client.query(`${orderFactsSql} SELECT order_number,paid_at,payment_status,gross AS total_cents,
    CASE WHEN fulfilment_branch IS NULL THEN 'unassigned' ELSE 'recorded' END AS attribution FROM scoped ORDER BY paid_at DESC,id DESC`,[branchId,from,to])).rows);
};
