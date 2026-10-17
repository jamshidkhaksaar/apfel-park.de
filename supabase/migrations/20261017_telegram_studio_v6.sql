SET search_path TO public;

-- Per-photo studio flow (v6): the requested camera angle is stored on the asset
-- so the retouch worker can retouch it as exactly that view and so the hero
-- cover can be composed from the approved back + front retouches.
ALTER TABLE telegram_product_assets ADD COLUMN requested_angle text;

-- Vision can reject an upload ("retake"): the photo is stored, never edited,
-- and the seller is asked to re-shoot that side.
ALTER TABLE telegram_product_assets DROP CONSTRAINT IF EXISTS telegram_product_assets_status_check;
ALTER TABLE telegram_product_assets ADD CONSTRAINT telegram_product_assets_status_check
  CHECK (status IN ('queued','ready','failed','approved','original','retake'));

-- Hero cover is a generated, approved draft image of its own kind.
ALTER TABLE telegram_product_assets DROP CONSTRAINT IF EXISTS telegram_product_assets_kind_check;
ALTER TABLE telegram_product_assets ADD CONSTRAINT telegram_product_assets_kind_check
  CHECK (kind IN ('device','box','barcode_label','about_screen','battery_health','cover'));
