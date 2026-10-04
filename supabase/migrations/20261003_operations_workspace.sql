-- Branch allocation extends, rather than replaces, the existing inventory ledger.
-- inventory_skus(location='local') remains the aggregate used by checkout/feeds.
-- Every ledger event partitions the same units into branches in the same transaction.
SET LOCAL lock_timeout='10s';
SET LOCAL statement_timeout='90s';
LOCK TABLE public.orders,public.inventory_skus,public.inventory_adjustments IN SHARE ROW EXCLUSIVE MODE;
CREATE TABLE public.ops_branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code text NOT NULL UNIQUE,
  name text NOT NULL, address text NOT NULL DEFAULT '', active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.ops_branches(code,name,address) VALUES
 ('main','Hamburg-Wilhelmsburg','Wilhelm-Strauß-Weg 2b, 21109 Hamburg');
INSERT INTO public.ops_branches(code,name,active) VALUES('transit','Unterwegs',false);
CREATE TABLE public.ops_members (
  user_id uuid PRIMARY KEY, role text NOT NULL CHECK(role IN ('owner','cashier')),
  branch_id uuid REFERENCES public.ops_branches(id), active boolean NOT NULL DEFAULT true,
  CHECK(role='owner' OR branch_id IS NOT NULL)
);
CREATE TABLE public.ops_balances (
  inventory_id uuid NOT NULL REFERENCES public.inventory_skus(id),
  branch_id uuid NOT NULL REFERENCES public.ops_branches(id),
  on_hand integer NOT NULL DEFAULT 0 CHECK(on_hand>=0),
  reserved integer NOT NULL DEFAULT 0 CHECK(reserved>=0 AND reserved<=on_hand),
  minimum integer NOT NULL DEFAULT 2 CHECK(minimum>=0), target integer NOT NULL DEFAULT 5 CHECK(target>=minimum),
  updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(inventory_id,branch_id)
);
INSERT INTO public.ops_balances(inventory_id,branch_id,on_hand,reserved)
 SELECT i.id,b.id,i.on_hand,i.reserved FROM public.inventory_skus i CROSS JOIN public.ops_branches b
 WHERE i.location='local' AND b.code='main';
CREATE TABLE public.ops_item_labels (
  inventory_id uuid PRIMARY KEY REFERENCES public.inventory_skus(id),label_number bigint GENERATED ALWAYS AS IDENTITY UNIQUE
);
INSERT INTO public.ops_item_labels(inventory_id) SELECT id FROM public.inventory_skus WHERE location='local';
CREATE TABLE public.ops_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), label_number bigint GENERATED ALWAYS AS IDENTITY UNIQUE,
  inventory_id uuid NOT NULL REFERENCES public.inventory_skus(id), branch_id uuid NOT NULL REFERENCES public.ops_branches(id),
  state text NOT NULL DEFAULT 'available' CHECK(state IN ('available','reserved','sold','inspection','faulty','transit','written_off')),
  reservation_type text, reservation_id text,
  serial_encrypted text, imei_encrypted text, identifier_hash text UNIQUE,serial_hash text UNIQUE,imei_hash text UNIQUE,
  color text NOT NULL DEFAULT '', storage text NOT NULL DEFAULT '', battery_health integer CHECK(battery_health BETWEEN 0 AND 100),
  cost_gross_cents bigint CHECK(cost_gross_cents>=0), cost_net_cents bigint CHECK(cost_net_cents>=0),
  tax_mode text NOT NULL DEFAULT 'standard' CHECK(tax_mode IN ('standard','margin','exempt')),
  tax_evidence text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ops_assets_stock_idx ON public.ops_assets(inventory_id,branch_id,state);
INSERT INTO public.ops_assets(inventory_id,branch_id,state)
 SELECT i.id,b.id,CASE WHEN n<=i.reserved THEN 'reserved' ELSE 'available' END
 FROM public.inventory_skus i JOIN public.products p ON p.id=i.product_id
 CROSS JOIN public.ops_branches b CROSS JOIN LATERAL generate_series(1,i.on_hand) n
 WHERE i.location='local' AND b.code='main' AND lower(p.category) IN ('smartphones','tablets');
CREATE TABLE public.ops_allocations (
  inventory_id uuid NOT NULL REFERENCES public.inventory_skus(id), branch_id uuid NOT NULL REFERENCES public.ops_branches(id),
  reference_type text NOT NULL, reference_id text NOT NULL, quantity integer NOT NULL CHECK(quantity>0),
  PRIMARY KEY(inventory_id,branch_id,reference_type,reference_id)
);
CREATE TABLE public.ops_cost_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), inventory_id uuid NOT NULL REFERENCES public.inventory_skus(id),
  branch_id uuid NOT NULL REFERENCES public.ops_branches(id), remaining integer NOT NULL CHECK(remaining>=0),
  cost_gross_cents bigint CHECK(cost_gross_cents>=0), cost_net_cents bigint CHECK(cost_net_cents>=0),
  reference_id text, created_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.ops_cost_batches(inventory_id,branch_id,remaining)
 SELECT s.inventory_id,s.branch_id,s.on_hand FROM public.ops_balances s
 JOIN public.inventory_skus i ON i.id=s.inventory_id JOIN public.products p ON p.id=i.product_id
 WHERE lower(p.category) NOT IN ('smartphones','tablets') AND s.on_hand>0;
CREATE TABLE public.ops_cost_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.inventory_adjustments(id), branch_id uuid NOT NULL REFERENCES public.ops_branches(id),
  quantity integer NOT NULL, known_units integer NOT NULL, gross_cents bigint NOT NULL DEFAULT 0,
  net_cents bigint NOT NULL DEFAULT 0, net_known_units integer NOT NULL DEFAULT 0,
  UNIQUE(event_id,branch_id)
);
CREATE TABLE public.ops_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), number bigint GENERATED ALWAYS AS IDENTITY UNIQUE,
  kind text NOT NULL CHECK(kind IN ('purchase','transfer','training_sale','expense','cash_close','refund_request','asset_update','threshold','branch_setup','membership')),
  branch_id uuid NOT NULL REFERENCES public.ops_branches(id), destination_id uuid REFERENCES public.ops_branches(id),
  status text NOT NULL DEFAULT 'recorded', payload jsonb NOT NULL,
  actor_id uuid NOT NULL, idempotency_key text NOT NULL UNIQUE, request_hash text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ops_documents_branch_time_idx ON public.ops_documents(branch_id,created_at DESC);
CREATE TABLE public.ops_audit (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, actor_id uuid, action text NOT NULL,
  branch_id uuid, reference_id text, detail jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.ops_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), branch_id uuid REFERENCES public.ops_branches(id),
  order_id uuid REFERENCES public.orders(id), category text NOT NULL CHECK(category IN ('shipping','return_shipping','payment_fee','rent','salary','other','write_off')),
  gross_cents bigint NOT NULL CHECK(gross_cents>=0), net_cents bigint CHECK(net_cents>=0), input_vat_cents bigint CHECK(input_vat_cents>=0),
  note text NOT NULL, incurred_on date NOT NULL, actor_id uuid NOT NULL, idempotency_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.ops_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, kind text NOT NULL, branch_id uuid, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ops_events_time_idx ON public.ops_events(created_at);

-- Cost assignment is append-only. Unknown opening costs are never treated as free stock.
CREATE OR REPLACE FUNCTION public.ops_consume(p_event uuid,p_inventory uuid,p_branch uuid,p_quantity integer,p_ref_type text,p_ref_id text)
 RETURNS void LANGUAGE plpgsql AS $$
DECLARE a record; n integer:=0; take integer; known integer:=0; net_known integer:=0; gross bigint:=0; net bigint:=0;
BEGIN
 FOR a IN SELECT * FROM ops_assets WHERE inventory_id=p_inventory AND branch_id=p_branch
   AND (state='available' OR (state='reserved' AND (reservation_id=p_ref_id OR reservation_id IS NULL)))
   ORDER BY CASE WHEN reservation_id=p_ref_id THEN 0 ELSE 1 END,label_number FOR UPDATE LOOP
   EXIT WHEN n=p_quantity;
   UPDATE ops_assets SET state=CASE WHEN EXISTS(SELECT 1 FROM inventory_adjustments WHERE id=p_event AND event_type='sale') THEN 'sold' ELSE 'written_off' END,
     reservation_type=p_ref_type,reservation_id=p_ref_id,updated_at=now() WHERE id=a.id;
   n:=n+1;
   IF a.cost_gross_cents IS NOT NULL THEN known:=known+1;gross:=gross+a.cost_gross_cents; END IF;
   IF a.cost_net_cents IS NOT NULL THEN net_known:=net_known+1;net:=net+a.cost_net_cents; END IF;
 END LOOP;
 FOR a IN SELECT * FROM ops_cost_batches WHERE inventory_id=p_inventory AND branch_id=p_branch AND remaining>0 ORDER BY created_at,id FOR UPDATE LOOP
   EXIT WHEN n=p_quantity; take:=least(a.remaining,p_quantity-n);
   UPDATE ops_cost_batches SET remaining=remaining-take WHERE id=a.id; n:=n+take;
   IF a.cost_gross_cents IS NOT NULL THEN known:=known+take;gross:=gross+a.cost_gross_cents*take; END IF;
   IF a.cost_net_cents IS NOT NULL THEN net_known:=net_known+take;net:=net+a.cost_net_cents*take; END IF;
 END LOOP;
 INSERT INTO ops_cost_events(event_id,branch_id,quantity,known_units,gross_cents,net_cents,net_known_units)
 VALUES(p_event,p_branch,p_quantity,known,gross,net,net_known);
END; $$;

CREATE OR REPLACE FUNCTION public.ops_inventory_event() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE r record; v_branch uuid; preferred uuid; needed integer; take integer; v_category text;
 cost_gross bigint; cost_net bigint;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM inventory_skus WHERE id=NEW.inventory_sku_id AND location='local') THEN RETURN NEW; END IF;
 preferred:=nullif(current_setting('apfel.ops_branch',true),'')::uuid;
 SELECT id INTO v_branch FROM ops_branches WHERE code='main';
 IF NEW.reference_type='checkout_order' AND NEW.reserved_delta>0 AND EXISTS(
   SELECT 1 FROM orders WHERE id::text=NEW.reference_id AND shipping_method='pickup'
 ) THEN preferred:=v_branch;
 ELSIF preferred IS NULL AND NEW.reference_type='checkout_order' AND NEW.reserved_delta>0
   AND EXISTS(SELECT 1 FROM orders WHERE id::text=NEW.reference_id) THEN
   -- No implicit split shipment: select a branch capable of the complete cart.
   SELECT branch.id INTO preferred FROM ops_branches branch WHERE branch.active AND branch.code<>'transit'
     AND NOT EXISTS(
       SELECT 1 FROM orders o CROSS JOIN LATERAL (
         SELECT item->>'sku' AS sku,sum((item->>'quantity')::integer) AS quantity
         FROM jsonb_array_elements(o.items) item GROUP BY item->>'sku'
       ) line LEFT JOIN inventory_skus i ON i.sku=line.sku AND i.location='local'
         LEFT JOIN ops_balances s ON s.inventory_id=i.id AND s.branch_id=branch.id
       WHERE o.id::text=NEW.reference_id AND coalesce(s.on_hand-s.reserved,0)<line.quantity
     ) ORDER BY CASE WHEN branch.code='main' THEN 0 ELSE 1 END,branch.code LIMIT 1;
   IF preferred IS NULL THEN RAISE EXCEPTION 'Insufficient available stock at a single fulfilment branch'; END IF;
   PERFORM set_config('apfel.ops_branch',preferred::text,true);
 END IF;
 v_branch:=coalesce(preferred,v_branch);
 INSERT INTO ops_balances(inventory_id,branch_id) VALUES(NEW.inventory_sku_id,v_branch) ON CONFLICT DO NOTHING;
 -- Reservation events partition aggregate reservations into physical branches.
 IF NEW.reserved_delta>0 THEN
   needed:=NEW.reserved_delta;
   FOR r IN SELECT s.* FROM ops_balances s JOIN ops_branches b ON b.id=s.branch_id
     WHERE s.inventory_id=NEW.inventory_sku_id AND b.active AND (preferred IS NULL OR s.branch_id=preferred)
     ORDER BY b.code,s.branch_id FOR UPDATE OF s LOOP
     take:=least(needed,r.on_hand-r.reserved); IF take<=0 THEN CONTINUE; END IF;
     UPDATE ops_balances SET reserved=reserved+take,updated_at=now() WHERE inventory_id=r.inventory_id AND branch_id=r.branch_id;
     INSERT INTO ops_allocations VALUES(r.inventory_id,r.branch_id,NEW.reference_type,NEW.reference_id,take)
       ON CONFLICT(inventory_id,branch_id,reference_type,reference_id) DO UPDATE SET quantity=ops_allocations.quantity+excluded.quantity;
     UPDATE ops_assets SET state='reserved',reservation_type=NEW.reference_type,reservation_id=NEW.reference_id,updated_at=now()
       WHERE id IN (SELECT id FROM ops_assets WHERE inventory_id=r.inventory_id AND branch_id=r.branch_id AND state='available' ORDER BY label_number LIMIT take FOR UPDATE);
     needed:=needed-take; EXIT WHEN needed=0;
   END LOOP;
   IF needed<>0 THEN RAISE EXCEPTION 'Insufficient stock in the selected branch'; END IF;
 ELSIF NEW.reserved_delta<0 THEN
   needed:=-NEW.reserved_delta;
   FOR r IN SELECT s.*,coalesce(a.quantity,s.reserved) AS allocation_quantity FROM ops_balances s LEFT JOIN ops_allocations a
     ON a.inventory_id=s.inventory_id AND a.branch_id=s.branch_id AND a.reference_type=NEW.reference_type AND a.reference_id=NEW.reference_id
     WHERE s.inventory_id=NEW.inventory_sku_id AND s.reserved>0
       AND (a.quantity IS NOT NULL OR (s.branch_id=v_branch AND NOT EXISTS(SELECT 1 FROM ops_allocations WHERE inventory_id=s.inventory_id AND reference_type=NEW.reference_type AND reference_id=NEW.reference_id)))
     ORDER BY s.branch_id FOR UPDATE OF s LOOP
     take:=least(needed,r.allocation_quantity);
     IF take>r.reserved THEN RAISE EXCEPTION 'Branch reservation reconciliation required'; END IF;
     UPDATE ops_balances SET reserved=reserved-take,on_hand=on_hand-CASE WHEN NEW.quantity_delta<0 THEN take ELSE 0 END,updated_at=now()
       WHERE inventory_id=r.inventory_id AND branch_id=r.branch_id;
     IF NEW.quantity_delta<0 THEN
       PERFORM ops_consume(NEW.id,r.inventory_id,r.branch_id,take,NEW.reference_type,NEW.reference_id);
     ELSE
       UPDATE ops_assets SET state='available',reservation_type=NULL,reservation_id=NULL,updated_at=now()
         WHERE id IN (SELECT id FROM ops_assets WHERE inventory_id=r.inventory_id AND branch_id=r.branch_id AND state='reserved' AND (reservation_id=NEW.reference_id OR reservation_id IS NULL) ORDER BY label_number LIMIT take FOR UPDATE);
     END IF;
     DELETE FROM ops_allocations WHERE inventory_id=r.inventory_id AND branch_id=r.branch_id AND reference_type=NEW.reference_type AND reference_id=NEW.reference_id;
     needed:=needed-take; EXIT WHEN needed=0;
   END LOOP;
   IF needed<>0 THEN RAISE EXCEPTION 'Branch reservation reconciliation required'; END IF;
 ELSIF NEW.quantity_delta<0 THEN
   needed:=-NEW.quantity_delta;
   FOR r IN SELECT s.* FROM ops_balances s JOIN ops_branches b ON b.id=s.branch_id
     WHERE s.inventory_id=NEW.inventory_sku_id AND (preferred IS NULL OR s.branch_id=preferred)
     ORDER BY b.code,s.branch_id FOR UPDATE OF s LOOP
     take:=least(needed,r.on_hand-r.reserved); IF take<=0 THEN CONTINUE; END IF;
     UPDATE ops_balances SET on_hand=on_hand-take,updated_at=now() WHERE inventory_id=r.inventory_id AND branch_id=r.branch_id;
     PERFORM ops_consume(NEW.id,r.inventory_id,r.branch_id,take,NEW.reference_type,NEW.reference_id);
     needed:=needed-take; EXIT WHEN needed=0;
   END LOOP;
   IF needed<>0 THEN RAISE EXCEPTION 'Insufficient unreserved branch stock'; END IF;
 ELSIF NEW.quantity_delta>0 THEN
   UPDATE ops_balances SET on_hand=on_hand+NEW.quantity_delta,updated_at=now() WHERE inventory_id=NEW.inventory_sku_id AND branch_id=v_branch;
   cost_gross:=nullif(current_setting('apfel.ops_cost_gross',true),'')::bigint;
   cost_net:=nullif(current_setting('apfel.ops_cost_net',true),'')::bigint;
   SELECT lower(p.category) INTO v_category FROM products p JOIN inventory_skus i ON i.product_id=p.id WHERE i.id=NEW.inventory_sku_id;
   IF v_category IN ('smartphones','tablets') THEN
     INSERT INTO ops_assets(inventory_id,branch_id,cost_gross_cents,cost_net_cents)
       SELECT NEW.inventory_sku_id,v_branch,cost_gross,cost_net FROM generate_series(1,NEW.quantity_delta);
   ELSE
     INSERT INTO ops_cost_batches(inventory_id,branch_id,remaining,cost_gross_cents,cost_net_cents,reference_id)
       VALUES(NEW.inventory_sku_id,v_branch,NEW.quantity_delta,cost_gross,cost_net,NEW.reference_id);
   END IF;
 END IF;
 INSERT INTO ops_events(kind,branch_id) VALUES('inventory',v_branch);
 RETURN NEW;
END; $$;
CREATE TRIGGER ops_inventory_event AFTER INSERT ON public.inventory_adjustments FOR EACH ROW EXECUTE FUNCTION public.ops_inventory_event();

-- A new catalog SKU may have opening stock without an adjustment event.
CREATE OR REPLACE FUNCTION public.ops_seed_inventory() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE b uuid;
BEGIN
 IF NEW.location<>'local' THEN RETURN NEW; END IF;
 INSERT INTO ops_item_labels(inventory_id) VALUES(NEW.id);
 SELECT id INTO b FROM ops_branches WHERE code='main';
 INSERT INTO ops_balances(inventory_id,branch_id,on_hand,reserved)
   SELECT NEW.id,id,CASE WHEN id=b THEN NEW.on_hand ELSE 0 END,CASE WHEN id=b THEN NEW.reserved ELSE 0 END FROM ops_branches WHERE code<>'transit';
 IF EXISTS(SELECT 1 FROM products WHERE id=NEW.product_id AND lower(category) IN ('smartphones','tablets')) THEN
   INSERT INTO ops_assets(inventory_id,branch_id) SELECT NEW.id,b FROM generate_series(1,NEW.on_hand);
 ELSIF NEW.on_hand>0 THEN
   INSERT INTO ops_cost_batches(inventory_id,branch_id,remaining) VALUES(NEW.id,b,NEW.on_hand);
 END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER ops_seed_inventory AFTER INSERT ON public.inventory_skus FOR EACH ROW EXECUTE FUNCTION public.ops_seed_inventory();

-- Legacy catalog editors upsert aggregate quantities directly. At commit, record
-- any uncovered delta so those paths cannot silently leave branch stock stale.
CREATE OR REPLACE FUNCTION public.ops_reconcile_legacy_inventory() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE current_row inventory_skus%rowtype; allocated integer; held integer; diff integer; reserve_diff integer;
BEGIN
 SELECT * INTO current_row FROM inventory_skus WHERE id=NEW.id;
 IF NOT FOUND OR current_row.location<>'local' THEN RETURN NULL; END IF;
 SELECT coalesce(sum(on_hand),0),coalesce(sum(reserved),0) INTO allocated,held FROM ops_balances WHERE inventory_id=NEW.id;
 diff:=current_row.on_hand-allocated;reserve_diff:=current_row.reserved-held;
 IF diff<>0 OR reserve_diff<>0 THEN
   INSERT INTO inventory_adjustments(inventory_sku_id,event_type,quantity_delta,reserved_delta,reference_type,reference_id,actor,metadata)
   VALUES(NEW.id,'adjustment',diff,reserve_diff,'legacy_catalog_reconciliation',gen_random_uuid()::text,current_user,
     jsonb_build_object('reason','Catalog editor aggregate correction','costUnknown',true));
 END IF;
 INSERT INTO ops_events(kind) VALUES('inventory');
 RETURN NULL;
END; $$;
CREATE CONSTRAINT TRIGGER ops_reconcile_legacy_inventory AFTER INSERT OR UPDATE ON public.inventory_skus
 DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION public.ops_reconcile_legacy_inventory();

CREATE OR REPLACE FUNCTION public.ops_protect_record() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Operations financial and audit records are append-only'; END; $$;
CREATE TRIGGER ops_audit_immutable BEFORE UPDATE OR DELETE ON public.ops_audit FOR EACH ROW EXECUTE FUNCTION public.ops_protect_record();
CREATE TRIGGER ops_cost_immutable BEFORE UPDATE OR DELETE ON public.ops_cost_events FOR EACH ROW EXECUTE FUNCTION public.ops_protect_record();
CREATE TRIGGER ops_expense_immutable BEFORE UPDATE OR DELETE ON public.ops_expenses FOR EACH ROW EXECUTE FUNCTION public.ops_protect_record();
CREATE OR REPLACE FUNCTION public.ops_protect_document() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Operations documents cannot be deleted'; END IF;
 IF NEW.payload IS DISTINCT FROM OLD.payload OR NEW.number IS DISTINCT FROM OLD.number OR NEW.kind IS DISTINCT FROM OLD.kind
   OR NEW.actor_id IS DISTINCT FROM OLD.actor_id OR NEW.created_at IS DISTINCT FROM OLD.created_at OR NEW.branch_id IS DISTINCT FROM OLD.branch_id
   OR NEW.destination_id IS DISTINCT FROM OLD.destination_id OR NEW.idempotency_key IS DISTINCT FROM OLD.idempotency_key OR NEW.request_hash IS DISTINCT FROM OLD.request_hash THEN
   RAISE EXCEPTION 'Operations document snapshots are immutable';
 END IF;
 IF NEW.status IS DISTINCT FROM OLD.status AND NOT(OLD.kind='transfer' AND OLD.status='dispatched' AND NEW.status='received') THEN
   RAISE EXCEPTION 'Invalid operations document transition';
 END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER ops_document_immutable BEFORE UPDATE OR DELETE ON public.ops_documents FOR EACH ROW EXECUTE FUNCTION public.ops_protect_document();

INSERT INTO public.store_settings(key,value) VALUES('operations_settings','{"liveTillEnabled":false,"fiscalProvider":null,"taxRulesConfirmed":false}') ON CONFLICT DO NOTHING;
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK(role IN ('admin','manager','product_editor','cashier'));
CREATE OR REPLACE FUNCTION public.ops_order_event() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='INSERT' OR NEW.payment_status IS DISTINCT FROM OLD.payment_status OR NEW.status IS DISTINCT FROM OLD.status THEN
   INSERT INTO ops_events(kind) VALUES('order');
 END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER ops_order_event AFTER INSERT OR UPDATE OF payment_status,status ON public.orders FOR EACH ROW EXECUTE FUNCTION public.ops_order_event();
DO $$ DECLARE runtime_role text:=nullif(current_setting('apfel.runtime_role',true),''); t text;
BEGIN
 IF runtime_role IS NULL THEN runtime_role:=current_user; END IF;
 FOREACH t IN ARRAY ARRAY['ops_branches','ops_members','ops_balances','ops_item_labels','ops_assets','ops_allocations','ops_cost_batches','ops_cost_events','ops_documents','ops_audit','ops_expenses','ops_events'] LOOP
   EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC',t);
   EXECUTE format('GRANT SELECT,INSERT,UPDATE ON TABLE public.%I TO %I',t,runtime_role);
 END LOOP;
 EXECUTE format('GRANT DELETE ON public.ops_allocations TO %I',runtime_role);
 EXECUTE format('GRANT USAGE,SELECT ON SEQUENCE public.ops_item_labels_label_number_seq,public.ops_assets_label_number_seq,public.ops_cost_events_id_seq,public.ops_documents_number_seq,public.ops_audit_id_seq,public.ops_events_id_seq TO %I',runtime_role);
 REVOKE ALL ON FUNCTION public.ops_consume(uuid,uuid,uuid,integer,text,text),public.ops_inventory_event(),public.ops_seed_inventory(),public.ops_protect_record() FROM PUBLIC;
 EXECUTE format('GRANT EXECUTE ON FUNCTION public.ops_consume(uuid,uuid,uuid,integer,text,text),public.ops_inventory_event(),public.ops_seed_inventory(),public.ops_protect_record() TO %I',runtime_role);
END; $$;
