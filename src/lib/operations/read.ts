import { query } from '@/lib/db';
import { assertOperationsBranch, requireOperationsOwner } from './access';
import { assetLabel, uuidPattern, type Asset, type Branch, type OperationsAccess, type Overview, type StockItem } from './types';

export const operationsBranches = async (access: OperationsAccess): Promise<Branch[]> => {
  const result = await query(`SELECT id,code,name,address,active FROM ops_branches WHERE code<>'transit'
    AND ($1::uuid IS NULL OR id=$1) ORDER BY code`, [access.owner ? null : access.branchId]);
  return result.rows as Branch[];
};
export const branchFilter = (access: OperationsAccess, input?: string | null): string | null => {
  const id = input && uuidPattern.test(input) ? input : null;
  if (input && !id) throw new Error('invalid_branch');
  if (id) assertOperationsBranch(access, id);
  return access.owner ? id : access.branchId;
};

export const readOperationsStock = async (access: OperationsAccess, branchId: string | null, search: string, page: number) => {
  const q = search.trim().slice(0, 80);
  const offset = (Math.max(1, Math.min(10000, page)) - 1) * 40;
  const filter = `WHERE i.location='local' AND b.code<>'transit' AND i.is_active=true
    AND ($1::uuid IS NULL OR b.id=$1) AND ($4::boolean OR (p.is_active AND b.active))
    AND ($2='' OR p.title ILIKE '%'||$2||'%' OR i.sku ILIKE '%'||$2||'%' OR p.gtin=$2
      OR EXISTS(SELECT 1 FROM ops_item_labels l WHERE l.inventory_id=i.id AND 'APS-'||lpad(l.label_number::text,8,'0')=upper($2))
      OR v.value->>'gtin'=$2 OR EXISTS(SELECT 1 FROM ops_assets a WHERE a.inventory_id=i.id AND a.branch_id=b.id
        AND 'APF-'||lpad(a.label_number::text,8,'0')=upper($2)))`;
  const [items, count] = await Promise.all([
    query(`SELECT i.id AS inventory_id,i.product_id,i.sku,p.title,p.category,p.condition,to_jsonb(p.images)->>0 AS image,
      round(coalesce(nullif(v.value->>'price','')::numeric,p.price)*100)::bigint AS price_cents,
      v.value->>'color' AS color,v.value->>'storage' AS storage,s.branch_id,b.name AS branch_name,s.on_hand,s.reserved,s.minimum,s.target,
      least(greatest(0,s.on_hand-s.reserved),available_inventory(i.on_hand,i.reserved,i.safety_buffer)) AS available
      ${access.owner ? `,(SELECT count(*) FROM ops_assets a WHERE a.inventory_id=i.id AND a.branch_id=b.id AND a.state IN ('available','reserved') AND a.cost_gross_cents IS NULL) AS missing_costs` : ''}
      FROM ops_balances s JOIN inventory_skus i ON i.id=s.inventory_id JOIN products p ON p.id=i.product_id
      JOIN ops_branches b ON b.id=s.branch_id
      LEFT JOIN LATERAL (SELECT value FROM jsonb_array_elements(CASE WHEN jsonb_typeof(p.variants)='array' THEN p.variants ELSE '[]' END)
        WHERE value->>'sku'=i.sku LIMIT 1) v ON true ${filter}
      ORDER BY CASE WHEN s.on_hand-s.reserved=0 THEN 1 ELSE 0 END,p.title,i.sku,b.code LIMIT 40 OFFSET $3`, [branchId,q,offset,access.owner]),
    query(`SELECT count(*)::int AS total FROM ops_balances s JOIN inventory_skus i ON i.id=s.inventory_id
      JOIN products p ON p.id=i.product_id JOIN ops_branches b ON b.id=s.branch_id
      LEFT JOIN LATERAL (SELECT value FROM jsonb_array_elements(CASE WHEN jsonb_typeof(p.variants)='array' THEN p.variants ELSE '[]' END)
      WHERE value->>'sku'=i.sku LIMIT 1) v ON true ${filter.replace('$4::boolean','$3::boolean')}`, [branchId,q,access.owner]),
  ]);
  return { total: Number(count.rows[0]?.total ?? 0), items: items.rows.map(r => ({
    inventoryId: String(r.inventory_id), productId: String(r.product_id), sku: String(r.sku),
    title: [String(r.title),r.color,r.storage].filter(Boolean).join(' · '),category: String(r.category),condition: String(r.condition),
    image: typeof r.image==='string' ? r.image : null,priceCents: Number(r.price_cents),
    branchId: String(r.branch_id),branchName: String(r.branch_name),onHand: Number(r.on_hand),reserved: Number(r.reserved),
    available: Number(r.available),minimum: Number(r.minimum),target: Number(r.target),
    ...(access.owner ? { missingCosts: Number(r.missing_costs) } : {}),
  })) as StockItem[] };
};

export const readOperationsAssets = async (access: OperationsAccess, branchId: string | null, search: string, page: number) => {
  const result = await query(`SELECT a.id,a.label_number,a.inventory_id,a.branch_id,a.state,a.color,a.storage,a.battery_health,p.title,i.sku
    ${access.owner ? ',a.cost_gross_cents,a.cost_net_cents,(a.serial_encrypted IS NOT NULL OR a.imei_encrypted IS NOT NULL) AS identifier_recorded' : ''}
    FROM ops_assets a JOIN inventory_skus i ON i.id=a.inventory_id JOIN products p ON p.id=i.product_id
    WHERE ($1::uuid IS NULL OR a.branch_id=$1) AND ($3::boolean OR (a.state='available' AND p.is_active AND i.is_active AND available_inventory(i.on_hand,i.reserved,i.safety_buffer)>0))
      AND ($2='' OR p.title ILIKE '%'||$2||'%' OR i.sku ILIKE '%'||$2||'%' OR 'APF-'||lpad(a.label_number::text,8,'0')=upper($2))
    ORDER BY a.label_number DESC LIMIT 40 OFFSET $4`, [branchId,search.trim().slice(0,80),access.owner,(page-1)*40]);
  return result.rows.map(r => ({ id: String(r.id),label: assetLabel(r.label_number),inventoryId: String(r.inventory_id),
    branchId: String(r.branch_id),title: String(r.title),sku: String(r.sku),state: String(r.state),color: String(r.color),
    storage: String(r.storage),batteryHealth: r.battery_health===null ? null : Number(r.battery_health),
    ...(access.owner ? { costGrossCents: r.cost_gross_cents===null ? null : Number(r.cost_gross_cents),
      costNetCents: r.cost_net_cents===null ? null : Number(r.cost_net_cents),identifierRecorded: Boolean(r.identifier_recorded) } : {}),
  })) as Asset[];
};

export const readOperationsDocuments = async (access: OperationsAccess, branchId: string | null) => {
  const result = await query(`SELECT id,number,kind,status,branch_id,destination_id,payload,created_at FROM ops_documents
    WHERE ($1::uuid IS NULL OR branch_id=$1 OR destination_id=$1) AND ($2::boolean OR (kind='training_sale' AND actor_id=$3))
    ORDER BY created_at DESC LIMIT 100`, [branchId,access.owner,access.userId]);
  return result.rows;
};

export const readOperationsSettings = async (access: OperationsAccess) => {
  const result = await query("SELECT value FROM store_settings WHERE key='operations_settings'");
  const value = result.rows[0]?.value ?? {};
  const [members, users] = access.owner ? await Promise.all([
    query('SELECT m.user_id,m.role,m.branch_id,m.active,u.email FROM ops_members m JOIN users u ON u.id=m.user_id ORDER BY u.email'),
    query('SELECT id,email,role FROM users WHERE is_active=true ORDER BY email'),
  ]) : [{ rows: [] },{ rows: [] }];
  return { liveTillEnabled: false, fiscalReady: false, taxRulesConfirmed: value.taxRulesConfirmed===true,
    identifierStorageReady: /^[a-f0-9]{64}$/i.test(process.env.OPS_ASSET_ENCRYPTION_KEY ?? ''),members: members.rows,users: users.rows };
};

export const readOperationsOrders = async (access:OperationsAccess) => {
  requireOperationsOwner(access);
  return (await query("SELECT id,order_number,total_amount,payment_status FROM orders WHERE paid_at IS NOT NULL ORDER BY paid_at DESC LIMIT 100")).rows;
};

export const reportDates = (from: string, to: string): { from: string; to: string } => {
  const valid = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && Number.isFinite(Date.parse(`${s}T12:00:00Z`)) && new Date(`${s}T12:00:00Z`).toISOString().startsWith(s);
  if (!valid(from) || !valid(to) || to<from || Date.parse(to)-Date.parse(from)>366*86400000) throw new Error('invalid_dates');
  return { from,to };
};

export const readOperationsOverview = async (access: OperationsAccess, branchId: string | null, from: string, to: string): Promise<Overview> => {
  requireOperationsOwner(access); reportDates(from,to);
  const [stock, assets, orders, expenses, purchases, batches, shopMovements] = await Promise.all([
    query(`SELECT coalesce(sum(s.on_hand-s.reserved),0) AS units,coalesce(sum(s.reserved),0) AS reserved,
      count(*) FILTER(WHERE s.on_hand-s.reserved BETWEEN 1 AND s.minimum)::int AS low,
      count(*) FILTER(WHERE s.on_hand-s.reserved=0)::int AS empty FROM ops_balances s
      JOIN ops_branches b ON b.id=s.branch_id JOIN inventory_skus i ON i.id=s.inventory_id
      WHERE b.code<>'transit' AND i.is_active AND ($1::uuid IS NULL OR s.branch_id=$1)`, [branchId]),
    query(`SELECT count(*) FILTER(WHERE cost_gross_cents IS NULL)::int AS missing,
      coalesce(sum(cost_gross_cents),0)::bigint AS value FROM ops_assets WHERE state IN ('available','reserved','transit','inspection') AND ($1::uuid IS NULL OR branch_id=$1)`, [branchId]),
    query(`SELECT o.id,o.total_amount,o.subtotal_amount,o.shipping_amount,o.vat_amount,o.payment_status,o.items,
      EXISTS(SELECT 1 FROM ops_expenses f WHERE f.order_id=o.id AND f.category='payment_fee' AND f.net_cents IS NOT NULL) AS fees_recorded,
      coalesce((SELECT jsonb_agg(jsonb_build_object('sku',i.sku,'branchId',c.branch_id,'quantity',c.quantity,'cost',c.gross_cents,'netCost',c.net_cents,'known',c.known_units,'netKnown',c.net_known_units))
        FROM ops_cost_events c JOIN inventory_adjustments e ON e.id=c.event_id JOIN inventory_skus i ON i.id=e.inventory_sku_id
        WHERE e.reference_type='checkout_order' AND e.reference_id=o.id::text AND e.event_type='sale'),'[]') AS allocations
      FROM orders o WHERE o.paid_at IS NOT NULL AND (o.paid_at AT TIME ZONE 'Europe/Berlin')::date BETWEEN $1::date AND $2::date
      AND o.payment_status IN ('paid','refunded','partially_refunded') ORDER BY o.paid_at LIMIT 5001`, [from,to]),
    query(`SELECT category,coalesce(sum(gross_cents),0)::bigint AS gross,coalesce(sum(net_cents),0)::bigint AS net,
      coalesce(sum(input_vat_cents),0)::bigint AS vat,count(*) FILTER(WHERE net_cents IS NULL)::int AS incomplete FROM ops_expenses
      WHERE incurred_on BETWEEN $1::date AND $2::date AND ($3::uuid IS NULL OR branch_id=$3) GROUP BY category`, [from,to,branchId]),
    query(`SELECT payload FROM ops_documents WHERE kind='purchase' AND (created_at AT TIME ZONE 'Europe/Berlin')::date BETWEEN $1::date AND $2::date
      AND ($3::uuid IS NULL OR branch_id=$3)`, [from,to,branchId]),
    query(`SELECT coalesce(sum(remaining*cost_gross_cents),0)::bigint AS value,coalesce(sum(remaining) FILTER(WHERE cost_gross_cents IS NULL),0)::int AS missing
      FROM ops_cost_batches WHERE ($1::uuid IS NULL OR branch_id=$1)`, [branchId]),
    query(`SELECT coalesce(sum(c.quantity),0)::int AS units FROM ops_cost_events c JOIN inventory_adjustments e ON e.id=c.event_id
      WHERE e.metadata->>'adjustmentType'='shop_sale' AND (e.created_at AT TIME ZONE 'Europe/Berlin')::date BETWEEN $1::date AND $2::date
      AND ($3::uuid IS NULL OR c.branch_id=$3)`, [from,to,branchId]),
  ]);
  const main = (await query("SELECT id FROM ops_branches WHERE code='main'")).rows[0]?.id;
  const overview: Overview = { units: Number(stock.rows[0].units),reserved: Number(stock.rows[0].reserved),lowStock: Number(stock.rows[0].low),
    outOfStock: Number(stock.rows[0].empty),missingCosts: Number(assets.rows[0].missing)+Number(batches.rows[0].missing),
    capturedCents: 0,refundedCents: 0,revenueCents: 0,shippingIncomeCents: 0,shippingExpenseCents: 0,feesCents: 0,overheadCents: 0,purchasesCents: 0,
    unitsSold: 0,orders: 0,partialRefundsUnknown: 0,knownCostCents: 0,costUnits: 0,
    stockValueCents: Number(assets.rows[0].value)+Number(batches.rows[0].value),contributionCents: null,outputVatCents: 0,inputVatCents: 0,
    taxEstimateCents: null,incompleteExpenses: 0,windowStart: from,windowEnd: to,historicalCostGap: false,
    missingPaymentFees:0,unpricedShopUnits:Number(shopMovements.rows[0].units) };
  for (const order of orders.rows) {
    const lines = Array.isArray(order.items) ? order.items as Array<Record<string,unknown>> : [];
    const allocations = order.allocations as Array<{sku:string;branchId:string;quantity:number;cost:number;netCost:number;known:number;netKnown:number}>;
    let share=branchId ? 0 : 1;
    if (branchId) {
      if (!allocations.length) share=branchId===main ? 1 : 0;
      else {
        let assigned=0;
        for (const line of lines) {
          const quantity=Number(line.quantity ?? 0);
          const assignedQty=allocations.filter(a=>a.sku===line.sku && a.branchId===branchId).reduce((sum,a)=>sum+Number(a.quantity),0);
          if (quantity>0) assigned+=Number(line.lineAmount ?? 0)*assignedQty/quantity;
        }
        share=Number(order.subtotal_amount)>0 ? assigned/Number(order.subtotal_amount) : 0;
      }
    }
    if (!share) continue;
    const gross=Math.round(Number(order.total_amount)*100*share);
    overview.capturedCents+=gross;overview.orders+=1;
    if (order.payment_status==='refunded') { overview.refundedCents+=gross;continue; }
    if (!order.fees_recorded) overview.missingPaymentFees+=1;
    if (order.payment_status==='partially_refunded') overview.partialRefundsUnknown+=1;
    overview.outputVatCents+=Math.round(Number(order.vat_amount)*100*share);
    overview.shippingIncomeCents+=Math.round(Number(order.shipping_amount)*100*share);
    const relevant=allocations.filter(a=>!branchId || a.branchId===branchId);
    overview.unitsSold+=allocations.length ? relevant.reduce((sum,a)=>sum+Number(a.quantity),0) : lines.reduce((sum,l)=>sum+Number(l.quantity ?? 0),0);
    overview.knownCostCents+=relevant.reduce((sum,a)=>sum+Number(a.netCost),0);
    overview.costUnits+=relevant.reduce((sum,a)=>sum+Number(a.netKnown),0);
  }
  for (const expense of expenses.rows) {
    overview.incompleteExpenses+=Number(expense.incomplete);overview.inputVatCents+=Number(expense.vat);
    if (expense.category==='shipping' || expense.category==='return_shipping') overview.shippingExpenseCents+=Number(expense.net);
    else if (expense.category==='payment_fee') overview.feesCents+=Number(expense.net);
    else overview.overheadCents+=Number(expense.net);
  }
  for (const doc of purchases.rows) {
    overview.purchasesCents+=Number(doc.payload.totalGrossCents ?? 0);
    overview.inputVatCents+=Number(doc.payload.inputVatCents ?? 0);
  }
  overview.revenueCents=overview.capturedCents-overview.refundedCents;
  overview.historicalCostGap=overview.costUnits<overview.unitsSold || orders.rows.length>5000 || overview.refundedCents>0;
  const taxRules=(await query("SELECT value->>'taxRulesConfirmed' AS confirmed FROM store_settings WHERE key='operations_settings'")).rows[0]?.confirmed==='true';
  if (taxRules && !overview.historicalCostGap && !overview.partialRefundsUnknown && !overview.incompleteExpenses && !overview.missingPaymentFees && !overview.unpricedShopUnits)
    overview.contributionCents=overview.revenueCents-overview.outputVatCents-overview.knownCostCents-overview.shippingExpenseCents-overview.feesCents-overview.overheadCents;
  // A full VAT position is unavailable until the owner's tax rules and input evidence are confirmed.
  return overview;
};
