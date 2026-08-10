-- The register reports battery endurance in minutes and the cycle count in
-- hundreds: EPREL returns 10 for the iPhone 17 while the official label prints
-- 1000. Mirroring the raw values keeps unit handling in one place instead of
-- leaving the storefront to guess.
ALTER TABLE eprel_models
  ADD COLUMN IF NOT EXISTS battery_endurance_minutes integer,
  ADD COLUMN IF NOT EXISTS rated_battery_capacity integer;
