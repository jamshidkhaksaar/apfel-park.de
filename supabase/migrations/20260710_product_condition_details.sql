-- Keep the product condition explicit for customer-facing disclosures.
alter table public.products
  add column if not exists battery_health smallint,
  add column if not exists has_real_product_photos boolean not null default false,
  add column if not exists condition_note text;

update public.products
set condition = 'open_box'
where condition = 'refurbished';

alter table public.products
  drop constraint if exists products_condition_check;

alter table public.products
  add constraint products_condition_check
  check (condition in ('new', 'open_box', 'used'));

alter table public.products
  add constraint products_battery_health_check
  check (battery_health is null or battery_health between 1 and 100);
