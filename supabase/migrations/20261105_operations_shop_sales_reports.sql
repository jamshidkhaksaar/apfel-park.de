-- Additive in-shop sales ledger and scheduled report bookkeeping.
-- Online orders keep their existing report path; this table snapshots only
-- inventory adjustments recorded as "Sold in shop" (shop_sale). Price, VAT and
-- variant details are captured at sale time so later catalog edits cannot
-- rewrite historical revenue.
SET LOCAL lock_timeout='10s';
SET LOCAL statement_timeout='90s';

CREATE TABLE IF NOT EXISTS public.ops_shop_sales (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  -- Historical keys deliberately have no foreign keys: deleting a catalog or
  -- adjustment row must neither be blocked by nor cascade into this ledger.
  adjustment_id uuid NOT NULL UNIQUE,
  inventory_id uuid NOT NULL,
  product_id uuid NOT NULL,
  branch_id uuid NOT NULL REFERENCES public.ops_branches(id),
  sku text NOT NULL,
  title text NOT NULL,
  category text NOT NULL DEFAULT '',
  condition text NOT NULL DEFAULT '',
  color text NOT NULL DEFAULT '',
  storage text NOT NULL DEFAULT '',
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_gross_cents bigint NOT NULL CHECK (unit_gross_cents >= 0),
  gross_cents bigint NOT NULL CHECK (gross_cents >= 0),
  net_cents bigint NOT NULL CHECK (net_cents >= 0),
  vat_cents bigint NOT NULL CHECK (vat_cents >= 0),
  vat_rate numeric(5,2) NOT NULL CHECK (vat_rate >= 0 AND vat_rate <= 30),
  sold_on date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (gross_cents = net_cents + vat_cents),
  CHECK (gross_cents = unit_gross_cents * quantity)
);

CREATE INDEX IF NOT EXISTS ops_shop_sales_period_idx
  ON public.ops_shop_sales(branch_id, sold_on, id);
CREATE INDEX IF NOT EXISTS ops_shop_sales_product_idx
  ON public.ops_shop_sales(product_id, sold_on);
CREATE INDEX IF NOT EXISTS ops_shop_sales_category_idx
  ON public.ops_shop_sales(category, sold_on);

-- Inventory adjustments are the single source of truth for stock. Snapshot the
-- matching variant price/colour/storage for a shop sale and split VAT from the
-- configured rate (19% unless operations_settings overrides it).
CREATE OR REPLACE FUNCTION public.ops_record_shop_sale() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_product record;
  v_variant jsonb;
  v_branch uuid;
  v_rate numeric;
  v_quantity integer;
  v_unit bigint;
  v_gross bigint;
  v_net bigint;
BEGIN
  IF NEW.event_type <> 'sale'
     OR coalesce(NEW.metadata ->> 'adjustmentType', '') <> 'shop_sale'
     OR NEW.quantity_delta >= 0 THEN
    RETURN NEW;
  END IF;

  SELECT p.id, p.title, p.category, p.condition, p.price, p.variants, i.sku
    INTO v_product
    FROM public.inventory_skus i
    JOIN public.products p ON p.id = i.product_id
   WHERE i.id = NEW.inventory_sku_id AND i.location = 'local';
  IF NOT FOUND THEN RETURN NEW; END IF;

  SELECT value INTO v_variant
    FROM jsonb_array_elements(
      CASE WHEN jsonb_typeof(v_product.variants) = 'array' THEN v_product.variants ELSE '[]'::jsonb END
    )
   WHERE value ->> 'sku' = v_product.sku
   LIMIT 1;

  v_branch := nullif(current_setting('apfel.ops_branch', true), '')::uuid;
  IF v_branch IS NULL THEN
    SELECT id INTO v_branch FROM public.ops_branches WHERE code = 'main';
  END IF;
  IF v_branch IS NULL THEN RETURN NEW; END IF;

  SELECT least(greatest(coalesce(nullif(value ->> 'shopVatPercent', '')::numeric, 19), 0), 30)
    INTO v_rate
    FROM public.store_settings
   WHERE key = 'operations_settings';
  v_rate := coalesce(v_rate, 19);

  v_quantity := -NEW.quantity_delta;
  v_unit := round(coalesce(nullif(v_variant ->> 'price', '')::numeric, v_product.price) * 100)::bigint;
  v_gross := v_unit * v_quantity;
  v_net := round(v_gross::numeric / (1 + v_rate / 100))::bigint;

  INSERT INTO public.ops_shop_sales(
    adjustment_id, inventory_id, product_id, branch_id, sku, title, category,
    condition, color, storage, quantity, unit_gross_cents, gross_cents,
    net_cents, vat_cents, vat_rate, sold_on
  ) VALUES (
    NEW.id, NEW.inventory_sku_id, v_product.id, v_branch, v_product.sku,
    v_product.title, coalesce(v_product.category, ''), coalesce(v_product.condition, ''),
    coalesce(v_variant ->> 'color', ''), coalesce(v_variant ->> 'storage', ''),
    v_quantity, v_unit, v_gross, v_net, v_gross - v_net, v_rate,
    (NEW.created_at AT TIME ZONE 'Europe/Berlin')::date
  )
  ON CONFLICT (adjustment_id) DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Reporting is a side effect and must never block a real shop sale.
  RAISE WARNING 'ops_record_shop_sale skipped adjustment %: %', NEW.id, SQLERRM;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS ops_shop_sale_ledger ON public.inventory_adjustments;
CREATE TRIGGER ops_shop_sale_ledger
  AFTER INSERT ON public.inventory_adjustments
  FOR EACH ROW EXECUTE FUNCTION public.ops_record_shop_sale();

DROP TRIGGER IF EXISTS ops_shop_sale_immutable ON public.ops_shop_sales;
CREATE TRIGGER ops_shop_sale_immutable
  BEFORE UPDATE OR DELETE ON public.ops_shop_sales
  FOR EACH ROW EXECUTE FUNCTION public.ops_protect_record();

-- The scheduler claims a period exactly once. A failed or stale claim may be
-- retried; a sent report is never emailed twice.
CREATE TABLE IF NOT EXISTS public.ops_report_runs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  kind text NOT NULL CHECK (kind IN ('daily', 'weekly', 'monthly')),
  period_start date NOT NULL,
  period_end date NOT NULL,
  status text NOT NULL DEFAULT 'sending' CHECK (status IN ('sending', 'sent', 'failed')),
  recipients text NOT NULL DEFAULT '',
  error text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (kind, period_start, period_end),
  CHECK (period_end >= period_start)
);
CREATE INDEX IF NOT EXISTS ops_report_runs_due_idx
  ON public.ops_report_runs(kind, status, updated_at DESC);

CREATE OR REPLACE FUNCTION public.ops_protect_report_run() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Operations report runs cannot be deleted';
  END IF;
  IF NEW.kind IS DISTINCT FROM OLD.kind
     OR NEW.period_start IS DISTINCT FROM OLD.period_start
     OR NEW.period_end IS DISTINCT FROM OLD.period_end
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Operations report run identity is immutable';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS ops_report_run_immutable ON public.ops_report_runs;
CREATE TRIGGER ops_report_run_immutable
  BEFORE UPDATE OR DELETE ON public.ops_report_runs
  FOR EACH ROW EXECUTE FUNCTION public.ops_protect_report_run();

-- Safe defaults: 19% standard VAT for shop sales and the shop inbox as report
-- recipient. Existing explicit values are preserved.
UPDATE public.store_settings
   SET value = coalesce(value, '{}'::jsonb)
     || CASE WHEN value ? 'shopVatPercent' THEN '{}'::jsonb ELSE '{"shopVatPercent":19}'::jsonb END
     || CASE WHEN value ? 'reportRecipients' THEN '{}'::jsonb ELSE '{"reportRecipients":["info@apfel-park.de"]}'::jsonb END,
       updated_at = now()
 WHERE key = 'operations_settings';

DO $$ DECLARE runtime_role text := nullif(current_setting('apfel.runtime_role', true), ''); t text;
BEGIN
  IF runtime_role IS NULL THEN runtime_role := current_user; END IF;
  FOREACH t IN ARRAY ARRAY['ops_shop_sales', 'ops_report_runs'] LOOP
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC', t);
    EXECUTE format('GRANT SELECT,INSERT,UPDATE ON TABLE public.%I TO %I', t, runtime_role);
  END LOOP;
  EXECUTE format('GRANT USAGE,SELECT ON SEQUENCE public.ops_shop_sales_id_seq,public.ops_report_runs_id_seq TO %I', runtime_role);
END; $$;
