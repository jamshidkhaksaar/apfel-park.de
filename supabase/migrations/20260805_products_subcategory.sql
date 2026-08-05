-- 2,820 of 2,902 products sat in a single "accessories" category, so the admin
-- filters could not narrow anything down. subcategory is derived from the
-- product text by scripts/classify-subcategories.mjs and re-runnable on import.
alter table public.products
  add column if not exists subcategory text;

create index if not exists products_subcategory_idx
  on public.products (subcategory);

create index if not exists products_category_subcategory_idx
  on public.products (category, subcategory);
