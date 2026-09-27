-- Customer invoices remain disabled until the owner approves the template.
CREATE TABLE IF NOT EXISTS public.customer_order_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_number bigint GENERATED ALWAYS AS IDENTITY UNIQUE,
  order_id uuid NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE RESTRICT,
  invoice_number text NOT NULL UNIQUE,
  snapshot jsonb NOT NULL,
  pdf_content bytea NOT NULL,
  pdf_sha256 text NOT NULL,
  issued_at timestamptz NOT NULL DEFAULT now(),
  issued_by uuid,
  email_sent_at timestamptz,
  email_claim_token uuid,
  email_claimed_at timestamptz,
  email_attempts integer NOT NULL DEFAULT 0,
  email_last_error text,
  CHECK (octet_length(pdf_content) > 0),
  CHECK (pdf_sha256 ~ '^[a-f0-9]{64}$')
);
CREATE INDEX IF NOT EXISTS customer_order_invoices_issued_at_idx ON public.customer_order_invoices (issued_at DESC);

CREATE OR REPLACE FUNCTION public.protect_customer_invoice_document() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Issued invoices cannot be deleted';
  END IF;
  IF NEW.order_id IS DISTINCT FROM OLD.order_id
    OR NEW.invoice_number IS DISTINCT FROM OLD.invoice_number
    OR NEW.sequence_number IS DISTINCT FROM OLD.sequence_number
    OR NEW.snapshot IS DISTINCT FROM OLD.snapshot
    OR NEW.pdf_content IS DISTINCT FROM OLD.pdf_content
    OR NEW.pdf_sha256 IS DISTINCT FROM OLD.pdf_sha256
    OR NEW.issued_at IS DISTINCT FROM OLD.issued_at
    OR NEW.issued_by IS DISTINCT FROM OLD.issued_by THEN
    RAISE EXCEPTION 'Issued invoice documents are immutable';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS protect_customer_invoice_document ON public.customer_order_invoices;
CREATE TRIGGER protect_customer_invoice_document BEFORE UPDATE OR DELETE ON public.customer_order_invoices
FOR EACH ROW EXECUTE FUNCTION public.protect_customer_invoice_document();

INSERT INTO public.store_settings(key,value)
VALUES ('customer_invoice_settings','{"approvedAt":null,"approvedVersion":null,"taxId":"DE345074336","taxConfirmed":true}')
ON CONFLICT(key) DO NOTHING;
