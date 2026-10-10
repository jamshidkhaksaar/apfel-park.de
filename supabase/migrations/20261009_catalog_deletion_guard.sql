-- Catalog deletion retains financial/inventory history. All publishing paths,
-- including old releases during rollback, must keep a deleted offer hidden.
CREATE FUNCTION public.guard_deleted_catalog_product() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.import_metadata->>'catalogDeletedAt' IS NOT NULL THEN
    NEW.is_active := false;
    NEW.catalog_enabled := false;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER products_catalog_deleted_guard
BEFORE INSERT OR UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.guard_deleted_catalog_product();
