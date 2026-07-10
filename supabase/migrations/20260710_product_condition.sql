-- Adds a product condition field so open-box / unboxed items can be flagged.
-- Values: 'new' (default), 'refurbished', 'used'. "Open-Box" = condition <> 'new'.

alter table public.products
  add column if not exists condition text not null default 'new';
