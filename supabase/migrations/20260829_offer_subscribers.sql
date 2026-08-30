create table if not exists public.offer_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  locale text not null default 'de' check (locale in ('de', 'en')),
  confirmed_at timestamptz,
  confirmation_token_hash text,
  confirmation_sent_at timestamptz,
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists offer_subscribers_confirmed_idx
  on public.offer_subscribers (confirmed_at)
  where confirmed_at is not null and unsubscribed_at is null;

create index if not exists offer_subscribers_confirmation_token_idx
  on public.offer_subscribers (confirmation_token_hash)
  where confirmation_token_hash is not null;
