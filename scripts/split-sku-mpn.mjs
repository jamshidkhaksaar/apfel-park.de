#!/usr/bin/env node
/**
 * Separates manufacturer part numbers from our own stock codes.
 *
 * The sku column was doing three jobs at once: real manufacturer codes
 * (ARMOR1001WH, FEHCP12MUYEK), our own internal codes (AP-IP15PM-WHITE) and
 * auto-generated placeholders (AP-AUTO-AADFE27F2950). Both the Product JSON-LD
 * and the Google Merchant feed emitted whatever was in sku as <g:mpn>, so for
 * every self-made code we were telling Google a manufacturer part number that
 * does not exist.
 *
 * Rule: phones and tablets are stock we code ourselves, and an "AP-" prefix is
 * ours anywhere. Everything else is a branded accessory we resell, whose code
 * came from the manufacturer (ARMOR1001WH is Celly's, FEHCP12MUYEK is Ferrari's).
 * Codes stay in sku as well -- a reseller using the manufacturer code as its
 * own stock code is normal, and leaving it avoids rewriting 2,800 page titles
 * (the sku is printed in every product title and meta description).
 * Placeholders and blanks get a real internal code instead.
 *
 *   node scripts/split-sku-mpn.mjs           dry run
 *   node scripts/split-sku-mpn.mjs --apply   writes mpn + replacement skus
 */
import pg from "pg";

const APPLY = process.argv.includes("--apply");
if (!process.env.DATABASE_URL) {
  console.error("ERROR: DATABASE_URL is not set");
  process.exit(1);
}

const isOurs = (sku) => /^AP-/i.test(sku);
const isPlaceholder = (sku) => /^AP-AUTO-[0-9A-F]{12}$/i.test(sku);

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

const { rows } = await client.query(
  `SELECT id, coalesce(sku,'') AS sku, coalesce(brand,'') AS brand, coalesce(category,'') AS category FROM products ORDER BY created_at`,
);

const stats = { mpn: 0, keptOurs: 0, newSku: 0 };
const updates = [];
const seq = new Map();

for (const row of rows) {
  const sku = row.sku.trim();

  const selfCoded = row.category === "smartphones" || row.category === "tablets" || isOurs(sku);

  if (sku && !selfCoded) {
    updates.push({ id: row.id, mpn: sku, sku: null });
    stats.mpn += 1;
    continue;
  }

  if (sku && !isPlaceholder(sku)) {
    stats.keptOurs += 1;
    continue;
  }

  // Placeholder or blank: mint a readable internal code, brand-scoped.
  const prefix = (row.brand.replace(/[^a-z]/gi, "").slice(0, 3) || "GEN").toUpperCase();
  const next = (seq.get(prefix) ?? 0) + 1;
  seq.set(prefix, next);
  updates.push({ id: row.id, mpn: null, sku: `AP-${prefix}-${String(next).padStart(5, "0")}` });
  stats.newSku += 1;
}

console.log(`${rows.length} products`);
console.log(`  ${String(stats.mpn).padStart(5)}  manufacturer code -> mpn (sku unchanged)`);
console.log(`  ${String(stats.keptOurs).padStart(5)}  our own code -> left alone, no mpn`);
console.log(`  ${String(stats.newSku).padStart(5)}  placeholder/blank -> new internal sku`);

const sample = updates.filter((u) => u.sku).slice(0, 4);
if (sample.length) {
  console.log("\n  new skus, e.g.");
  for (const u of sample) console.log(`    ${u.sku}`);
}

if (!APPLY) {
  console.log("\ndry run -- pass --apply to write");
  await client.end();
  process.exit(0);
}

await client.query("BEGIN");
for (const u of updates) {
  if (u.mpn) await client.query(`UPDATE products SET mpn = $2 WHERE id = $1`, [u.id, u.mpn]);
  if (u.sku) await client.query(`UPDATE products SET sku = $2 WHERE id = $1`, [u.id, u.sku]);
}
await client.query("COMMIT");
console.log(`\napplied to ${updates.length} products`);
await client.end();
