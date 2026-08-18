-- Make the local SKU ledger authoritative and emit versioned desired-state
-- records for every approved, enabled sales channel.

alter table public.inventory_skus
  add column if not exists version bigint not null default 1,
  add column if not exists is_active boolean not null default true;

-- Retain retired SKU rows and their adjustment history, but remove them from
-- sellable inventory. This also cleans up legacy placeholders such as "N/A"
-- after a real SKU was assigned to the product.
with desired_skus as (
  select product.id as product_id, btrim(unit.sku) as sku
  from public.products product
  cross join lateral (
    select variant.value ->> 'sku' as sku
    from jsonb_array_elements(
      case
        when product.is_active = true
         and case
           when jsonb_typeof(product.variants) = 'array' then jsonb_array_length(product.variants) > 0
           else false
         end
          then product.variants
        else '[]'::jsonb
      end
    ) variant(value)
    union all
    select product.sku
    where product.is_active = true
      and not case
        when jsonb_typeof(product.variants) = 'array' then jsonb_array_length(product.variants) > 0
        else false
      end
  ) unit
  where nullif(btrim(unit.sku), '') is not null
)
update public.inventory_skus inventory
set is_active = exists (
      select 1 from desired_skus desired
      where desired.product_id = inventory.product_id and desired.sku = inventory.sku
    ),
    on_hand = case
      when exists (
        select 1 from desired_skus desired
        where desired.product_id = inventory.product_id and desired.sku = inventory.sku
      ) then inventory.on_hand
      else inventory.reserved
    end,
    updated_at = now()
where inventory.location = 'local';

create index if not exists inventory_skus_product_location_idx
  on public.inventory_skus (product_id, location);

create index if not exists inventory_adjustments_reference_idx
  on public.inventory_adjustments (reference_type, reference_id, inventory_sku_id);

create unique index if not exists marketplace_jobs_one_open_idx
  on public.marketplace_jobs (marketplace, operation, (coalesce(sku, '')))
  where status in ('queued', 'processing');

-- One reservation and one terminal sale/release event per SKU and external
-- reference makes webhook and payment retries idempotent without preventing a
-- multi-line order from reserving every SKU.
create unique index if not exists inventory_adjustments_reservation_once_idx
  on public.inventory_adjustments (inventory_sku_id, reference_type, reference_id)
  where event_type = 'reservation' and reference_type is not null and reference_id is not null;

create unique index if not exists inventory_adjustments_terminal_once_idx
  on public.inventory_adjustments (inventory_sku_id, reference_type, reference_id)
  where event_type in ('sale', 'release') and reference_type is not null and reference_id is not null;

create table if not exists public.marketplace_channel_settings (
  marketplace text primary key check (marketplace in ('google_merchant', 'ebay_de', 'amazon_de')),
  enabled boolean not null default false,
  stock_sync_enabled boolean not null default false,
  price_sync_enabled boolean not null default false,
  order_sync_enabled boolean not null default false,
  price_markup_percent numeric(8,4) not null default 0,
  price_markup_fixed numeric(10,2) not null default 0,
  price_rule_confirmed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.marketplace_channel_settings (marketplace)
values ('google_merchant'), ('ebay_de'), ('amazon_de')
on conflict (marketplace) do nothing;

alter table public.marketplace_listings
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by text,
  add column if not exists sync_stock boolean not null default true,
  add column if not exists sync_price boolean not null default true;

create table if not exists public.inventory_sync_targets (
  marketplace text not null check (marketplace in ('google_merchant', 'ebay_de', 'amazon_de')),
  sku text not null,
  desired_quantity integer not null check (desired_quantity >= 0),
  inventory_version bigint not null,
  status text not null default 'queued' check (status in ('queued', 'processing', 'succeeded', 'failed')),
  attempts integer not null default 0,
  run_after timestamptz not null default now(),
  last_synced_quantity integer,
  last_synced_version bigint,
  last_synced_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (marketplace, sku)
);

create index if not exists inventory_sync_targets_ready_idx
  on public.inventory_sync_targets (status, run_after, updated_at);

create or replace function public.available_inventory(p_on_hand integer, p_reserved integer, p_safety_buffer integer)
returns integer
language sql
immutable
parallel safe
as $$
  select greatest(0, coalesce(p_on_hand, 0) - coalesce(p_reserved, 0) - coalesce(p_safety_buffer, 0));
$$;

create or replace function public.bump_inventory_version()
returns trigger
language plpgsql
as $$
begin
  if row(new.on_hand, new.reserved, new.safety_buffer, new.is_active)
     is distinct from row(old.on_hand, old.reserved, old.safety_buffer, old.is_active) then
    new.version := old.version + 1;
    new.updated_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists inventory_skus_version_trigger on public.inventory_skus;
create trigger inventory_skus_version_trigger
before update of on_hand, reserved, safety_buffer, is_active on public.inventory_skus
for each row execute function public.bump_inventory_version();

create or replace function public.queue_inventory_sync(p_sku text)
returns text[]
language plpgsql
as $$
declare
  v_inventory public.inventory_skus%rowtype;
  v_available integer;
  v_channels text[] := '{}';
  v_channel record;
begin
  select * into v_inventory
  from public.inventory_skus
  where sku = p_sku and location = 'local';

  if not found then
    return v_channels;
  end if;

  v_available := case
    when v_inventory.is_active then public.available_inventory(
      v_inventory.on_hand,
      v_inventory.reserved,
      v_inventory.safety_buffer
    )
    else 0
  end;

  for v_channel in
    select settings.marketplace
    from public.marketplace_channel_settings settings
    where settings.enabled = true
      and settings.stock_sync_enabled = true
      and (
        settings.marketplace = 'google_merchant'
        or exists (
          select 1
          from public.marketplace_listings listing
          where listing.marketplace = settings.marketplace
            and listing.sku = p_sku
            and listing.approved_at is not null
            and listing.sync_stock = true
            and listing.status in ('queued', 'active', 'inactive', 'error')
        )
      )
  loop
    insert into public.inventory_sync_targets (
      marketplace, sku, desired_quantity, inventory_version, status, attempts,
      run_after, last_error, updated_at
    ) values (
      v_channel.marketplace, p_sku, v_available, v_inventory.version, 'queued', 0,
      now(), null, now()
    )
    on conflict (marketplace, sku) do update set
      desired_quantity = excluded.desired_quantity,
      inventory_version = excluded.inventory_version,
      status = case
        when inventory_sync_targets.inventory_version = excluded.inventory_version
         and inventory_sync_targets.desired_quantity = excluded.desired_quantity
          then inventory_sync_targets.status
        else 'queued'
      end,
      attempts = case
        when inventory_sync_targets.inventory_version = excluded.inventory_version
         and inventory_sync_targets.desired_quantity = excluded.desired_quantity
          then inventory_sync_targets.attempts
        else 0
      end,
      run_after = case
        when inventory_sync_targets.inventory_version = excluded.inventory_version
         and inventory_sync_targets.desired_quantity = excluded.desired_quantity
          then inventory_sync_targets.run_after
        else now()
      end,
      last_error = case
        when inventory_sync_targets.inventory_version = excluded.inventory_version
         and inventory_sync_targets.desired_quantity = excluded.desired_quantity
          then inventory_sync_targets.last_error
        else null
      end,
      updated_at = now();

    v_channels := array_append(v_channels, v_channel.marketplace);
  end loop;

  return v_channels;
end;
$$;

create or replace function public.mirror_inventory_to_product()
returns trigger
language plpgsql
as $$
declare
  v_product_stock integer;
  v_variants jsonb;
begin
  if new.product_id is null or new.location <> 'local' then
    return new;
  end if;

  select coalesce(sum(public.available_inventory(on_hand, reserved, safety_buffer)), 0)::integer
  into v_product_stock
  from public.inventory_skus
  where product_id = new.product_id and location = 'local' and is_active = true;

  select coalesce(
    jsonb_agg(
      case
        when inventory.id is null then variant.value
        else jsonb_set(
          variant.value,
          '{stock}',
          to_jsonb(public.available_inventory(inventory.on_hand, inventory.reserved, inventory.safety_buffer)),
          true
        )
      end
      order by variant.ordinality
    ),
    '[]'::jsonb
  )
  into v_variants
  from public.products product
  cross join lateral jsonb_array_elements(
    case when jsonb_typeof(product.variants) = 'array' then product.variants else '[]'::jsonb end
  ) with ordinality as variant(value, ordinality)
  left join public.inventory_skus inventory
    on inventory.product_id = product.id
   and inventory.location = 'local'
   and inventory.is_active = true
   and inventory.sku = nullif(btrim(variant.value ->> 'sku'), '')
  where product.id = new.product_id;

  update public.products product
  set stock = v_product_stock,
      variants = case
        when jsonb_typeof(product.variants) = 'array' and jsonb_array_length(product.variants) > 0
          then v_variants
        else product.variants
      end,
      updated_at = now()
  where product.id = new.product_id;

  perform public.queue_inventory_sync(new.sku);
  return new;
end;
$$;

drop trigger if exists inventory_skus_mirror_trigger on public.inventory_skus;
create trigger inventory_skus_mirror_trigger
after insert or update of on_hand, reserved, safety_buffer, is_active on public.inventory_skus
for each row execute function public.mirror_inventory_to_product();

create or replace function public.reserve_inventory_batch(
  p_items jsonb,
  p_reference_type text,
  p_reference_id text,
  p_actor text default null
)
returns boolean
language plpgsql
as $$
declare
  r record;
  v_inventory public.inventory_skus%rowtype;
  v_existing integer;
begin
  if p_reference_type is null or btrim(p_reference_type) = ''
     or p_reference_id is null or btrim(p_reference_id) = ''
     or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0 then
    return false;
  end if;

  -- Lock in SKU order to make concurrent carts deterministic and deadlock-safe.
  for r in
    select btrim(item.sku) as sku, sum(item.quantity)::integer as quantity
    from jsonb_to_recordset(p_items) as item(sku text, quantity integer)
    group by btrim(item.sku)
    order by btrim(item.sku)
  loop
    if r.sku is null or r.sku = '' or r.quantity is null or r.quantity <= 0 then
      return false;
    end if;

    select * into v_inventory
    from public.inventory_skus
    where sku = r.sku and location = 'local' and is_active = true
    for update;

    if not found then
      return false;
    end if;

    if exists (
      select 1
      from public.inventory_adjustments terminal
      where terminal.inventory_sku_id = v_inventory.id
        and terminal.reference_type = p_reference_type
        and terminal.reference_id = p_reference_id
        and terminal.event_type in ('sale', 'release')
    ) then
      raise exception 'Reservation % has already been completed for SKU %', p_reference_id, r.sku;
    end if;

    select coalesce(sum(reserved_delta), 0)::integer
    into v_existing
    from public.inventory_adjustments
    where inventory_sku_id = v_inventory.id
      and reference_type = p_reference_type
      and reference_id = p_reference_id
      and event_type = 'reservation';

    if v_existing > 0 and v_existing <> r.quantity then
      raise exception 'Reservation quantity mismatch for SKU %', r.sku;
    end if;

    if v_existing = 0
       and public.available_inventory(v_inventory.on_hand, v_inventory.reserved, v_inventory.safety_buffer) < r.quantity then
      return false;
    end if;
  end loop;

  for r in
    select btrim(item.sku) as sku, sum(item.quantity)::integer as quantity
    from jsonb_to_recordset(p_items) as item(sku text, quantity integer)
    group by btrim(item.sku)
    order by btrim(item.sku)
  loop
    select * into v_inventory
    from public.inventory_skus
    where sku = r.sku and location = 'local' and is_active = true
    for update;

    if not exists (
      select 1
      from public.inventory_adjustments
      where inventory_sku_id = v_inventory.id
        and reference_type = p_reference_type
        and reference_id = p_reference_id
        and event_type = 'reservation'
    ) then
      update public.inventory_skus
      set reserved = reserved + r.quantity
      where id = v_inventory.id;

      insert into public.inventory_adjustments (
        inventory_sku_id, event_type, reserved_delta,
        reference_type, reference_id, actor
      ) values (
        v_inventory.id, 'reservation', r.quantity,
        p_reference_type, p_reference_id, p_actor
      );
    end if;
  end loop;

  return true;
end;
$$;

create or replace function public.reserve_inventory(
  p_sku text,
  p_quantity integer,
  p_reference_type text,
  p_reference_id text,
  p_actor text default null
)
returns boolean
language sql
as $$
  select public.reserve_inventory_batch(
    jsonb_build_array(jsonb_build_object('sku', p_sku, 'quantity', p_quantity)),
    p_reference_type,
    p_reference_id,
    p_actor
  );
$$;

create or replace function public.release_inventory_reservation(
  p_reference_type text,
  p_reference_id text,
  p_to_sold boolean default false
)
returns void
language plpgsql
as $$
declare
  r record;
  v_terminal_inserted boolean;
begin
  for r in
    select adjustment.inventory_sku_id, sum(adjustment.reserved_delta)::integer as quantity
    from public.inventory_adjustments adjustment
    where adjustment.reference_type = p_reference_type
      and adjustment.reference_id = p_reference_id
      and adjustment.event_type = 'reservation'
      and not exists (
        select 1
        from public.inventory_adjustments terminal
        where terminal.inventory_sku_id = adjustment.inventory_sku_id
          and terminal.reference_type = p_reference_type
          and terminal.reference_id = p_reference_id
          and terminal.event_type in ('sale', 'release')
      )
    group by adjustment.inventory_sku_id
    order by adjustment.inventory_sku_id
  loop
    v_terminal_inserted := false;
    insert into public.inventory_adjustments (
      inventory_sku_id, event_type, quantity_delta, reserved_delta,
      reference_type, reference_id, metadata
    ) values (
      r.inventory_sku_id,
      case when p_to_sold then 'sale' else 'release' end,
      case when p_to_sold then -r.quantity else 0 end,
      -r.quantity,
      p_reference_type,
      p_reference_id,
      jsonb_build_object('terminalAction', case when p_to_sold then 'sale' else 'release' end)
    )
    on conflict do nothing
    returning true into v_terminal_inserted;

    -- Insert the terminal marker first. The partial unique index lets only one
    -- concurrent webhook win, so inventory can never be decremented twice.
    if coalesce(v_terminal_inserted, false) then
      update public.inventory_skus
      set reserved = greatest(0, reserved - r.quantity),
          on_hand = case when p_to_sold then greatest(0, on_hand - r.quantity) else on_hand end
      where id = r.inventory_sku_id;
    end if;
  end loop;
end;
$$;

create or replace function public.adjust_inventory(
  p_sku text,
  p_adjustment_type text,
  p_quantity integer,
  p_reference_type text,
  p_reference_id text,
  p_actor text,
  p_metadata jsonb default '{}'::jsonb
)
returns table (
  sku text,
  on_hand integer,
  reserved integer,
  available integer,
  version bigint
)
language plpgsql
as $$
declare
  v_inventory public.inventory_skus%rowtype;
  v_existing public.inventory_adjustments%rowtype;
  v_delta integer;
  v_event_type text;
begin
  if p_reference_type is null or btrim(p_reference_type) = ''
     or p_reference_id is null or btrim(p_reference_id) = '' then
    raise exception 'An idempotency reference is required';
  end if;

  if p_adjustment_type in ('shop_sale', 'marketplace_sale') then
    if p_quantity <= 0 then raise exception 'Sale quantity must be positive'; end if;
    v_delta := -p_quantity;
    v_event_type := 'sale';
  elsif p_adjustment_type = 'restock' then
    if p_quantity <= 0 then raise exception 'Restock quantity must be positive'; end if;
    v_delta := p_quantity;
    v_event_type := 'adjustment';
  elsif p_adjustment_type = 'return' then
    if p_quantity <= 0 then raise exception 'Return quantity must be positive'; end if;
    v_delta := p_quantity;
    v_event_type := 'return';
  elsif p_adjustment_type = 'correction' then
    if p_quantity = 0 then raise exception 'Correction quantity cannot be zero'; end if;
    v_delta := p_quantity;
    v_event_type := 'adjustment';
  else
    raise exception 'Unsupported inventory adjustment type';
  end if;

  select * into v_inventory
  from public.inventory_skus inventory
  where inventory.sku = btrim(p_sku) and inventory.location = 'local' and inventory.is_active = true
  for update;

  if not found then
    raise exception 'Unknown inventory SKU %', p_sku;
  end if;

  -- The inventory row lock serializes replays for this SKU. Treat an exact
  -- replay as success, but reject reuse of an idempotency key with different
  -- data so a client bug cannot silently create a second movement.
  select adjustment.* into v_existing
  from public.inventory_adjustments adjustment
  where adjustment.inventory_sku_id = v_inventory.id
    and adjustment.reference_type = p_reference_type
    and adjustment.reference_id = p_reference_id
  order by adjustment.created_at
  limit 1;

  if found then
    if v_existing.event_type <> v_event_type
       or v_existing.quantity_delta <> v_delta
       or coalesce(v_existing.metadata ->> 'adjustmentType', '') <> p_adjustment_type then
      raise exception 'Idempotency reference % was already used with different inventory data', p_reference_id;
    end if;

    return query
      select inventory.sku, inventory.on_hand, inventory.reserved,
             public.available_inventory(inventory.on_hand, inventory.reserved, inventory.safety_buffer),
             inventory.version
      from public.inventory_skus inventory
      where inventory.id = v_inventory.id;
    return;
  end if;

  if v_inventory.on_hand + v_delta < v_inventory.reserved then
    raise exception 'Insufficient unreserved stock for SKU %', p_sku;
  end if;

  update public.inventory_skus inventory
  set on_hand = inventory.on_hand + v_delta
  where inventory.id = v_inventory.id;

  insert into public.inventory_adjustments (
    inventory_sku_id, event_type, quantity_delta,
    reference_type, reference_id, actor, metadata
  ) values (
    v_inventory.id, v_event_type, v_delta,
    p_reference_type, p_reference_id, p_actor,
    coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object('adjustmentType', p_adjustment_type)
  );

  return query
    select inventory.sku, inventory.on_hand, inventory.reserved,
           public.available_inventory(inventory.on_hand, inventory.reserved, inventory.safety_buffer),
           inventory.version
    from public.inventory_skus inventory
    where inventory.id = v_inventory.id;
end;
$$;

-- Rebuild compatibility stock fields from the ledger without changing any
-- physical quantity. The trigger is intentionally responsible for this so all
-- future mutation paths stay consistent.
update public.inventory_skus
set on_hand = on_hand
where location = 'local';
