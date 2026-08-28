ALTER TABLE public.payment_webhook_events
  ADD COLUMN IF NOT EXISTS processing_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS processing_token uuid,
  ADD COLUMN IF NOT EXISTS attempt_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_error text;

CREATE INDEX IF NOT EXISTS payment_webhook_events_processing_idx
  ON public.payment_webhook_events (processing_started_at)
  WHERE processed_at IS NULL;
