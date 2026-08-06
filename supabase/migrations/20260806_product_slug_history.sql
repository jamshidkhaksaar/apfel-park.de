-- Old product slugs, kept so a URL that was indexed, bookmarked or shared
-- still resolves. When a product's slug changes (URL migration, re-slugging
-- from a timestamped slug) the previous value is written here and the product
-- page issues a permanent 301 to the current slug.
create table if not exists public.product_slug_history (
  old_slug   text primary key,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists product_slug_history_product_id_idx
  on public.product_slug_history (product_id);
