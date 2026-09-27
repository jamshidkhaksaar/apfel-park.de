-- The catalog owner creates the invoice table because it references orders.
-- Give the application only the permissions used by the invoice service.
DO $$
DECLARE runtime_role text := nullif(current_setting('apfel.runtime_role',true),'');
BEGIN
  IF runtime_role IS NULL THEN
    RAISE EXCEPTION 'Invoice permissions require the database-owner migration workflow';
  END IF;
  EXECUTE format('GRANT SELECT, INSERT, UPDATE ON public.customer_order_invoices TO %I',runtime_role);
  EXECUTE format('GRANT USAGE, SELECT ON SEQUENCE public.customer_order_invoices_sequence_number_seq TO %I',runtime_role);
END $$;
