SET search_path TO public;

ALTER TABLE telegram_product_assets ADD COLUMN source_type text NOT NULL DEFAULT 'shop_upload';
ALTER TABLE telegram_product_assets ADD COLUMN photo_policy_version integer NOT NULL DEFAULT 0;
ALTER TABLE telegram_product_assets ADD COLUMN quality_verdict jsonb;
ALTER TABLE telegram_product_assets ADD CONSTRAINT telegram_asset_source_type CHECK (source_type IN ('shop_upload','composed_photos','ai_composed_legacy'));
UPDATE telegram_product_assets SET source_type='ai_composed_legacy' WHERE kind='cover';
CREATE INDEX telegram_product_chat_lookup ON telegram_product_events(actor, (details->>'updateId')) WHERE event_type='work_chat';
