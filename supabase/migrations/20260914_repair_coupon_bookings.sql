-- Additive: existing orders, product coupons and repair tickets are unchanged.
ALTER TABLE public.store_campaigns ADD COLUMN repair_rules jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(repair_rules)='object');
ALTER TABLE public.repairs ADD COLUMN booking_details jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(booking_details)='object');
ALTER TABLE public.repairs ADD COLUMN booking_key uuid;
ALTER TABLE public.repairs ADD COLUMN booking_hash text;
CREATE UNIQUE INDEX repairs_booking_key_unique ON public.repairs(booking_key) WHERE booking_key IS NOT NULL;
CREATE TABLE public.repair_campaign_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.store_campaigns(id) ON DELETE RESTRICT,
  repair_id uuid NOT NULL UNIQUE REFERENCES public.repairs(id) ON DELETE RESTRICT,
  discount_amount numeric(10,2) NOT NULL CHECK(discount_amount>=0),
  created_at timestamptz NOT NULL DEFAULT now(),
  released_at timestamptz
);
CREATE INDEX repair_campaign_history_idx ON public.repair_campaign_redemptions(campaign_id,created_at);
DO $$
DECLARE runtime_role text := nullif(current_setting('apfel.runtime_role',true),'');
BEGIN
  IF runtime_role IS NOT NULL THEN
    EXECUTE format('GRANT SELECT, INSERT, UPDATE ON public.repair_campaign_redemptions TO %I',runtime_role);
  END IF;
END $$;
