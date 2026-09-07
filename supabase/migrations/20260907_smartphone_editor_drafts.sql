SET search_path TO public;

-- Additive, opt-in smartphone workspace. No existing inventory is regrouped.
ALTER TABLE product_families ADD COLUMN smartphone_model_key text UNIQUE;
CREATE TABLE smartphone_editor_drafts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(), revision integer NOT NULL DEFAULT 1,
  document jsonb NOT NULL, sources jsonb NOT NULL DEFAULT '{}'::jsonb,
  results jsonb NOT NULL DEFAULT '[]'::jsonb, family_id uuid REFERENCES product_families(id),
  created_by text NOT NULL, updated_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE smartphone_editor_publications (
  draft_id uuid NOT NULL REFERENCES smartphone_editor_drafts(id), request_id uuid NOT NULL,
  request jsonb NOT NULL, response jsonb NOT NULL, PRIMARY KEY(draft_id, request_id)
);
CREATE TABLE smartphone_editor_assets (
  url text PRIMARY KEY, content_hash text NOT NULL, created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX smartphone_editor_drafts_updated_idx ON smartphone_editor_drafts(updated_at DESC);
ALTER TABLE smartphone_editor_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE smartphone_editor_publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE smartphone_editor_assets ENABLE ROW LEVEL SECURITY;

CREATE TABLE smartphone_editor_photo_claims (
  content_hash text PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES products(id),
  condition text NOT NULL,
  color text NOT NULL
);
ALTER TABLE smartphone_editor_photo_claims ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='apfel_park_app') THEN
    GRANT SELECT,INSERT,UPDATE,DELETE ON smartphone_editor_drafts,smartphone_editor_publications,smartphone_editor_assets,smartphone_editor_photo_claims TO apfel_park_app;
    CREATE POLICY smartphone_drafts_server ON smartphone_editor_drafts TO apfel_park_app USING(true) WITH CHECK(true);
    CREATE POLICY smartphone_publications_server ON smartphone_editor_publications TO apfel_park_app USING(true) WITH CHECK(true);
    CREATE POLICY smartphone_assets_server ON smartphone_editor_assets TO apfel_park_app USING(true) WITH CHECK(true);
    CREATE POLICY smartphone_claims_server ON smartphone_editor_photo_claims TO apfel_park_app USING(true) WITH CHECK(true);
  END IF;
END $$;
