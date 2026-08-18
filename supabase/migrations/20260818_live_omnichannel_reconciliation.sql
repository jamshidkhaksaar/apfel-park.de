-- Periodic drift repair for the compatibility stock mirrors and versioned
-- channel desired-state cache. The ledger remains the only source of truth.

create or replace function public.reconcile_inventory_mirrors()
returns integer
language plpgsql
as $$
declare
  v_repaired integer := 0;
begin
  with ledger as (
    select inventory.product_id,
           sum(public.available_inventory(
             inventory.on_hand,
             inventory.reserved,
             inventory.safety_buffer
           ))::integer as available
      from public.inventory_skus inventory
     where inventory.location = 'local' and inventory.is_active = true
     group by inventory.product_id
  ), mismatched_products as (
    select product.id
      from public.products product
      left join ledger on ledger.product_id = product.id
     where product.is_active = true
       and (
         product.stock is distinct from coalesce(ledger.available, 0)
         or exists (
           select 1
             from jsonb_array_elements(
               case
                 when jsonb_typeof(product.variants) = 'array' then product.variants
                 else '[]'::jsonb
               end
             ) as variant(value)
             left join public.inventory_skus inventory
               on inventory.product_id = product.id
              and inventory.location = 'local'
              and inventory.is_active = true
              and inventory.sku = nullif(btrim(variant.value ->> 'sku'), '')
            where nullif(btrim(variant.value ->> 'sku'), '') is not null
              and (
                case
                  when coalesce(variant.value ->> 'stock', '') ~ '^-?[0-9]+$'
                    then (variant.value ->> 'stock')::integer
                  else 0
                end
              ) is distinct from coalesce(
                public.available_inventory(
                  inventory.on_hand,
                  inventory.reserved,
                  inventory.safety_buffer
                ),
                0
              )
         )
       )
  ), refresh_rows as (
    select distinct on (inventory.product_id) inventory.id
      from public.inventory_skus inventory
      join mismatched_products mismatch on mismatch.id = inventory.product_id
     where inventory.location = 'local' and inventory.is_active = true
     order by inventory.product_id, inventory.sku
  ), refreshed as (
    update public.inventory_skus inventory
       set on_hand = inventory.on_hand
      from refresh_rows refresh
     where inventory.id = refresh.id
     returning 1
  )
  select count(*)::integer into v_repaired from refreshed;

  return coalesce(v_repaired, 0);
end;
$$;

create or replace function public.reconcile_inventory_sync_targets()
returns integer
language plpgsql
as $$
declare
  v_sku text;
  v_queued integer := 0;
begin
  for v_sku in
    select inventory.sku
      from public.inventory_skus inventory
      join public.products product on product.id = inventory.product_id
     where inventory.location = 'local'
       and inventory.is_active = true
       and product.is_active = true
       and exists (
         select 1
           from public.marketplace_channel_settings settings
          where settings.enabled = true
            and settings.stock_sync_enabled = true
            and (
              settings.marketplace = 'google_merchant'
              or exists (
                select 1
                  from public.marketplace_listings listing
                 where listing.marketplace = settings.marketplace
                   and listing.sku = inventory.sku
                   and listing.approved_at is not null
                   and listing.sync_stock = true
                   and listing.status in ('queued', 'active', 'inactive', 'error')
              )
            )
            and not exists (
              select 1
                from public.inventory_sync_targets target
               where target.marketplace = settings.marketplace
                 and target.sku = inventory.sku
                 and target.inventory_version = inventory.version
                 and target.desired_quantity = public.available_inventory(
                   inventory.on_hand,
                   inventory.reserved,
                   inventory.safety_buffer
                 )
            )
       )
  loop
    perform public.queue_inventory_sync(v_sku);
    v_queued := v_queued + 1;
  end loop;

  return v_queued;
end;
$$;
