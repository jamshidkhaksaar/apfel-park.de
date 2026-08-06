-- Per-product FAQ, rendered on the product page and emitted as FAQPage
-- JSON-LD. Stored as { de: [{q, a}], en: [{q, a}] } like the *_i18n columns.
alter table public.products
  add column if not exists faq jsonb;
