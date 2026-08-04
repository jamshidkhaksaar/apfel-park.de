-- products had no modification timestamp, so the admin catalog rendered
-- created_at under a "Zuletzt geändert" / "Recently updated" heading and the
-- "recently updated" sort actually ordered by creation date.
alter table public.products
  add column if not exists updated_at timestamptz;

update public.products
   set updated_at = created_at
 where updated_at is null;

alter table public.products
  alter column updated_at set default now();

alter table public.products
  alter column updated_at set not null;

create index if not exists products_updated_at_idx
  on public.products (updated_at desc);
