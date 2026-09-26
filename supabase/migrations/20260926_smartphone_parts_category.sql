-- Reclassify existing repair parts without enabling or publishing any products.
-- Preserve IDs, slugs, prices, inventory and marketplace mappings.
UPDATE public.products
SET category = 'parts', subcategory = 'replacement-displays', updated_at = now()
WHERE category = 'accessories' AND subcategory = 'replacement-displays';

UPDATE public.products
SET category = 'parts', subcategory = 'replacement-batteries', updated_at = now()
WHERE category = 'accessories'
  AND concat_ws(' ', title, subtitle, model) !~* 'power.?bank|externer akku|external battery|battery case|powerbank.hülle'
  AND concat_ws(' ', title, subtitle, model) ~* 'ersatzakku|replacement batter|internal batter|(akku|battery).*(für|for).*(iphone|galaxy|samsung|pixel|xiaomi|huawei)|(iphone|galaxy|samsung|pixel|xiaomi|huawei).*(akku|battery)';
