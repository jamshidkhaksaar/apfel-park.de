-- Individual unit rows were created by the stock triggers with only their stock
-- identity, branch and cost. Colour and storage live on the SKU variant, so
-- every unit showed up in the till as "colour or storage missing" even when the
-- catalogue knew both. Fill the unit at insert time, and backfill the units
-- created before this trigger existed.

CREATE OR REPLACE FUNCTION public.ops_asset_specs() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE variant_color text; variant_storage text;
BEGIN
  IF coalesce(NEW.color,'')='' OR coalesce(NEW.storage,'')='' THEN
    SELECT coalesce(v.value->>'color',''),coalesce(v.value->>'storage','')
      INTO variant_color,variant_storage
      FROM inventory_skus i JOIN products p ON p.id=i.product_id
      LEFT JOIN LATERAL (
        SELECT value FROM jsonb_array_elements(CASE WHEN jsonb_typeof(p.variants)='array' THEN p.variants ELSE '[]'::jsonb END)
        WHERE value->>'sku'=i.sku LIMIT 1
      ) v ON true
      WHERE i.id=NEW.inventory_id;
    IF coalesce(NEW.color,'')='' THEN NEW.color:=coalesce(variant_color,''); END IF;
    IF coalesce(NEW.storage,'')='' THEN NEW.storage:=coalesce(variant_storage,''); END IF;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS ops_asset_specs ON public.ops_assets;
CREATE TRIGGER ops_asset_specs BEFORE INSERT ON public.ops_assets
  FOR EACH ROW EXECUTE FUNCTION public.ops_asset_specs();

UPDATE public.ops_assets a
SET color=CASE WHEN a.color='' THEN coalesce(v.value->>'color','') ELSE a.color END,
    storage=CASE WHEN a.storage='' THEN coalesce(v.value->>'storage','') ELSE a.storage END,
    updated_at=now()
FROM inventory_skus i
JOIN products p ON p.id=i.product_id
LEFT JOIN LATERAL (
  SELECT value FROM jsonb_array_elements(CASE WHEN jsonb_typeof(p.variants)='array' THEN p.variants ELSE '[]'::jsonb END)
  WHERE value->>'sku'=i.sku LIMIT 1
) v ON true
WHERE a.inventory_id=i.id
  AND (a.color='' OR a.storage='')
  AND (coalesce(v.value->>'color','')<>'' OR coalesce(v.value->>'storage','')<>'');
