CREATE UNIQUE INDEX IF NOT EXISTS orders_provider_order_unique_idx
  ON public.orders (provider, provider_order_id)
  WHERE provider_order_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS orders_provider_session_unique_idx
  ON public.orders (provider, provider_session_id)
  WHERE provider_session_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS orders_provider_payment_unique_idx
  ON public.orders (provider, provider_payment_id)
  WHERE provider_payment_id IS NOT NULL;
