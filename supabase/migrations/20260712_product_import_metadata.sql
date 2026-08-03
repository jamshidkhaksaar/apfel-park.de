ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS import_key text,
  ADD COLUMN IF NOT EXISTS import_metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS products_import_key_unique_idx
  ON public.products (import_key)
  WHERE import_key IS NOT NULL;

COMMENT ON COLUMN public.products.import_key IS
  'Idempotency key supplied by trusted product-import integrations.';

COMMENT ON COLUMN public.products.import_metadata IS
  'Source hash, verification confidence, research sources, evidence, and review reasons.';
