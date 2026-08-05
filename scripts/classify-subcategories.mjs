#!/usr/bin/env node
/**
 * Assigns products.subcategory from the title/subtitle/model text.
 *
 * The catalog kept 2,820 of 2,902 products in a single "accessories" bucket,
 * which made the admin filters useless.
 *
 * The rules are ordered and the first match wins, so the specific patterns have
 * to come first: a case that mentions MagSafe is a case, not a mount, while a
 * "MagSafe Ladegerät" is charging -- which is why charging is tested earlier.
 * Many cases never say "Hülle" at all ("BMW M IML Metal Logos MagSafe für
 * iPhone 17 Pro"), so anything left over that names a phone falls back to a
 * case rather than to "other".
 *
 *   node scripts/classify-subcategories.mjs           dry run, prints the split
 *   node scripts/classify-subcategories.mjs --apply   writes the column
 */
import pg from "pg";
import { classifySubcategory } from "../src/lib/product-subcategory.ts";

const APPLY = process.argv.includes("--apply");
if (!process.env.DATABASE_URL) {
  console.error("ERROR: DATABASE_URL is not set");
  process.exit(1);
}

// Rules live in src/lib/product-subcategory.ts so the API and this script agree.

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

const { rows } = await client.query(
  `SELECT id, category, title, coalesce(subtitle,'') AS subtitle, coalesce(model,'') AS model FROM products`,
);

const counts = new Map();
const updates = [];
for (const row of rows) {
  // Non-accessory categories are already meaningful; keep them as their own bucket.
  const sub = classifySubcategory(row.category, `${row.title} ${row.subtitle} ${row.model}`);
  counts.set(sub, (counts.get(sub) ?? 0) + 1);
  updates.push([row.id, sub]);
}

console.log(`${rows.length} products\n`);
for (const [name, n] of [...counts].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(5)}  ${name}`);
}

if (!APPLY) {
  console.log("\ndry run -- pass --apply to write");
  await client.end();
  process.exit(0);
}

await client.query("BEGIN");
for (const [id, sub] of updates) {
  await client.query(`UPDATE products SET subcategory = $2 WHERE id = $1`, [id, sub]);
}
await client.query("COMMIT");
console.log(`\napplied to ${updates.length} products`);
await client.end();
