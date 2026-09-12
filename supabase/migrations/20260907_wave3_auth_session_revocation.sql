-- Additive expand-only migration. Old web/worker writers omit security_version;
-- the default and trigger preserve their SQL compatibility. Do not remove on rollback.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS security_version integer NOT NULL DEFAULT 0;

CREATE TABLE public.admin_sessions (
  token_hash text PRIMARY KEY,
  -- Text representation supports the legacy users identifier without altering its type.
  user_id text NOT NULL,
  security_version integer NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX admin_sessions_expiry_idx ON public.admin_sessions (expires_at);
CREATE INDEX admin_sessions_user_idx ON public.admin_sessions (user_id);

-- Database-side revocation also covers password/account updates by the previous release.
CREATE FUNCTION public.wave3_auth_advance_security_version() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.password_hash IS DISTINCT FROM OLD.password_hash
     OR NEW.is_active IS DISTINCT FROM OLD.is_active
     OR NEW.email IS DISTINCT FROM OLD.email THEN
    NEW.security_version := OLD.security_version + 1;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER wave3_auth_advance_security_version
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.wave3_auth_advance_security_version();
