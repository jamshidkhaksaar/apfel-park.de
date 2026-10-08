SET search_path TO public;

-- Preserve publication receipts while removing discarded workspaces from use.
ALTER TABLE smartphone_editor_drafts ADD COLUMN deleted_at timestamptz;
CREATE INDEX smartphone_editor_drafts_open_updated_idx
  ON smartphone_editor_drafts(updated_at DESC) WHERE deleted_at IS NULL;
