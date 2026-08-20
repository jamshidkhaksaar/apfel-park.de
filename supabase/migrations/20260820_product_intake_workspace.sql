-- Unified Products + AI Intake workspace.
-- Additive: existing shadow intake runs remain valid. Live apply stays gated
-- by PRODUCT_INTAKE_LIVE_ENABLED. This migration never enables catalog mutation.

alter table public.product_intake_runs
  add column if not exists origin_product_id uuid references public.products(id) on delete set null,
  add column if not exists base_snapshot jsonb not null default '{}'::jsonb,
  add column if not exists base_snapshot_hash text,
  add column if not exists inventory_version bigint,
  add column if not exists requested_scopes jsonb not null default '[]'::jsonb,
  add column if not exists dispatch_status text not null default 'queued',
  add column if not exists accepted_paths jsonb not null default '[]'::jsonb,
  add column if not exists accepted_hash text,
  add column if not exists stale_at timestamptz,
  add column if not exists stale_reason text;

alter table public.product_intake_runs
  drop constraint if exists product_intake_runs_dispatch_status_check;

alter table public.product_intake_runs
  add constraint product_intake_runs_dispatch_status_check
    check (dispatch_status in (
      'queued',
      'collecting',
      'ready_for_review',
      'shadow',
      'stale',
      'applied',
      'blocked',
      'rejected',
      'cancelled'
    ));

alter table public.product_intake_runs
  drop constraint if exists product_intake_runs_scopes_check;

alter table public.product_intake_runs
  add constraint product_intake_runs_scopes_check
    check (jsonb_typeof(requested_scopes) = 'array');

alter table public.product_intake_runs
  drop constraint if exists product_intake_runs_accepted_paths_check;

alter table public.product_intake_runs
  add constraint product_intake_runs_accepted_paths_check
    check (jsonb_typeof(accepted_paths) = 'array');

alter table public.product_intake_runs
  drop constraint if exists product_intake_runs_snapshot_hash_check;

alter table public.product_intake_runs
  add constraint product_intake_runs_snapshot_hash_check
    check (base_snapshot_hash is null or base_snapshot_hash ~ '^[a-f0-9]{64}$');

alter table public.product_intake_runs
  drop constraint if exists product_intake_runs_accepted_hash_check;

alter table public.product_intake_runs
  add constraint product_intake_runs_accepted_hash_check
    check (accepted_hash is null or accepted_hash ~ '^[a-f0-9]{64}$');

alter table public.product_intake_runs
  drop constraint if exists product_intake_runs_snapshot_redacted_check;

alter table public.product_intake_runs
  add constraint product_intake_runs_snapshot_redacted_check
    check (public.product_intake_json_is_redacted(base_snapshot));

create index if not exists product_intake_runs_origin_product_idx
  on public.product_intake_runs (origin_product_id, updated_at desc)
  where origin_product_id is not null;

create index if not exists product_intake_runs_target_product_idx
  on public.product_intake_runs (target_product_id, updated_at desc)
  where target_product_id is not null;

create table if not exists public.product_revisions (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references public.products(id) on delete restrict,
  run_id uuid references public.product_intake_runs(id) on delete set null,
  revision_number integer not null,
  actor_type text not null,
  actor_id text not null,
  before_snapshot jsonb not null,
  after_snapshot jsonb not null,
  changed_paths text[] not null default '{}'::text[],
  accepted_hash text,
  mode text not null default 'shadow',
  created_at timestamptz not null default now(),
  constraint product_revisions_number_check check (revision_number > 0),
  constraint product_revisions_actor_check
    check (actor_type in ('admin', 'integration', 'system') and char_length(actor_id) between 1 and 200),
  constraint product_revisions_mode_check check (mode in ('shadow', 'live')),
  constraint product_revisions_hash_check
    check (accepted_hash is null or accepted_hash ~ '^[a-f0-9]{64}$'),
  constraint product_revisions_json_check
    check (
      jsonb_typeof(before_snapshot) = 'object'
      and jsonb_typeof(after_snapshot) = 'object'
      and public.product_intake_json_is_redacted(before_snapshot)
      and public.product_intake_json_is_redacted(after_snapshot)
    ),
  constraint product_revisions_product_number_unique unique (product_id, revision_number)
);

create index if not exists product_revisions_product_idx
  on public.product_revisions (product_id, revision_number desc);

create index if not exists product_revisions_run_idx
  on public.product_revisions (run_id)
  where run_id is not null;

alter table public.product_revisions enable row level security;

create or replace function public.prevent_product_revision_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Product revisions are append-only';
end;
$$;

drop trigger if exists product_revisions_append_only_trigger on public.product_revisions;
create trigger product_revisions_append_only_trigger
before update or delete on public.product_revisions
for each row execute function public.prevent_product_revision_mutation();

do $$
declare
  runtime_role text := nullif(current_setting('apfel.runtime_role', true), '');
begin
  if runtime_role is null or runtime_role = current_user then
    return;
  end if;
  if not exists (select 1 from pg_roles where rolname = runtime_role) then
    raise exception 'Configured product-intake runtime role does not exist';
  end if;
  execute format('alter table public.product_revisions owner to %I', runtime_role);
end;
$$;

comment on table public.product_revisions is
  'Append-only catalog snapshots for AI intake apply/restore. Shadow rows never mutate products.';
comment on column public.product_intake_runs.origin_product_id is
  'Pinned catalog product for staff-started AI updates. Distinct from matched target_product_id.';
