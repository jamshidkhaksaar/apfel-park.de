-- Additive pilot improvements: no financial history, stock, or permissions are rewritten.
SET LOCAL lock_timeout='10s';
SET LOCAL statement_timeout='90s';
CREATE INDEX IF NOT EXISTS ops_documents_pending_transfer_idx ON public.ops_documents(destination_id,created_at DESC,id DESC) WHERE kind='transfer' AND status='dispatched';
CREATE INDEX IF NOT EXISTS ops_documents_kind_time_idx ON public.ops_documents(kind,created_at DESC,id DESC);
CREATE INDEX IF NOT EXISTS ops_expenses_branch_date_idx ON public.ops_expenses(branch_id,incurred_on,category);
CREATE INDEX IF NOT EXISTS ops_expenses_order_fee_idx ON public.ops_expenses(order_id) WHERE category='payment_fee' AND net_cents IS NOT NULL;
CREATE INDEX IF NOT EXISTS ops_cost_batches_remaining_idx ON public.ops_cost_batches(inventory_id,branch_id,created_at,id) WHERE remaining>0;
CREATE INDEX IF NOT EXISTS ops_events_branch_id_idx ON public.ops_events(branch_id,id DESC);

-- Fill ONLY unambiguous variant-backed color/storage in empty opening records.
-- Do not infer serials, IMEIs, battery health, cost, or tax treatment.
WITH variants AS (
  SELECT i.id,jsonb_agg(v.value) AS matches FROM inventory_skus i JOIN products p ON p.id=i.product_id
  CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(p.variants)='array' THEN p.variants ELSE '[]' END) v(value)
  WHERE i.location='local' AND v.value->>'sku'=i.sku GROUP BY i.id
), exact AS (SELECT id,matches->0 AS value FROM variants WHERE jsonb_array_length(matches)=1)
UPDATE ops_assets a SET color=CASE WHEN a.color='' THEN coalesce(nullif(e.value->>'color',''),'') ELSE a.color END,
  storage=CASE WHEN a.storage='' THEN coalesce(nullif(e.value->>'storage',''),'') ELSE a.storage END,updated_at=now()
FROM exact e WHERE a.inventory_id=e.id AND a.state IN ('available','reserved') AND (a.color='' OR a.storage='');
