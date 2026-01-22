-- Create a table for store settings
create table public.store_settings (
  id uuid default uuid_generate_v4() primary key,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  key text unique not null,
  value jsonb not null
);

-- Enable RLS
alter table public.store_settings enable row level security;

-- Policies
create policy "Public can view settings" on public.store_settings
  for select using (true);

create policy "Admins can update settings" on public.store_settings
  for all using (auth.role() = 'authenticated');

-- Insert default settings if not exists
insert into public.store_settings (key, value)
values 
  ('general', '{"shopName": "Apfel Park", "owner": "Max Mustermann", "address": "Musterstraße 123, 20095 Hamburg", "email": "support@apfelpark.de", "phone": "+49 40 123 456 78"}'::jsonb),
  ('hours', '{"monday": "09:00 - 18:00", "tuesday": "09:00 - 18:00", "wednesday": "09:00 - 18:00", "thursday": "09:00 - 18:00", "friday": "09:00 - 18:00", "saturday": "10:00 - 16:00", "sunday": "Closed"}'::jsonb),
  ('maintenance', '{"enabled": false}'::jsonb)
on conflict (key) do nothing;
