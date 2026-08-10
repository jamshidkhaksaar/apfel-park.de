-- Encrypted OAuth connection state for seller-owned marketplace accounts.
-- Access and refresh tokens are encrypted in the application before storage;
-- the encryption key remains in the protected VPS environment file.
create table if not exists public.marketplace_connections (
  id uuid primary key default uuid_generate_v4(),
  marketplace text not null check (marketplace in ('amazon_de', 'ebay_de')),
  environment text not null check (environment in ('sandbox', 'production')),
  access_token_ciphertext text not null,
  refresh_token_ciphertext text not null,
  access_token_expires_at timestamptz not null,
  refresh_token_expires_at timestamptz not null,
  scopes text[] not null default '{}',
  token_type text,
  connected_by text,
  connected_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (marketplace, environment)
);

create index if not exists marketplace_connections_expiry_idx
  on public.marketplace_connections (marketplace, environment, refresh_token_expires_at);

comment on table public.marketplace_connections is
  'Marketplace OAuth tokens encrypted with MARKETPLACE_TOKEN_ENCRYPTION_KEY before storage.';
