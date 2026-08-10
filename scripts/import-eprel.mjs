#!/usr/bin/env node
/**
 * Mirrors the EU EPREL register of smartphones and slate tablets.
 *
 * EU 2023/1669 requires the energy label to be shown online. The figures are
 * not ours to invent, so they are copied from the register and never derived.
 *
 * The register paginates by offset over an unstable sort: crawling pages 1..N
 * once returns duplicates and silently drops rows -- a first attempt captured
 * 2039 of 2325, losing registrations that genuinely exist. So this makes
 * repeated passes and stops only when a full pass discovers nothing new, which
 * is the only way to know the crawl converged.
 *
 * EPREL holds no marketing name, only the model number printed on the box, so a
 * registration cannot be matched to "iPhone 17 Pro Max" from this data alone.
 * See scripts/apply-energy-labels.mjs for how that link is made.
 *
 *   node scripts/import-eprel.mjs            dry run
 *   node scripts/import-eprel.mjs --apply    writes eprel_models
 */
import pg from "pg";

const APPLY = process.argv.includes("--apply");
if (!process.env.DATABASE_URL) {
  console.error("ERROR: DATABASE_URL is not set");
  process.exit(1);
}

const GROUP = "smartphonestablets20231669";
const BASE = `https://eprel.ec.europa.eu/api/products/${GROUP}`;
const PAGE_SIZE = 100;
const MAX_PASSES = 8;

// The public API refuses requests that do not look like its own front end.
const headers = {
  "User-Agent":
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  Referer: `https://eprel.ec.europa.eu/screen/product/${GROUP}`,
};

const toDate = (value) =>
  Array.isArray(value) && value.length === 3
    ? `${value[0]}-${String(value[1]).padStart(2, "0")}-${String(value[2]).padStart(2, "0")}`
    : null;

const fetchPage = async (page) => {
  const response = await fetch(`${BASE}?_page=${page}&_limit=${PAGE_SIZE}`, { headers });
  if (!response.ok) throw new Error(`EPREL page ${page}: HTTP ${response.status}`);
  return response.json();
};

const first = await fetchPage(1);
const total = first.size ?? 0;
const pages = Math.ceil(total / PAGE_SIZE);
console.log(`register reports ${total} registrations across ${pages} pages`);

const byRegistration = new Map();
const collect = (hits) => {
  for (const hit of hits ?? []) {
    if (!hit.eprelRegistrationNumber) continue;
    const key = String(hit.eprelRegistrationNumber);
    const existing = byRegistration.get(key);
    // Keep the newest version: the register returns several per registration.
    if (existing && (existing.versionNumber ?? 0) >= (hit.versionNumber ?? 0)) continue;
    byRegistration.set(key, {
      registration: key,
      versionNumber: hit.versionNumber ?? 0,
      supplier: hit.supplierOrTrademark ?? "",
      model: hit.modelIdentifier ?? "",
      deviceType: hit.deviceType ?? null,
      energyClass: hit.energyClass ?? null,
      batteryHours:
        typeof hit.batteryEndurancePerCycleInHours === "number" ? hit.batteryEndurancePerCycleInHours : null,
      batteryMinutes: typeof hit.batteryEndurancePerCycle === "number" ? hit.batteryEndurancePerCycle : null,
      batteryCycles: typeof hit.batteryEnduranceInCycles === "number" ? hit.batteryEnduranceInCycles : null,
      ratedCapacity: typeof hit.ratedBatteryCapacity === "number" ? hit.ratedBatteryCapacity : null,
      repairability: hit.repairabilityClass ?? null,
      reliability: hit.repeatedFreeFallReliabilityClass ?? null,
      ip: hit.ingressProtectionRating ?? null,
      onMarket: toDate(hit.onMarketStartDate),
    });
  }
};

collect(first.hits);
for (let pass = 1; pass <= MAX_PASSES; pass += 1) {
  const before = byRegistration.size;
  for (let page = 1; page <= pages; page += 1) collect((await fetchPage(page)).hits);
  const gained = byRegistration.size - before;
  console.log(`  pass ${pass}: ${byRegistration.size} unique (+${gained})`);
  if (gained === 0) break;
}

const rows = [...byRegistration.values()];
console.log(`collected ${rows.length} unique registrations from ${total} rows`);

if (!APPLY) {
  console.log("dry run -- pass --apply to write");
  process.exit(0);
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
await client.query("BEGIN");
for (const row of rows) {
  await client.query(
    `INSERT INTO eprel_models
       (registration_number, supplier, model_identifier, device_type, energy_class,
        battery_endurance_hours, battery_endurance_minutes, battery_endurance_cycles,
        rated_battery_capacity, repairability_class, reliability_class,
        ingress_protection, on_market_start, synced_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13, now())
     ON CONFLICT (registration_number) DO UPDATE SET
       supplier = excluded.supplier,
       model_identifier = excluded.model_identifier,
       device_type = excluded.device_type,
       energy_class = excluded.energy_class,
       battery_endurance_hours = excluded.battery_endurance_hours,
       battery_endurance_minutes = excluded.battery_endurance_minutes,
       battery_endurance_cycles = excluded.battery_endurance_cycles,
       rated_battery_capacity = excluded.rated_battery_capacity,
       repairability_class = excluded.repairability_class,
       reliability_class = excluded.reliability_class,
       ingress_protection = excluded.ingress_protection,
       on_market_start = excluded.on_market_start,
       synced_at = now()`,
    [
      row.registration, row.supplier, row.model, row.deviceType, row.energyClass, row.batteryHours,
      row.batteryMinutes, row.batteryCycles, row.ratedCapacity, row.repairability, row.reliability,
      row.ip, row.onMarket,
    ],
  );
}
await client.query("COMMIT");
console.log(`stored ${rows.length} registrations`);
await client.end();
