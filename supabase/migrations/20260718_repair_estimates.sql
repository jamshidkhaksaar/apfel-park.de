create table if not exists public.repair_estimate_counters (
  year integer primary key,
  last_value integer not null default 0,
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.repair_estimates (
  id uuid primary key default uuid_generate_v4(),
  estimate_number text not null unique,
  repair_id uuid references public.repairs(id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'issued', 'accepted', 'declined', 'expired')),
  language text not null default 'de' check (language in ('de', 'en')),
  customer_name text not null default '',
  customer_email text,
  insurer_name text,
  device_label text not null default '',
  claim_number text,
  draft_payload jsonb not null default '{}'::jsonb,
  current_revision integer not null default 0,
  version_token integer not null default 1,
  created_by text not null,
  updated_by text not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index if not exists repair_estimates_updated_at_idx on public.repair_estimates (updated_at desc);
create index if not exists repair_estimates_status_idx on public.repair_estimates (status);
create index if not exists repair_estimates_repair_id_idx on public.repair_estimates (repair_id);

create table if not exists public.repair_estimate_versions (
  id uuid primary key default uuid_generate_v4(),
  estimate_id uuid not null references public.repair_estimates(id) on delete cascade,
  revision integer not null,
  payload jsonb not null,
  totals jsonb not null,
  pdf_path text not null,
  pdf_sha256 text not null,
  pdf_size_bytes integer not null,
  issued_by text not null,
  issued_at timestamp with time zone not null default now(),
  unique (estimate_id, revision)
);

create index if not exists repair_estimate_versions_estimate_idx
  on public.repair_estimate_versions (estimate_id, revision desc);

create table if not exists public.repair_estimate_deliveries (
  id uuid primary key default uuid_generate_v4(),
  estimate_version_id uuid not null references public.repair_estimate_versions(id) on delete cascade,
  recipients jsonb not null,
  delivery_status text not null check (delivery_status in ('sent', 'failed')),
  provider_error text,
  sent_by text not null,
  sent_at timestamp with time zone not null default now()
);

create index if not exists repair_estimate_deliveries_version_idx
  on public.repair_estimate_deliveries (estimate_version_id, sent_at desc);

insert into public.store_settings (key, value, updated_at)
values (
  'repair_estimate_template',
  jsonb_build_object(
    'issuerText', 'Apfel Park',
    'bankName', 'Sparkasse Holstein',
    'accountHolder', '',
    'iban', 'DE82 2135 2240 0187 9906 92',
    'bic', 'NOLADE21HOL',
    'vatRateBps', 1900,
    'validityDays', 30
  ),
  now()
)
on conflict (key) do nothing;
