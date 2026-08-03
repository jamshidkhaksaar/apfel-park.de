-- Withdrawal requests submitted via the legally required Widerrufsbutton
-- (mandatory for online shops since 2026-06-19).

create table if not exists public.withdrawal_requests (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  customer_name text not null,
  customer_email text not null,
  order_number text not null,
  received_date text,
  reason text,
  locale text default 'de',
  status text default 'new',
  order_match uuid,
  confirmed_at timestamp with time zone default timezone('utc'::text, now())
);

create index if not exists idx_withdrawal_requests_created_at on public.withdrawal_requests (created_at desc);
create index if not exists idx_withdrawal_requests_status on public.withdrawal_requests (status);
