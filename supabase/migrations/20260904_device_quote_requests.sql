begin;

create table if not exists public.device_quote_requests (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status text not null default 'new' check (status in ('new','quoted','accepted','declined','converted','closed')),
  customer_name text not null,
  email text,
  phone text,
  locale text not null check (locale in ('de','en')),
  brand text not null,
  model text not null,
  condition text not null check (condition in ('new','open_box','used')),
  storage text,
  color text,
  budget text,
  fulfillment text not null check (fulfillment in ('pickup','shipping')),
  consent boolean not null check (consent = true),
  recaptcha_score double precision,
  converted_order_id uuid references public.orders(id) on delete set null,
  check (email is not null or phone is not null)
);

create index if not exists idx_device_quote_requests_created_at
  on public.device_quote_requests (created_at desc);

create index if not exists idx_device_quote_requests_status
  on public.device_quote_requests (status);

alter table public.device_quote_requests enable row level security;

drop policy if exists "Admins can read device quote requests" on public.device_quote_requests;

-- Production's orders table is owned by postgres, so the foreign key above
-- must be created by the owner-migration runner. Hand this application table
-- back to the runtime role afterward. Fresh/dev databases run directly as the
-- application role and do not need an ownership transfer.
do $$
declare
  runtime_role text := nullif(current_setting('apfel.runtime_role', true), '');
begin
  if runtime_role is null or runtime_role = current_user then
    return;
  end if;

  if not exists (select 1 from pg_roles where rolname = runtime_role) then
    raise exception 'Configured device-quote runtime role does not exist';
  end if;

  execute format('alter table public.device_quote_requests owner to %I', runtime_role);
end;
$$;

commit;
