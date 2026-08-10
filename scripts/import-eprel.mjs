#!/usr/bin/env node
/**
 * Mirrors the EU EPREL register of smartphones and slate tablets.
 *
 * EU 2023/1669 requires the energy label to be shown online for devices placed
 * on the market from 2025-06-20. The figures are not ours to invent: they are
 * the values the manufacturer registered, so they are copied from the register
 * and never derived.
 *
 * EPREL registers by manufacturer model number (A3090, SM-X826B) and holds no
 * marketing name, so a registration cannot be matched to "iPhone 17 Pro Max"
 * automatically. This script only mirrors the register; a human attaches the
 * right registration to a product in the admin, because only someone holding
 * the box knows which model number it is.
 *
 * The public API refuses requests without a browser Referer.
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

const headers = {
  "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36",
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
console.log(`${total} registrations across ${pages} pages`);

const rows = [];
const collect = (hits) => {
  for (const hit of hits ?? []) {
    if (!hit.eprelRegistrationNumber) continue;
    rows.push({
      registration: String(hit.eprelRegistrationNumber),
      supplier: hit.supplierOrTrademark ?? "",
      model: hit.modelIdentifier ?? "",
      deviceType: hit.deviceType ?? null,
      energyClass: hit.energyClass ?? null,
      batteryHours: typeof hit.batteryEndurancePerCycleInHours === "number" ? hit.batteryEndurancePerCycleInHours : null,
      batteryCycles: typeof hit.batteryEnduranceInCycles === "number" ? hit.batteryEnduranceInCycles : null,
      repairability: hit.repairabilityClass ?? null,
      reliability: hit.repeatedFreeFallReliabilityClass ?? null,
      ip: hit.ingressProtectionRating ?? null,
      onMarket: toDate(hit.onMarketStartDate),
    });
  }
};

collect(first.hits);
for (let page = 2; page <= pages; page += 1) {
  const data = await fetchPage(page);
  collect(data.hits);
  if (page % 5 === 0) console.log(`  fetched ${rows.length}/${total}`);
}

console.log(`collected ${rows.length} registrations`);
const bySupplier = new Map();
for (const row of rows) bySupplier.set(row.supplier, (bySupplier.get(row.supplier) ?? 0) + 1);
const shopBrands = ["APPLE", "Samsung", "Xiaomi", "Google", "KXD", "CCIT"];
console.log("\nbrands this shop carries:");
for (const [supplier, count] of [...bySupplier].sort((a, b) => b[1] - a[1])) {
  if (shopBrands.some((brand) => supplier.toUpperCase().includes(brand.toUpperCase()))) {
    console.log(`  ${String(count).padStart(4)}  ${supplier}`);
  }
}

if (!APPLY) {
  console.log("\ndry run -- pass --apply to write");
  process.exit(0);
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
await client.query("BEGIN");
for (const row of rows) {
  await client.query(
    `INSERT INTO eprel_models
       (registration_number, supplier, model_identifier, device_type, energy_class,
        battery_endurance_hours, battery_endurance_cycles, repairability_class,
        reliability_class, ingress_protection, on_market_start, synced_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11, now())
     ON CONFLICT (registration_number) DO UPDATE SET
       supplier = excluded.supplier,
       model_identifier = excluded.model_identifier,
       device_type = excluded.device_type,
       energy_class = excluded.energy_class,
       battery_endurance_hours = excluded.battery_endurance_hours,
       battery_endurance_cycles = excluded.battery_endurance_cycles,
       repairability_class = excluded.repairability_class,
       reliability_class = excluded.reliability_class,
       ingress_protection = excluded.ingress_protection,
       on_market_start = excluded.on_market_start,
       synced_at = now()`,
    [row.registration, row.supplier, row.model, row.deviceType, row.energyClass,
     row.batteryHours, row.batteryCycles, row.repairability, row.reliability, row.ip, row.onMarket],
  );
}
await client.query("COMMIT");
console.log(`\nstored ${rows.length} registrations`);
await client.end();
