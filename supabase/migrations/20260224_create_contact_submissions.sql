begin;

create table if not exists public.contact_submissions (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  email text not null,
  device text,
  message text not null,
  locale text not null default 'en',
  recaptcha_score double precision,
  status text not null default 'new'
);

create index if not exists idx_contact_submissions_created_at
  on public.contact_submissions (created_at desc);

create index if not exists idx_contact_submissions_status
  on public.contact_submissions (status);

alter table public.contact_submissions enable row level security;

drop policy if exists "Admins can read contact submissions" on public.contact_submissions;
create policy "Admins can read contact submissions" on public.contact_submissions
  for select using (auth.role() = 'authenticated');

commit;
