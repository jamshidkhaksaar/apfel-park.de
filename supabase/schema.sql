-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PRODUCTS TABLE
create table public.products (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  subtitle text,
  description text,
  price decimal(10,2) not null,
  compare_at_price decimal(10,2), -- For discounts
  cost_price decimal(10,2),       -- For profit calculation
  stock integer default 0,
  category text not null,         -- e.g., 'smartphone', 'laptop', 'accessory'
  brand text,                     -- e.g., 'Apple', 'Samsung'
  model text,
  sku text,
  images text[],                  -- Array of image URLs
  feature_bullets text[],
  specs jsonb default '[]'::jsonb,
  is_active boolean default true,
  condition text not null default 'new', -- 'new' | 'refurbished' | 'used'; non-'new' = Open-Box
  slug text unique
);

-- 2. REPAIRS TABLE
create table public.repairs (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  ticket_number serial,           -- Simple auto-incrementing number for customers
  customer_name text not null,
  customer_email text,
  customer_phone text,
  customer_locale text default 'de',
  device_model text not null,     -- e.g., 'iPhone 13 Pro'
  issue_description text,
  status text default 'new',      -- new, in_progress, waiting_for_parts, ready, completed, cancelled
  status_updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  estimated_cost decimal(10,2),
  final_cost decimal(10,2),
  repair_summary text,
  notes text
);

-- 3. ORDERS TABLE
create table public.orders (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  order_number serial,
  customer_email text not null,
  customer_name text,
  customer_phone text,
  customer_address jsonb,
  total_amount decimal(10,2) not null,
  subtotal_amount decimal(10,2),
  shipping_amount decimal(10,2) default 0,
  vat_rate decimal(5,4) default 0.19,
  vat_amount decimal(10,2) default 0,
  currency text default 'EUR',
  status text default 'pending',  -- pending, paid, shipped, delivered, cancelled
  payment_status text default 'unpaid',
  shipping_method text default 'pickup',
  provider text,
  provider_order_id text,
  provider_session_id text,
  provider_payment_id text,
  provider_status text,
  idempotency_key text,
  checkout_locale text default 'de',
  consent_mode text,
  paid_at timestamp with time zone,
  cancelled_at timestamp with time zone,
  metadata jsonb default '{}'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  items jsonb                     -- Store line items as JSON
);

create unique index if not exists orders_idempotency_key_idx on public.orders (idempotency_key);
create index if not exists orders_provider_order_idx on public.orders (provider, provider_order_id);
create index if not exists orders_provider_session_idx on public.orders (provider, provider_session_id);

-- 4. REVIEWS TABLE
create table public.reviews (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  author_name text not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  content text,
  source text default 'google',   -- google, website, etc.
  is_published boolean default false
);

-- 5. CHAT CONVERSATIONS TABLE
create table public.chat_conversations (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  public_token text not null unique,
  status text default 'open' not null,
  customer_name text not null,
  customer_email text,
  customer_phone text,
  customer_locale text default 'de' not null,
  source_page text,
  last_message_preview text,
  last_message_at timestamp with time zone default timezone('utc'::text, now()) not null,
  admin_unread_count integer default 0 not null,
  customer_unread_count integer default 0 not null
);

-- 6. CHAT MESSAGES TABLE
create table public.chat_messages (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid not null references public.chat_conversations(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  sender_role text not null,
  message text not null,
  read_by_admin_at timestamp with time zone,
  read_by_customer_at timestamp with time zone
);

create index chat_conversations_last_message_at_idx on public.chat_conversations (last_message_at desc);
create index chat_conversations_status_idx on public.chat_conversations (status);
create index chat_messages_conversation_created_at_idx on public.chat_messages (conversation_id, created_at asc);

create table public.payment_webhook_events (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  processed_at timestamp with time zone,
  provider text not null,
  provider_event_id text not null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb
);

create unique index payment_webhook_events_provider_event_idx on public.payment_webhook_events (provider, provider_event_id);
create index payment_webhook_events_processed_idx on public.payment_webhook_events (processed_at desc);

-- Row Level Security (RLS) Policies
-- This ensures only authenticated admins can edit, but public can read specific data

alter table public.products enable row level security;
alter table public.repairs enable row level security;
alter table public.orders enable row level security;
alter table public.reviews enable row level security;
alter table public.chat_conversations enable row level security;
alter table public.chat_messages enable row level security;
alter table public.payment_webhook_events enable row level security;

-- Products: Everyone can read active products, only admins can do everything
create policy "Public can view active products" on public.products
  for select using (is_active = true);

create policy "Admins can do everything on products" on public.products
  for all using (auth.role() = 'authenticated');

-- Repairs: Only admins can view/edit repairs (Customers would verify via ticket ID/email separately)
create policy "Admins can do everything on repairs" on public.repairs
  for all using (auth.role() = 'authenticated');

-- Orders: Only admins can view all orders
create policy "Admins can do everything on orders" on public.orders
  for all using (auth.role() = 'authenticated');

-- Reviews: Public can read published reviews
create policy "Public can view published reviews" on public.reviews
  for select using (is_published = true);

create policy "Admins can do everything on reviews" on public.reviews
  for all using (auth.role() = 'authenticated');

-- Chat: Only admins should access the database tables directly.
create policy "Admins can do everything on chat conversations" on public.chat_conversations
  for all using (auth.role() = 'authenticated');

create policy "Admins can do everything on chat messages" on public.chat_messages
  for all using (auth.role() = 'authenticated');

create policy "Admins can do everything on payment webhooks" on public.payment_webhook_events
  for all using (auth.role() = 'authenticated');

-- Product images are stored on the local server uploads directory.
