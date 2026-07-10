create table if not exists public.batch_sellers (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  full_name text not null,
  phone text,
  email text,
  notes text
);

create table if not exists public.batch_phones (
  id uuid default uuid_generate_v4() primary key,
  seller_id uuid not null references public.batch_sellers(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  phone_model text not null,
  catalog_brand_id text,
  catalog_family_id text,
  catalog_model_id text,
  imei text not null,
  purchase_date date default current_date not null,
  notes text,
  status text default 'bought' not null check (status in ('bought', 'listed', 'sold', 'returned', 'scrapped'))
);

create index if not exists batch_sellers_created_at_idx on public.batch_sellers (created_at desc);
create index if not exists batch_sellers_name_idx on public.batch_sellers (lower(full_name));
create index if not exists batch_phones_seller_created_at_idx on public.batch_phones (seller_id, created_at desc);
create index if not exists batch_phones_imei_idx on public.batch_phones (imei);
create index if not exists batch_phones_model_idx on public.batch_phones (lower(phone_model));
create unique index if not exists batch_phones_imei_unique_idx on public.batch_phones (imei);

alter table public.batch_sellers enable row level security;
alter table public.batch_phones enable row level security;

do $$
begin
  if to_regnamespace('auth') is not null then
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = 'batch_sellers'
        and policyname = 'Admins can do everything on batch sellers'
    ) then
      create policy "Admins can do everything on batch sellers" on public.batch_sellers
        for all using (auth.role() = 'authenticated');
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = 'batch_phones'
        and policyname = 'Admins can do everything on batch phones'
    ) then
      create policy "Admins can do everything on batch phones" on public.batch_phones
        for all using (auth.role() = 'authenticated');
    end if;
  end if;
end $$;
