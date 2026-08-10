-- Mirror of the EU EPREL register for smartphones and slate tablets.
--
-- EU 2023/1669 requires the energy label online, and the figures belong to the
-- manufacturer's registration -- they are copied from the register, never
-- derived. EPREL holds no marketing name, only the manufacturer model number
-- (A3090, SM-X826B), so a human attaches the right registration to a product.
create table if not exists public.eprel_models (
  registration_number     text primary key,
  supplier                text not null,
  model_identifier        text not null,
  device_type             text,
  energy_class            text,
  battery_endurance_hours numeric,
  battery_endurance_cycles integer,
  repairability_class     text,
  reliability_class       text,
  ingress_protection      text,
  on_market_start         date,
  synced_at               timestamptz not null default now()
);

create index if not exists eprel_models_supplier_idx on public.eprel_models (supplier);
create index if not exists eprel_models_model_idx on public.eprel_models (model_identifier);
