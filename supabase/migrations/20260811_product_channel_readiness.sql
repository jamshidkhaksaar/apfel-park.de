-- Shared catalog facts required by Google Merchant, eBay.de and Amazon.de.
-- Marketplace-specific category schemas remain JSON because their keys change
-- independently, while physical package measurements use constrained numerics.

alter table public.products add column if not exists identifier_status text not null default 'unknown';
alter table public.products add column if not exists country_of_origin text;
alter table public.products add column if not exists package_weight_kg numeric(10,3);
alter table public.products add column if not exists package_length_cm numeric(10,2);
alter table public.products add column if not exists package_width_cm numeric(10,2);
alter table public.products add column if not exists package_height_cm numeric(10,2);
alter table public.products add column if not exists charger_included boolean;
alter table public.products add column if not exists charging_power_min_w numeric(8,2);
alter table public.products add column if not exists charging_power_max_w numeric(8,2);
alter table public.products add column if not exists usb_pd_supported boolean;
alter table public.products add column if not exists battery_details jsonb not null default '{}'::jsonb;
alter table public.products add column if not exists marketplace_attributes jsonb not null default '{}'::jsonb;
alter table public.products add column if not exists amazon_gtin_exemption boolean not null default false;
alter table public.products add column if not exists amazon_renewed_approved boolean not null default false;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'products_identifier_status_check'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
      add constraint products_identifier_status_check
      check (identifier_status in ('unknown', 'assigned', 'not_applicable'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'products_country_of_origin_check'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
      add constraint products_country_of_origin_check
      check (country_of_origin is null or country_of_origin ~ '^[A-Z]{2}$');
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'products_package_measurements_check'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
      add constraint products_package_measurements_check
      check (
        (package_weight_kg is null or package_weight_kg > 0)
        and (package_length_cm is null or package_length_cm > 0)
        and (package_width_cm is null or package_width_cm > 0)
        and (package_height_cm is null or package_height_cm > 0)
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'products_charging_power_check'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
      add constraint products_charging_power_check
      check (
        (charging_power_min_w is null or charging_power_min_w >= 0)
        and (charging_power_max_w is null or charging_power_max_w >= 0)
        and (
          charging_power_min_w is null
          or charging_power_max_w is null
          or charging_power_max_w >= charging_power_min_w
        )
      );
  end if;
end $$;

-- Seed existing active variant SKUs into the shared reservation ledger. A SKU
-- already owned by another product is deliberately left untouched for manual
-- correction instead of being reassigned silently.
insert into public.inventory_skus (product_id, sku, location, on_hand, reserved, safety_buffer)
select
  product.id,
  btrim(variant.value ->> 'sku'),
  'local',
  greatest(
    case
      when coalesce(variant.value ->> 'stock', '') ~ '^\d+$' then (variant.value ->> 'stock')::integer
      else coalesce(product.stock, 0)
    end,
    0
  ),
  0,
  0
from public.products as product
cross join lateral jsonb_array_elements(
  case when jsonb_typeof(product.variants) = 'array' then product.variants else '[]'::jsonb end
) as variant(value)
where product.is_active = true
  and nullif(btrim(variant.value ->> 'sku'), '') is not null
on conflict (sku, location) do update
  set on_hand = greatest(excluded.on_hand, inventory_skus.reserved),
      updated_at = now()
where inventory_skus.product_id = excluded.product_id;
