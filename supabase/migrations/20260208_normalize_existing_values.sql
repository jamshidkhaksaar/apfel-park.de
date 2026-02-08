-- Normalize legacy enum-like values to canonical keys.
-- This migration updates existing rows only.

begin;

-- 1) products.category
update public.products
set category = case
  when lower(trim(category)) in ('smartphone', 'smartphones', 'handy', 'phone', 'phones') then 'smartphones'
  when lower(trim(category)) in ('accessory', 'accessories', 'zubehor', 'case', 'cases') then 'accessories'
  when lower(trim(category)) in ('console', 'consoles', 'gaming', 'game') then 'consoles'
  when lower(trim(category)) in ('laptop', 'laptops', 'notebook', 'notebooks') then 'laptops'
  else lower(trim(category))
end
where category is not null;

-- 2) repairs.status
update public.repairs
set status = case
  when lower(trim(status)) in ('new', 'neu', 'open') then 'new'
  when lower(trim(status)) in (
    'in_progress',
    'in progress',
    'in arbeit',
    'in_bearbeitung',
    'diagnose'
  ) then 'in_progress'
  when lower(trim(status)) in (
    'waiting_for_parts',
    'waiting for parts',
    'warten auf teile',
    'parts_pending'
  ) then 'waiting_for_parts'
  when lower(trim(status)) in ('ready', 'ready_for_pickup', 'abholbereit') then 'ready'
  when lower(trim(status)) in ('completed', 'abgeschlossen', 'fertig', 'done') then 'completed'
  when lower(trim(status)) in ('cancelled', 'canceled', 'storniert') then 'cancelled'
  else lower(trim(status))
end
where status is not null;

-- 3) orders.status
update public.orders
set status = case
  when lower(trim(status)) in ('pending', 'ausstehend', 'neu', 'new') then 'pending'
  when lower(trim(status)) in ('paid', 'bezahlt') then 'paid'
  when lower(trim(status)) in ('shipped', 'versendet') then 'shipped'
  when lower(trim(status)) in ('delivered', 'abgeschlossen') then 'delivered'
  when lower(trim(status)) in ('cancelled', 'canceled', 'storniert') then 'cancelled'
  else lower(trim(status))
end
where status is not null;

-- 4) orders.payment_status
update public.orders
set payment_status = case
  when lower(trim(payment_status)) in ('pending', 'offen') then 'pending'
  when lower(trim(payment_status)) in ('paid', 'bezahlt') then 'paid'
  when lower(trim(payment_status)) in ('unpaid', 'unbezahlt') then 'unpaid'
  when lower(trim(payment_status)) in ('failed', 'fehlgeschlagen') then 'failed'
  when lower(trim(payment_status)) in ('refunded', 'erstattet') then 'refunded'
  when lower(trim(payment_status)) in ('partially_refunded', 'teilweise erstattet') then 'partially_refunded'
  else lower(trim(payment_status))
end
where payment_status is not null;

-- 5) reviews.source
update public.reviews
set source = case
  when lower(trim(source)) in ('google', 'google_maps', 'google maps') then 'google'
  when lower(trim(source)) in ('website', 'web', 'site') then 'website'
  when lower(trim(source)) in ('trustpilot', 'trust_pilot', 'trust pilot') then 'trustpilot'
  when lower(trim(source)) in ('facebook', 'instagram', 'yelp', 'other', 'sonstige') then 'other'
  else lower(trim(source))
end
where source is not null;

commit;
