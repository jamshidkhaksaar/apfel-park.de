-- Marketplace integration foundation. Inventory mutations are performed through
-- the functions below so reservations remain atomic across sales channels.
create table if not exists public.marketplace_compliance_profiles (
  id uuid primary key default uuid_generate_v4(),
  verified_at timestamptz,
  verified_by text,
  evidence jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inventory_skus (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references public.products(id) on delete cascade,
  sku text not null,
  location text not null default 'local' check (location in ('local', 'amazon_fba')),
  on_hand integer not null default 0 check (on_hand >= 0),
  reserved integer not null default 0 check (reserved >= 0 and reserved <= on_hand),
  safety_buffer integer not null default 1 check (safety_buffer >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (sku, location)
);

create table if not exists public.inventory_adjustments (
  id uuid primary key default uuid_generate_v4(),
  inventory_sku_id uuid not null references public.inventory_skus(id),
  event_type text not null check (event_type in ('seed', 'adjustment', 'reservation', 'release', 'sale', 'return', 'fba_import')),
  quantity_delta integer not null default 0,
  reserved_delta integer not null default 0,
  reference_type text,
  reference_id text,
  actor text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.marketplace_listings (
  id uuid primary key default uuid_generate_v4(),
  sku text not null,
  marketplace text not null check (marketplace in ('amazon_de', 'ebay_de')),
  external_listing_id text,
  external_offer_id text,
  listing_url text,
  status text not null default 'draft' check (status in ('draft', 'queued', 'active', 'inactive', 'error', 'blocked')),
  price numeric(10,2),
  fulfillment_mode text check (fulfillment_mode in ('MFN', 'FBA')),
  schema_version text,
  last_synced_at timestamptz,
  last_error text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (sku, marketplace)
);

create table if not exists public.marketplace_orders (
  id uuid primary key default uuid_generate_v4(),
  marketplace text not null check (marketplace in ('amazon_de', 'ebay_de')),
  external_order_id text not null,
  order_id uuid references public.orders(id) on delete set null,
  fulfillment_mode text,
  status text not null default 'pending',
  raw_payload jsonb not null default '{}'::jsonb,
  imported_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (marketplace, external_order_id)
);

create table if not exists public.marketplace_event_receipts (
  id uuid primary key default uuid_generate_v4(),
  marketplace text not null check (marketplace in ('amazon_de', 'ebay_de')),
  external_event_id text not null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  error text,
  unique (marketplace, external_event_id)
);

create table if not exists public.marketplace_jobs (
  id uuid primary key default uuid_generate_v4(),
  marketplace text not null check (marketplace in ('amazon_de', 'ebay_de')),
  operation text not null check (operation in ('publish', 'unpublish', 'update_price', 'update_availability', 'import_orders', 'confirm_shipment', 'reconcile')),
  sku text,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'queued' check (status in ('queued', 'processing', 'succeeded', 'failed')),
  attempts integer not null default 0,
  run_after timestamptz not null default now(),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products add column if not exists manufacturer jsonb not null default '{}'::jsonb;
alter table public.products add column if not exists eu_responsible_person jsonb not null default '{}'::jsonb;
alter table public.products add column if not exists safety_warnings text[] not null default '{}';
alter table public.products add column if not exists safety_documents text[] not null default '{}';
alter table public.products add column if not exists condition_grade text;
alter table public.products add column if not exists gtin text;
alter table public.products add column if not exists asin text;
alter table public.products add column if not exists ebay_epid text;
alter table public.products add column if not exists marketplace_category_mappings jsonb not null default '{}'::jsonb;

create index if not exists marketplace_jobs_ready_idx on public.marketplace_jobs (status, run_after);
create index if not exists marketplace_listings_status_idx on public.marketplace_listings (marketplace, status);
create index if not exists marketplace_orders_order_idx on public.marketplace_orders (order_id);

create or replace function public.reserve_inventory(p_sku text, p_quantity integer, p_reference_type text, p_reference_id text, p_actor text default null)
returns boolean language plpgsql as $$
declare v_inventory public.inventory_skus%rowtype;
begin
  if exists (select 1 from public.inventory_adjustments where reference_type = p_reference_type and reference_id = p_reference_id and event_type = 'reservation') then return true; end if;
  select * into v_inventory from public.inventory_skus where sku = p_sku and location = 'local' for update;
  if not found or p_quantity <= 0 or (v_inventory.on_hand - v_inventory.reserved - v_inventory.safety_buffer) < p_quantity then return false; end if;
  update public.inventory_skus set reserved = reserved + p_quantity, updated_at = now() where id = v_inventory.id;
  insert into public.inventory_adjustments (inventory_sku_id, event_type, reserved_delta, reference_type, reference_id, actor)
  values (v_inventory.id, 'reservation', p_quantity, p_reference_type, p_reference_id, p_actor);
  return true;
end; $$;

create or replace function public.release_inventory_reservation(p_reference_type text, p_reference_id text, p_to_sold boolean default false)
returns void language plpgsql as $$
declare r record;
begin
  for r in select a.inventory_sku_id, sum(a.reserved_delta) as quantity from public.inventory_adjustments a
    where a.reference_type = p_reference_type and a.reference_id = p_reference_id group by a.inventory_sku_id loop
    update public.inventory_skus set reserved = greatest(0, reserved - r.quantity), on_hand = case when p_to_sold then greatest(0, on_hand - r.quantity) else on_hand end, updated_at = now() where id = r.inventory_sku_id;
    insert into public.inventory_adjustments (inventory_sku_id, event_type, quantity_delta, reserved_delta, reference_type, reference_id)
    values (r.inventory_sku_id, case when p_to_sold then 'sale' else 'release' end, case when p_to_sold then -r.quantity else 0 end, -r.quantity, p_reference_type, p_reference_id);
  end loop;
end; $$;
