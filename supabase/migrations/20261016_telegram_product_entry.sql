SET search_path TO public;

CREATE TABLE telegram_product_members (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(), telegram_id bigint NOT NULL UNIQUE CHECK (telegram_id > 0),
  display_name text NOT NULL, locale text NOT NULL DEFAULT 'de' CHECK(locale IN ('de','en')),
  status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','active','revoked')),
  approved_by text, approved_at timestamptz, last_seen_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE telegram_product_invites (
  token_hash text PRIMARY KEY, label text NOT NULL, created_by text NOT NULL,
  expires_at timestamptz NOT NULL, claimed_by uuid REFERENCES telegram_product_members(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE telegram_product_sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(), member_id uuid NOT NULL REFERENCES telegram_product_members(id),
  draft_id uuid NOT NULL UNIQUE REFERENCES smartphone_editor_drafts(id),
  state jsonb NOT NULL, revision integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'collecting' CHECK(status IN ('collecting','submitted','changes_requested','published','rejected','cancelled')),
  submitted_revision integer, review_note text, submitted_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX telegram_product_one_open ON telegram_product_sessions(member_id) WHERE status IN ('collecting','changes_requested');
CREATE TABLE telegram_product_updates (
  telegram_id bigint NOT NULL, update_id bigint NOT NULL, request_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(telegram_id,update_id)
);
CREATE TABLE telegram_product_assets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(), session_id uuid NOT NULL REFERENCES telegram_product_sessions(id),
  entry_id uuid NOT NULL, kind text NOT NULL CHECK(kind IN ('device','box','barcode_label','about_screen','battery_health')),
  private_path text NOT NULL, safe_path text, sha256 text, edited_path text,
  status text NOT NULL DEFAULT 'queued' CHECK(status IN ('queued','ready','failed','approved','original')),
  public_url text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE telegram_product_jobs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(), session_id uuid NOT NULL REFERENCES telegram_product_sessions(id),
  kind text NOT NULL CHECK(kind IN ('research','photo')), payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'queued' CHECK(status IN ('queued','processing','done','failed','cancelled')),
  attempts integer NOT NULL DEFAULT 0, lease uuid, lease_until timestamptz, run_after timestamptz NOT NULL DEFAULT now(),
  error_code text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX telegram_product_jobs_ready ON telegram_product_jobs(run_after) WHERE status IN ('queued','processing');
CREATE TABLE telegram_product_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(), session_id uuid REFERENCES telegram_product_sessions(id),
  actor text NOT NULL, event_type text NOT NULL, details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX telegram_product_events_session ON telegram_product_events(session_id,created_at);
CREATE TABLE ai_provider_credentials (
  slot text PRIMARY KEY CHECK(slot IN ('primary','backup')), label text NOT NULL,
  encrypted_key text NOT NULL, fingerprint text NOT NULL, validated_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by text NOT NULL
);
CREATE TABLE ai_provider_configuration (
  id boolean PRIMARY KEY DEFAULT true CHECK(id), active_slot text CHECK(active_slot IN ('primary','backup')),
  image_model text NOT NULL DEFAULT 'gemini-nano-banana-2.1', updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO ai_provider_configuration(id) VALUES(true);
CREATE TABLE telegram_product_research_cache (
  cache_key text PRIMARY KEY, result jsonb NOT NULL, expires_at timestamptz NOT NULL
);
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['telegram_product_members','telegram_product_invites','telegram_product_sessions','telegram_product_updates','telegram_product_assets','telegram_product_jobs','telegram_product_events','ai_provider_credentials','ai_provider_configuration','telegram_product_research_cache'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY',t);
    IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='apfel_park_app') THEN
      EXECUTE format('GRANT SELECT,INSERT,UPDATE,DELETE ON %I TO apfel_park_app',t);
      EXECUTE format('CREATE POLICY server_only ON %I TO apfel_park_app USING(true) WITH CHECK(true)',t);
    END IF;
  END LOOP;
END $$;
-- Events are append-only even for the application role.
CREATE FUNCTION telegram_product_events_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Telegram product audit events are immutable'; END $$;
CREATE TRIGGER telegram_product_events_immutable BEFORE UPDATE OR DELETE ON telegram_product_events
FOR EACH ROW EXECUTE FUNCTION telegram_product_events_immutable();
