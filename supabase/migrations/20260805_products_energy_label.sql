-- EU 2023/1669 requires the energy label and an EPREL datasheet link for
-- smartphones and tablets placed on the market since 2025-06-20, including in
-- online shops. eprel_id is the numeric EPREL registration; energy_label holds
-- the label values (efficiency class, battery endurance, cycles, reliability,
-- repairability, IP rating) rendered on the product page.
alter table public.products
  add column if not exists eprel_id text;

alter table public.products
  add column if not exists energy_label jsonb;
