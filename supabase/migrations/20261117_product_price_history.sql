-- Price history for the 30-day lowest-price rule (PAngV §11).
--
-- Whenever a price reduction is advertised (a strike price or a "−XX %" badge),
-- the reference price must be the lowest price of the previous 30 days. The
-- storefront reads that reference from this table. Every change to a product's
-- base price or to a variant price in `products.variants` adds one row;
-- unchanged prices add nothing.
--
-- `variant_key` is '' for the base price, otherwise the variant SKU or, if the
-- variant has no SKU, lower(color)|lower(storage). `productPriceKey()` in
-- src/lib/campaign-pricing.ts must build the same key.
--
-- Campaign discounts (Black Friday) are applied at read time and never stored
-- in `products.price`, so they never pollute the history.
SET LOCAL lock_timeout='10s';
SET LOCAL statement_timeout='120s';

CREATE TABLE IF NOT EXISTS public.product_price_history (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  -- No foreign key: deleting a product must not erase or be blocked by history.
  product_id uuid NOT NULL,
  variant_key text NOT NULL DEFAULT '',
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  recorded_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS product_price_history_lookup
  ON public.product_price_history (product_id, variant_key, recorded_at DESC);

CREATE OR REPLACE FUNCTION public.product_price_variant_key(variant jsonb) RETURNS text
LANGUAGE sql IMMUTABLE AS $$
  SELECT coalesce(
    nullif(btrim(variant->>'sku'), ''),
    lower(btrim(coalesce(variant->>'color', ''))) || '|' || lower(btrim(coalesce(variant->>'storage', '')))
  );
$$;

CREATE OR REPLACE FUNCTION public.record_product_price(p_product uuid, p_key text, p_price numeric)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  last_price numeric;
BEGIN
  IF p_price IS NULL OR p_price < 0 THEN
    RETURN;
  END IF;
  SELECT price INTO last_price
    FROM public.product_price_history
   WHERE product_id = p_product AND variant_key = p_key
   ORDER BY recorded_at DESC, id DESC
   LIMIT 1;
  IF last_price IS DISTINCT FROM round(p_price, 2) THEN
    INSERT INTO public.product_price_history (product_id, variant_key, price)
    VALUES (p_product, p_key, round(p_price, 2));
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.track_product_price_history() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  variant jsonb;
  variant_price numeric;
BEGIN
  IF TG_OP = 'INSERT' OR NEW.price IS DISTINCT FROM OLD.price THEN
    PERFORM public.record_product_price(NEW.id, '', NEW.price);
  END IF;

  IF jsonb_typeof(NEW.variants) = 'array'
     AND (TG_OP = 'INSERT' OR NEW.variants IS DISTINCT FROM OLD.variants) THEN
    FOR variant IN SELECT value FROM jsonb_array_elements(NEW.variants) LOOP
      IF jsonb_typeof(variant) <> 'object' THEN CONTINUE; END IF;
      BEGIN
        variant_price := nullif(btrim(variant->>'price'), '')::numeric;
      EXCEPTION WHEN invalid_text_representation THEN
        variant_price := NULL;
      END;
      IF variant_price IS NOT NULL THEN
        PERFORM public.record_product_price(NEW.id, public.product_price_variant_key(variant), variant_price);
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS products_price_history ON public.products;
CREATE TRIGGER products_price_history
AFTER INSERT OR UPDATE OF price, variants ON public.products
FOR EACH ROW EXECUTE FUNCTION public.track_product_price_history();

-- Seed: today's prices become the first known point. History before this
-- migration is unknown; the storefront treats the seed as the price in effect
-- for the whole 30-day window, which is only true if prices were not changed
-- in the 30 days before the migration ran.
DO $$
DECLARE
  product record;
  variant jsonb;
  variant_price numeric;
BEGIN
  FOR product IN SELECT id, price, variants FROM public.products LOOP
    PERFORM public.record_product_price(product.id, '', product.price);
    IF jsonb_typeof(product.variants) = 'array' THEN
      FOR variant IN SELECT value FROM jsonb_array_elements(product.variants) LOOP
        IF jsonb_typeof(variant) <> 'object' THEN CONTINUE; END IF;
        BEGIN
          variant_price := nullif(btrim(variant->>'price'), '')::numeric;
        EXCEPTION WHEN invalid_text_representation THEN
          variant_price := NULL;
        END;
        IF variant_price IS NOT NULL THEN
          PERFORM public.record_product_price(product.id, public.product_price_variant_key(variant), variant_price);
        END IF;
      END LOOP;
    END IF;
  END LOOP;
END;
$$;
