-- Timestamped URLs were indexed before some one-off inventory records sold
-- out. The history rows still pointed to those inactive records, so the route
-- correctly refused to redirect and Search Console saw a 404 even where an
-- equivalent, active listing now exists.
--
-- Repoint only when there is exactly one active, stocked product with the same
-- normalized title and condition. Ambiguous matches and discontinued products
-- remain untouched instead of being redirected to an irrelevant item.
with exact_replacements as (
  select h.old_slug, min(active_product.id::text)::uuid as product_id
  from public.product_slug_history h
  join public.products inactive_product on inactive_product.id = h.product_id
  join public.products active_product
    on lower(btrim(active_product.title)) = lower(btrim(inactive_product.title))
   and active_product.condition = inactive_product.condition
   and active_product.is_active = true
   and active_product.stock > 0
   and active_product.id <> inactive_product.id
  where inactive_product.is_active = false or inactive_product.stock <= 0
  group by h.old_slug
  having count(*) = 1
)
update public.product_slug_history history
set product_id = exact_replacements.product_id
from exact_replacements
where history.old_slug = exact_replacements.old_slug
  and history.product_id <> exact_replacements.product_id;
