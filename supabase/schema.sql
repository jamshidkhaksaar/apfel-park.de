-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PRODUCTS TABLE
create table public.products (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  description text,
  price decimal(10,2) not null,
  compare_at_price decimal(10,2), -- For discounts
  cost_price decimal(10,2),       -- For profit calculation
  stock integer default 0,
  category text not null,         -- e.g., 'smartphone', 'laptop', 'accessory'
  brand text,                     -- e.g., 'Apple', 'Samsung'
  sku text,
  images text[],                  -- Array of image URLs
  is_active boolean default true,
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
  device_model text not null,     -- e.g., 'iPhone 13 Pro'
  issue_description text,
  status text default 'new',      -- new, in_progress, waiting_for_parts, ready, completed, cancelled
  estimated_cost decimal(10,2),
  final_cost decimal(10,2),
  notes text
);

-- 3. ORDERS TABLE
create table public.orders (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  order_number serial,
  customer_email text not null,
  customer_name text,
  total_amount decimal(10,2) not null,
  status text default 'pending',  -- pending, paid, shipped, delivered, cancelled
  payment_status text default 'unpaid',
  items jsonb                     -- Store line items as JSON
);

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

-- Row Level Security (RLS) Policies
-- This ensures only authenticated admins can edit, but public can read specific data

alter table public.products enable row level security;
alter table public.repairs enable row level security;
alter table public.orders enable row level security;
alter table public.reviews enable row level security;

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

-- STORAGE BUCKETS
-- You'll need to create a storage bucket named 'products' in the Supabase dashboard
insert into storage.buckets (id, name, public) values ('products', 'products', true);

create policy "Public Access" on storage.objects for select
  using ( bucket_id = 'products' );

create policy "Auth Upload" on storage.objects for insert
  with check ( bucket_id = 'products' and auth.role() = 'authenticated' );

create policy "Auth Update" on storage.objects for update
  with check ( bucket_id = 'products' and auth.role() = 'authenticated' );

create policy "Auth Delete" on storage.objects for delete
  using ( bucket_id = 'products' and auth.role() = 'authenticated' );
