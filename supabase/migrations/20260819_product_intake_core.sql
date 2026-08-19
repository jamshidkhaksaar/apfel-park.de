-- Durable, application-owned state for the v2 product-intake workflow.
-- Raw media remains in protected storage; these tables retain only immutable
-- hashes, rights metadata, proposals, decisions, and the append-only audit.

alter table public.products
  add column if not exists hardware_model text;

create or replace function public.product_intake_json_is_redacted(p_value jsonb)
returns boolean
language sql
immutable
parallel safe
as $$
  select not (
    p_value::text ~* '"(imei|serial|serial[_-]?number|serien([_ -]?(nummer|nr))?|eid)"[[:space:]]*:'
    or p_value::text ~* '(imei|eid|serial([[:space:]]*(number|no\.?))?|serien[[:space:]]*(nummer|nr\.?))[[:space:]]*[:=#-]?[[:space:]]*[a-z0-9][[:space:]a-z0-9-]{5,}'
    or p_value::text ~ '(^|[^0-9])[0-9]{15}([^0-9]|$)'
    or p_value::text ~ '(^|[^0-9])[0-9]{32}([^0-9]|$)'
  );
$$;

create table if not exists public.product_intake_runs (
  id uuid primary key default uuid_generate_v4(),
  intake_code text not null default ('APF-' || upper(substr(replace(uuid_generate_v4()::text, '-', ''), 1, 8))),
  source text not null,
  source_reference text,
  idempotency_key text not null,
  request_hash text not null,
  status text not null default 'awaiting_condition',
  condition text,
  mode text not null default 'shadow',
  submitted_by text not null,
  submitted_by_role text not null,
  locale text,
  intake_payload jsonb not null default '{}'::jsonb,
  proposal jsonb not null default '{}'::jsonb,
  proposal_hash text,
  evidence_hash text,
  validation jsonb not null default '{"blockers":[],"warnings":[]}'::jsonb,
  match_result jsonb not null default '{"state":"none","candidates":[]}'::jsonb,
  target_product_id uuid references public.products(id) on delete set null,
  approval_count smallint not null default 0,
  first_approved_at timestamptz,
  first_approved_by text,
  second_approved_at timestamptz,
  second_approved_by text,
  rejected_at timestamptz,
  rejected_by text,
  applied_at timestamptz,
  applied_by text,
  last_error text,
  version bigint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_intake_runs_source_check
    check (source in ('safi_bot', 'hermes', 'n8n_v2', 'admin', 'manual', 'test')),
  constraint product_intake_runs_code_check
    check (intake_code ~ '^APF-[A-Z0-9]{4,12}$'),
  constraint product_intake_runs_source_reference_check
    check (source_reference is null or char_length(source_reference) between 1 and 200),
  constraint product_intake_runs_idempotency_key_check
    check (
      char_length(idempotency_key) between 8 and 160
      and idempotency_key ~ '^[A-Za-z0-9][A-Za-z0-9._:-]*$'
    ),
  constraint product_intake_runs_request_hash_check
    check (request_hash ~ '^[a-f0-9]{64}$'),
  constraint product_intake_runs_status_check
    check (status in (
      'awaiting_condition',
      'collecting_assets',
      'extracting',
      'researching',
      'proposal_ready',
      'needs_review',
      'approved_once',
      'approved_twice',
      'apply_pending',
      'applied',
      'blocked',
      'failed',
      'rejected',
      'cancelled'
    )),
  constraint product_intake_runs_condition_check
    check (condition is null or condition in ('sealed', 'open_box', 'used')),
  constraint product_intake_runs_condition_gate_check
    check (
      condition is not null
      or status in ('awaiting_condition', 'collecting_assets', 'blocked', 'failed', 'cancelled')
    ),
  constraint product_intake_runs_mode_check
    check (mode in ('shadow', 'live')),
  constraint product_intake_runs_submitter_check
    check (
      char_length(submitted_by) between 1 and 200
      and submitted_by_role in ('safi', 'owner', 'admin', 'integration', 'system')
    ),
  constraint product_intake_runs_locale_check
    check (locale is null or locale in ('de', 'en')),
  constraint product_intake_runs_json_shapes_check
    check (
      jsonb_typeof(intake_payload) = 'object'
      and jsonb_typeof(proposal) = 'object'
      and jsonb_typeof(validation) = 'object'
      and jsonb_typeof(match_result) = 'object'
    ),
  constraint product_intake_runs_sensitive_data_check
    check (
      public.product_intake_json_is_redacted(intake_payload)
      and public.product_intake_json_is_redacted(proposal)
      and public.product_intake_json_is_redacted(validation)
      and public.product_intake_json_is_redacted(match_result)
    ),
  constraint product_intake_runs_proposal_hash_check
    check (
      (proposal_hash is null and proposal = '{}'::jsonb)
      or proposal_hash ~ '^[a-f0-9]{64}$'
    ),
  constraint product_intake_runs_evidence_hash_check
    check (evidence_hash is null or evidence_hash ~ '^[a-f0-9]{64}$'),
  constraint product_intake_runs_proposal_status_check
    check (
      status not in (
        'proposal_ready', 'needs_review', 'approved_once', 'approved_twice',
        'apply_pending', 'applied', 'rejected'
      )
      or (proposal_hash is not null and evidence_hash is not null)
    ),
  constraint product_intake_runs_approvals_check
    check (
      (approval_count = 0
        and first_approved_at is null and first_approved_by is null
        and second_approved_at is null and second_approved_by is null)
      or (approval_count = 1
        and first_approved_at is not null and first_approved_by is not null
        and second_approved_at is null and second_approved_by is null)
      or (approval_count = 2
        and first_approved_at is not null and first_approved_by is not null
        and second_approved_at is not null and second_approved_by is not null)
    ),
  constraint product_intake_runs_status_approval_check
    check (
      (status <> 'approved_once' or approval_count = 1)
      and (status <> 'approved_twice' or approval_count = 2)
      and (status <> 'applied' or applied_at is not null)
      and (status <> 'rejected' or rejected_at is not null)
    ),
  constraint product_intake_runs_version_check check (version > 0),
  constraint product_intake_runs_source_idempotency_unique unique (source, idempotency_key),
  constraint product_intake_runs_code_unique unique (intake_code)
);

create table if not exists public.product_intake_assets (
  id uuid primary key default uuid_generate_v4(),
  run_id uuid not null references public.product_intake_runs(id) on delete restrict,
  asset_key text not null,
  kind text not null,
  sha256 text not null,
  content_type text not null,
  byte_size bigint not null,
  width integer,
  height integer,
  rights_basis text not null,
  source_url text,
  is_redacted boolean not null default false,
  contains_sensitive_identifiers boolean not null default false,
  external_processing_allowed boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint product_intake_assets_key_check
    check (
      char_length(asset_key) between 1 and 512
      and asset_key ~ '^[A-Za-z0-9][A-Za-z0-9/_.-]*$'
      and asset_key !~ '(^|/)\.\.(/|$)'
    ),
  constraint product_intake_assets_kind_check
    check (kind in (
      'shop_photo',
      'barcode_photo',
      'about_screenshot',
      'battery_health',
      'redacted_derivative',
      'official_render',
      'official_document'
    )),
  constraint product_intake_assets_sha256_check
    check (sha256 ~ '^[a-f0-9]{64}$'),
  constraint product_intake_assets_content_type_check
    check (content_type in ('image/jpeg', 'image/png', 'image/webp', 'application/pdf')),
  constraint product_intake_assets_size_check
    check (byte_size > 0 and byte_size <= 26214400),
  constraint product_intake_assets_dimensions_check
    check (
      (width is null and height is null)
      or (width between 1 and 20000 and height between 1 and 20000)
    ),
  constraint product_intake_assets_rights_check
    check (rights_basis in (
      'shop_owned',
      'submitter_owned',
      'manufacturer_licensed',
      'official_reference',
      'unknown'
    )),
  constraint product_intake_assets_source_url_check
    check (source_url is null or source_url ~ '^https://[^[:space:]]+$'),
  constraint product_intake_assets_external_processing_check
    check (
      not external_processing_allowed
      or (
        not contains_sensitive_identifiers
        and (kind not in ('barcode_photo', 'about_screenshot', 'battery_health') or is_redacted)
      )
    ),
  constraint product_intake_assets_metadata_check
    check (
      jsonb_typeof(metadata) = 'object'
      and public.product_intake_json_is_redacted(metadata)
    ),
  constraint product_intake_assets_run_key_unique unique (run_id, asset_key),
  constraint product_intake_assets_run_hash_kind_unique unique (run_id, sha256, kind),
  constraint product_intake_assets_id_run_unique unique (id, run_id)
);

create table if not exists public.product_intake_events (
  id uuid primary key default uuid_generate_v4(),
  event_number bigint generated always as identity unique,
  run_id uuid not null references public.product_intake_runs(id) on delete restrict,
  event_type text not null,
  actor_type text not null,
  actor_id text not null,
  idempotency_key text not null,
  request_hash text not null,
  proposal_hash text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint product_intake_events_type_check
    check (event_type in (
      'run_created',
      'run_updated',
      'condition_recorded',
      'asset_recorded',
      'vision_analyzed',
      'proposal_recorded',
      'match_selected',
      'approved',
      'changes_requested',
      'rejected',
      'preview_issued',
      'draft_created',
      'draft_discarded',
      'published',
      'apply_shadowed',
      'apply_blocked',
      'applied',
      'failed'
    )),
  constraint product_intake_events_actor_check
    check (
      actor_type in ('integration', 'admin', 'system')
      and char_length(actor_id) between 1 and 200
    ),
  constraint product_intake_events_idempotency_key_check
    check (
      char_length(idempotency_key) between 8 and 160
      and idempotency_key ~ '^[A-Za-z0-9][A-Za-z0-9._:-]*$'
    ),
  constraint product_intake_events_request_hash_check
    check (request_hash ~ '^[a-f0-9]{64}$'),
  constraint product_intake_events_proposal_hash_check
    check (proposal_hash is null or proposal_hash ~ '^[a-f0-9]{64}$'),
  constraint product_intake_events_payload_check
    check (
      jsonb_typeof(payload) = 'object'
      and public.product_intake_json_is_redacted(payload)
    ),
  constraint product_intake_events_run_idempotency_unique unique (run_id, idempotency_key)
);

create table if not exists public.product_intake_asset_analyses (
  id uuid primary key default uuid_generate_v4(),
  run_id uuid not null references public.product_intake_runs(id) on delete restrict,
  asset_id uuid not null,
  semantic_type text not null check (semantic_type in ('barcode_label', 'about_screen', 'battery_health')),
  model text not null check (model = 'gpt-5.6-sol'),
  result_hash text not null check (result_hash ~ '^[a-f0-9]{64}$'),
  result jsonb not null,
  idempotency_key text not null,
  request_hash text not null check (request_hash ~ '^[a-f0-9]{64}$'),
  actor_id text not null,
  created_at timestamptz not null default now(),
  constraint product_intake_asset_analyses_result_check
    check (jsonb_typeof(result)='object' and public.product_intake_json_is_redacted(result)),
  constraint product_intake_asset_analyses_idem_check
    check (char_length(idempotency_key) between 8 and 160),
  constraint product_intake_asset_analyses_asset_run_fk
    foreign key (asset_id, run_id) references public.product_intake_assets(id, run_id) on delete restrict,
  constraint product_intake_asset_analyses_asset_hash_unique unique (asset_id, result_hash),
  constraint product_intake_asset_analyses_run_idem_unique unique (run_id, idempotency_key)
);

create index if not exists product_intake_runs_active_status_created_idx
  on public.product_intake_runs (status, created_at desc)
  where status not in ('applied', 'rejected', 'cancelled');

create index if not exists products_hardware_model_condition_idx
  on public.products (lower(btrim(hardware_model)), condition)
  where hardware_model is not null and btrim(hardware_model) <> '';

create index if not exists product_intake_runs_target_product_idx
  on public.product_intake_runs (target_product_id, updated_at desc)
  where target_product_id is not null;

create index if not exists product_intake_runs_condition_status_idx
  on public.product_intake_runs (condition, status, updated_at desc)
  where condition is not null;

create index if not exists product_intake_assets_run_kind_created_idx
  on public.product_intake_assets (run_id, kind, created_at);

create index if not exists product_intake_asset_analyses_asset_created_idx
  on public.product_intake_asset_analyses (asset_id, created_at desc);

create index if not exists product_intake_events_run_number_idx
  on public.product_intake_events (run_id, event_number);

create index if not exists product_intake_events_decisions_idx
  on public.product_intake_events (run_id, created_at desc)
  where event_type in ('match_selected', 'approved', 'changes_requested', 'rejected');

create or replace function public.touch_product_intake_run()
returns trigger
language plpgsql
as $$
begin
  if row(new.intake_code, new.source, new.idempotency_key, new.request_hash, new.created_at)
     is distinct from row(old.intake_code, old.source, old.idempotency_key, old.request_hash, old.created_at) then
    raise exception 'Product-intake run identity is immutable';
  end if;

  new.version := old.version + 1;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists product_intake_runs_touch_trigger on public.product_intake_runs;
create trigger product_intake_runs_touch_trigger
before update on public.product_intake_runs
for each row execute function public.touch_product_intake_run();

create or replace function public.prevent_product_intake_audit_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Product-intake audit records are append-only';
end;
$$;

drop trigger if exists product_intake_assets_append_only_trigger on public.product_intake_assets;
create trigger product_intake_assets_append_only_trigger
before update or delete on public.product_intake_assets
for each row execute function public.prevent_product_intake_audit_mutation();

drop trigger if exists product_intake_events_append_only_trigger on public.product_intake_events;
create trigger product_intake_events_append_only_trigger
before update or delete on public.product_intake_events
for each row execute function public.prevent_product_intake_audit_mutation();

drop trigger if exists product_intake_asset_analyses_append_only_trigger on public.product_intake_asset_analyses;
create trigger product_intake_asset_analyses_append_only_trigger
before update or delete on public.product_intake_asset_analyses
for each row execute function public.prevent_product_intake_audit_mutation();

alter table public.product_intake_runs enable row level security;
alter table public.product_intake_assets enable row level security;
alter table public.product_intake_events enable row level security;
alter table public.product_intake_asset_analyses enable row level security;

-- Production's legacy catalog tables are deliberately owned by postgres while
-- the web process connects as a narrower role. The VPS owner-migration runner
-- supplies that role through a session setting scoped to the migration. Fresh/dev
-- databases run this migration directly as their application role and do not
-- need an ownership transfer.
do $$
declare
  runtime_role text := nullif(current_setting('apfel.runtime_role', true), '');
  table_name text;
begin
  if runtime_role is null or runtime_role = current_user then
    return;
  end if;

  if not exists (select 1 from pg_roles where rolname = runtime_role) then
    raise exception 'Configured product-intake runtime role does not exist';
  end if;

  foreach table_name in array array[
    'product_intake_runs',
    'product_intake_assets',
    'product_intake_events',
    'product_intake_asset_analyses'
  ] loop
    execute format('alter table public.%I owner to %I', table_name, runtime_role);
  end loop;
end;
$$;

comment on table public.product_intake_runs is
  'Application-owned product-intake workflow state. No browser-facing RLS policy is intentional.';
comment on table public.product_intake_assets is
  'Immutable product-intake asset hashes, rights, and redaction metadata; no media bytes.';
comment on table public.product_intake_events is
  'Append-only product-intake audit events with per-run idempotency keys.';
comment on table public.product_intake_asset_analyses is
  'Append-only Sol analyses referencing immutable redacted assets.';
