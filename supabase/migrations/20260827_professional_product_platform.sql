-- Professional product experience platform.
-- All storefront sections default disabled/empty and are opt-in from admin.

create table if not exists public.product_families (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  option_axes jsonb not null default '[]'::jsonb,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_family_members (
  family_id uuid not null references public.product_families(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  option_values jsonb not null default '{}'::jsonb,
  position integer not null default 0,
  is_active boolean not null default true,
  primary key (family_id, product_id),
  unique (product_id)
);
create index if not exists product_family_members_family_position_idx
  on public.product_family_members (family_id, position, product_id);

create table if not exists public.product_experience_profiles (
  product_id uuid primary key references public.products(id) on delete cascade,
  enabled_sections jsonb not null default '{}'::jsonb,
  package_contents jsonb not null default '[]'::jsonb,
  condition_guide jsonb not null default '[]'::jsonb,
  refurbishment_steps jsonb not null default '[]'::jsonb,
  trust_points jsonb not null default '[]'::jsonb,
  dimensions jsonb not null default '{}'::jsonb,
  comparison_product_ids uuid[] not null default '{}'::uuid[],
  bundle_product_ids uuid[] not null default '{}'::uuid[],
  campaign jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.product_reviews
  add column if not exists media_urls text[] not null default '{}'::text[],
  add column if not exists admin_note text;

create table if not exists public.store_campaigns (
  id uuid primary key default uuid_generate_v4(),
  code text not null,
  title jsonb not null default '{}'::jsonb,
  description jsonb not null default '{}'::jsonb,
  discount_type text not null check (discount_type in ('percent','fixed')),
  discount_value numeric(10,2) not null check (discount_value > 0),
  minimum_order numeric(10,2) not null default 0 check (minimum_order >= 0),
  eligible_product_ids uuid[] not null default '{}'::uuid[],
  eligible_categories text[] not null default '{}'::text[],
  starts_at timestamptz,
  ends_at timestamptz,
  maximum_redemptions integer check (maximum_redemptions is null or maximum_redemptions > 0),
  redemption_count integer not null default 0 check (redemption_count >= 0),
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);
create unique index if not exists store_campaigns_code_lower_key
  on public.store_campaigns (lower(code));
create index if not exists store_campaigns_active_window_idx
  on public.store_campaigns (is_active, starts_at, ends_at);

alter table public.orders
  add column if not exists coupon_code text,
  add column if not exists discount_amount numeric(10,2) not null default 0 check (discount_amount >= 0);

create table if not exists public.campaign_redemptions (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid not null references public.store_campaigns(id) on delete restrict,
  order_id uuid not null references public.orders(id) on delete cascade,
  discount_amount numeric(10,2) not null check (discount_amount >= 0),
  created_at timestamptz not null default now(),
  unique (campaign_id, order_id)
);

create table if not exists public.trade_in_requests (
  id uuid primary key default uuid_generate_v4(),
  status text not null default 'new' check (status in ('new','reviewing','quoted','accepted','declined','closed')),
  customer_name text not null,
  email text not null,
  phone text,
  locale text not null default 'de' check (locale in ('de','en')),
  device jsonb not null default '{}'::jsonb,
  condition_notes text,
  image_urls text[] not null default '{}'::text[],
  quote_amount numeric(10,2) check (quote_amount is null or quote_amount >= 0),
  admin_note text,
  consent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists trade_in_requests_status_created_idx
  on public.trade_in_requests (status, created_at desc);
