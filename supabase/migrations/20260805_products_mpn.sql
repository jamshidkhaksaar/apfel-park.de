-- The sku column held manufacturer part numbers, our own stock codes and
-- auto-generated placeholders all at once, and both the Product JSON-LD and the
-- Google Merchant feed published whatever was in it as the manufacturer part
-- number. mpn separates the two so we stop asserting identifiers that do not exist.
alter table public.products
  add column if not exists mpn text;

create index if not exists products_mpn_idx
  on public.products (mpn);
