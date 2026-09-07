-- Inventory contains the full collection; catalog_enabled selects the admin shop workspace.
ALTER TABLE public.products ADD COLUMN catalog_enabled boolean NOT NULL DEFAULT false;
UPDATE public.products SET catalog_enabled = true WHERE is_active = true;

-- Keep every publishing path (legacy editor, smartphone editor, intake) compatible.
CREATE FUNCTION public.ensure_published_product_in_catalog() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.is_active = true THEN NEW.catalog_enabled := true; END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER products_published_catalog
BEFORE INSERT OR UPDATE OF is_active, catalog_enabled ON public.products
FOR EACH ROW EXECUTE FUNCTION public.ensure_published_product_in_catalog();
CREATE INDEX products_catalog_enabled_updated_idx ON public.products(updated_at DESC) WHERE catalog_enabled = true;
