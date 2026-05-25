alter table public.orders
  add column if not exists subtotal_amount decimal(10,2),
  add column if not exists shipping_amount decimal(10,2) default 0,
  add column if not exists vat_rate decimal(5,4) default 0.19,
  add column if not exists vat_amount decimal(10,2) default 0,
  add column if not exists currency text default 'EUR',
  add column if not exists customer_phone text,
  add column if not exists customer_address jsonb,
  add column if not exists shipping_method text default 'pickup',
  add column if not exists provider text,
  add column if not exists provider_order_id text,
  add column if not exists provider_session_id text,
  add column if not exists provider_payment_id text,
  add column if not exists provider_status text,
  add column if not exists idempotency_key text,
  add column if not exists checkout_locale text default 'de',
  add column if not exists consent_mode text,
  add column if not exists paid_at timestamp with time zone,
  add column if not exists cancelled_at timestamp with time zone,
  add column if not exists metadata jsonb default '{}'::jsonb,
  add column if not exists updated_at timestamp with time zone default timezone('utc'::text, now());

drop index if exists orders_idempotency_key_idx;

create unique index if not exists orders_idempotency_key_idx
  on public.orders (idempotency_key);

create index if not exists orders_provider_order_idx
  on public.orders (provider, provider_order_id);

create index if not exists orders_provider_session_idx
  on public.orders (provider, provider_session_id);

create table if not exists public.payment_webhook_events (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  processed_at timestamp with time zone,
  provider text not null,
  provider_event_id text not null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb
);

create unique index if not exists payment_webhook_events_provider_event_idx
  on public.payment_webhook_events (provider, provider_event_id);

create index if not exists payment_webhook_events_processed_idx
  on public.payment_webhook_events (processed_at desc);
