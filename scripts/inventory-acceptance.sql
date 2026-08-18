-- Transactional acceptance checks for the authoritative local inventory
-- ledger. This file always rolls back and is safe to run against production.

begin;

do $$
declare
  v_sku_a text;
  v_sku_b text;
  v_ref text := 'inventory-acceptance-' || gen_random_uuid()::text;
  v_before_a integer;
  v_before_b integer;
  v_after integer;
  v_old_version bigint;
  v_rows integer;
begin
  select selected.sku_a, selected.sku_b
    into v_sku_a, v_sku_b
  from (
    select min(sku) filter (where position = 1) as sku_a,
           min(sku) filter (where position = 2) as sku_b
    from (
      select inventory.sku, row_number() over (order by inventory.sku) as position
      from inventory_skus inventory
      join products product on product.id = inventory.product_id
      where inventory.location = 'local'
        and inventory.is_active = true
        and product.is_active = true
        and available_inventory(inventory.on_hand, inventory.reserved, inventory.safety_buffer) >= 2
      order by inventory.sku
      limit 2
    ) candidates
  ) selected;

  if v_sku_a is null or v_sku_b is null then
    raise exception 'Acceptance test requires two active SKUs with at least two sellable units';
  end if;

  select available_inventory(on_hand, reserved, safety_buffer)
    into v_before_a from inventory_skus
   where sku = v_sku_a and location = 'local' and is_active = true;
  select available_inventory(on_hand, reserved, safety_buffer)
    into v_before_b from inventory_skus
   where sku = v_sku_b and location = 'local' and is_active = true;

  if not reserve_inventory_batch(
    jsonb_build_array(
      jsonb_build_object('sku', v_sku_a, 'quantity', 1),
      jsonb_build_object('sku', v_sku_b, 'quantity', 2)
    ),
    'acceptance_order',
    v_ref,
    'acceptance-test'
  ) then
    raise exception 'Multi-line reservation was rejected unexpectedly';
  end if;

  if not reserve_inventory_batch(
    jsonb_build_array(
      jsonb_build_object('sku', v_sku_a, 'quantity', 1),
      jsonb_build_object('sku', v_sku_b, 'quantity', 2)
    ),
    'acceptance_order',
    v_ref,
    'acceptance-test'
  ) then
    raise exception 'Idempotent reservation replay was rejected';
  end if;

  if (select count(*) from inventory_adjustments adjustment
      join inventory_skus inventory on inventory.id = adjustment.inventory_sku_id
      where adjustment.reference_type = 'acceptance_order'
        and adjustment.reference_id = v_ref
        and adjustment.event_type = 'reservation'
        and inventory.sku in (v_sku_a, v_sku_b)) <> 2 then
    raise exception 'Reservation replay created a duplicate or missed a line';
  end if;

  perform release_inventory_reservation('acceptance_order', v_ref, false);
  perform release_inventory_reservation('acceptance_order', v_ref, false);

  if (select available_inventory(on_hand, reserved, safety_buffer)
      from inventory_skus where sku = v_sku_a and location = 'local') <> v_before_a
     or (select available_inventory(on_hand, reserved, safety_buffer)
         from inventory_skus where sku = v_sku_b and location = 'local') <> v_before_b then
    raise exception 'Cancellation did not restore both SKU availabilities';
  end if;

  select on_hand into v_before_a
    from inventory_skus where sku = v_sku_a and location = 'local' and is_active = true;
  perform * from adjust_inventory(
    v_sku_a, 'shop_sale', 1, 'acceptance_shop_sale', v_ref,
    'acceptance-test', jsonb_build_object('note', 'transactional test')
  );
  perform * from adjust_inventory(
    v_sku_a, 'shop_sale', 1, 'acceptance_shop_sale', v_ref,
    'acceptance-test', jsonb_build_object('note', 'transactional test')
  );
  select on_hand into v_after
    from inventory_skus where sku = v_sku_a and location = 'local' and is_active = true;
  if v_after <> v_before_a - 1 then
    raise exception 'Physical-shop replay decremented inventory more than once';
  end if;

  perform * from adjust_inventory(
    v_sku_a, 'return', 1, 'acceptance_shop_return', v_ref,
    'acceptance-test', '{}'::jsonb
  );

  update marketplace_channel_settings
     set enabled = true, stock_sync_enabled = true
   where marketplace = 'google_merchant';
  select version into v_old_version
    from inventory_skus where sku = v_sku_a and location = 'local' and is_active = true;
  insert into inventory_sync_targets (
    marketplace, sku, desired_quantity, inventory_version, status
  ) values (
    'google_merchant', v_sku_a, v_before_a, v_old_version, 'processing'
  )
  on conflict (marketplace, sku) do update set
    desired_quantity = excluded.desired_quantity,
    inventory_version = excluded.inventory_version,
    status = 'processing';

  update inventory_skus set on_hand = on_hand + 1
   where sku = v_sku_a and location = 'local' and is_active = true;
  update inventory_sync_targets
     set status = 'succeeded'
   where marketplace = 'google_merchant' and sku = v_sku_a
     and inventory_version = v_old_version and status = 'processing';
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then
    raise exception 'A stale remote acknowledgement overwrote newer desired state';
  end if;
  if not exists (
    select 1 from inventory_sync_targets target
     join inventory_skus inventory on inventory.sku = target.sku and inventory.location = 'local'
    where target.marketplace = 'google_merchant' and target.sku = v_sku_a
      and target.inventory_version = inventory.version and target.status = 'queued'
  ) then
    raise exception 'Newer desired inventory state was not preserved';
  end if;

  if exists (
    with ledger as (
      select product_id,
             sum(available_inventory(on_hand, reserved, safety_buffer))::integer as available
      from inventory_skus
      where location = 'local' and is_active = true
      group by product_id
    )
    select 1
    from products product
    left join ledger on ledger.product_id = product.id
    where product.is_active = true
      and product.stock is distinct from coalesce(ledger.available, 0)
  ) then
    raise exception 'A compatibility product stock mirror differs from the ledger';
  end if;

  raise notice 'Inventory acceptance passed for SKUs % and %', v_sku_a, v_sku_b;
end;
$$;

rollback;
