alter table public.campaign_redemptions
  add column if not exists released_at timestamptz;

create index if not exists campaign_redemptions_campaign_history_idx
  on public.campaign_redemptions (campaign_id, created_at, released_at);
