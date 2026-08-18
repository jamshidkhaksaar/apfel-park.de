-- Admin-entered condition notes are canonical. Imported translations are only
-- valid while one of them still matches that canonical value; otherwise they
-- can make an Open-Box product appear sealed after an admin edit.
UPDATE public.products
SET import_metadata = import_metadata - 'conditionNoteI18n'
WHERE import_metadata ? 'conditionNoteI18n'
  AND NULLIF(btrim(condition_note), '') IS NOT NULL
  AND btrim(condition_note) <> btrim(COALESCE(import_metadata->'conditionNoteI18n'->>'de', ''))
  AND btrim(condition_note) <> btrim(COALESCE(import_metadata->'conditionNoteI18n'->>'en', ''));
