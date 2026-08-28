create table if not exists public.public_request_rate_limits (
  action text not null,
  bucket_hash text not null check (length(bucket_hash) = 64),
  count integer not null default 0 check (count >= 0),
  reset_at timestamptz not null,
  updated_at timestamptz not null default now(),
  primary key (action, bucket_hash)
);

create index if not exists public_request_rate_limits_reset_idx
  on public.public_request_rate_limits (reset_at);
