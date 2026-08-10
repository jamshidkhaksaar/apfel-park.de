create table if not exists public.marketplace_account_deletion_requests (
  id uuid primary key default uuid_generate_v4(),
  marketplace text not null check (marketplace = 'ebay_de'),
  external_event_id text not null,
  event_date timestamptz,
  publish_date timestamptz,
  publish_attempt_count integer check (publish_attempt_count is null or publish_attempt_count >= 0),
  username_hash text,
  user_id_hash text,
  eias_token_hash text,
  status text not null default 'pending_review' check (
    status in ('pending_review', 'resolved_deleted', 'resolved_retained', 'ignored_test')
  ),
  received_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolution_note text,
  unique (marketplace, external_event_id),
  check (username_hash is not null or user_id_hash is not null or eias_token_hash is not null)
);

create index if not exists marketplace_account_deletion_pending_idx
  on public.marketplace_account_deletion_requests (status, received_at);
