-- Customer reviews per product.
--
-- The existing `reviews` table drives homepage testimonials and has no
-- product_id, so product reviews get their own table. Reviews are held for
-- moderation: only status='approved' rows are shown or counted towards the
-- aggregateRating, because Google requires the markup to match what a visitor
-- can see. `verified` marks a review written through a signed post-purchase
-- invitation link.
create table if not exists public.product_reviews (
  id          uuid primary key default uuid_generate_v4(),
  product_id  uuid not null references public.products(id) on delete cascade,
  order_id    uuid references public.orders(id) on delete set null,
  author_name text not null,
  rating      integer not null check (rating between 1 and 5),
  title       text,
  body        text not null,
  verified    boolean not null default false,
  status      text not null default 'pending' check (status in ('pending','approved','rejected')),
  locale      text not null default 'de',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists product_reviews_product_status_idx
  on public.product_reviews (product_id, status);

create index if not exists product_reviews_status_created_idx
  on public.product_reviews (status, created_at desc);

-- One review per product per order, so an invitation link cannot be replayed.
create unique index if not exists product_reviews_order_product_key
  on public.product_reviews (order_id, product_id)
  where order_id is not null;
