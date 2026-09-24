ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS customer_unpaid_email_eligible boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS customer_unpaid_email_claimed_at timestamptz,
  ADD COLUMN IF NOT EXISTS customer_unpaid_email_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS customer_unpaid_email_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS customer_unpaid_email_last_error text;

-- Do not send a new campaign to old failed or abandoned orders during rollout.
UPDATE public.orders
SET customer_unpaid_email_eligible = false
WHERE created_at < now() - interval '24 hours'
   OR payment_status = 'failed'
   OR status = 'cancelled';

CREATE INDEX IF NOT EXISTS orders_customer_unpaid_email_due_idx
  ON public.orders (created_at)
  WHERE customer_unpaid_email_eligible AND customer_unpaid_email_sent_at IS NULL;
