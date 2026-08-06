#!/usr/bin/env node
/**
 * Rewrites timestamped product slugs (`slugify(title)-<Date.now()>`) to the
 * stable `brand-model-storage-condition` form and records every old slug in
 * product_slug_history so the product page can 301 old URLs to the new ones.
 *
 * The slug generator lives in src/lib/product-slug.ts so the admin API and
 * this script agree. Timestamped slugs are detected by their trailing 13-digit
 * epoch, and the deterministic base means re-running is a no-op.
 *
 *   node scripts/migrate-slugs.mjs            dry run, prints the plan
 *   node scripts/migrate-slugs.mjs --apply    writes slugs + history
 */
import pg from "pg";
import { buildBaseSlug, uniquifySlug } from "../src/lib/product-slug.ts";

const APPLY = process.argv.includes("--apply");
if (!process.env.DATABASE_URL) {
  console.error("ERROR: DATABASE_URL is not set");
  process.exit(1);
}

const TIMESTAMP_SUFFIX = /-(\d{13})$/;

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

const { rows } = await client.query(
  `SELECT id, title, coalesce(subtitle, '') AS subtitle, coalesce(brand, '') AS brand,
          coalesce(model, '') AS model, coalesce(condition, 'new') AS condition,
          variants, slug
   FROM products`,
);

const taken = new Set(rows.map((r) => r.slug));
const updates = [];

for (const row of rows) {
  const legacy = row.slug?.match(TIMESTAMP_SUFFIX);
  if (!legacy) continue; // already a stable slug
  const base = buildBaseSlug({
    brand: row.brand,
    model: row.model,
    title: row.title,
    subtitle: row.subtitle,
    condition: row.condition,
    variants: row.variants,
  });
  const next = uniquifySlug(base, taken);
  taken.add(next);
  updates.push({ id: row.id, old: row.slug, next });
}

console.log(`${updates.length} timestamped slugs to rewrite\n`);
for (const u of updates.slice(0, 40)) {
  console.log(`  ${u.old}`);
  console.log(`    -> ${u.next}`);
}
if (updates.length > 40) {
  console.log(`  …and ${updates.length - 40} more`);
}

if (!APPLY) {
  console.log("\ndry run -- pass --apply to write");
  await client.end();
  process.exit(0);
}

await client.query("BEGIN");
try {
  for (const u of updates) {
    await client.query(
      `INSERT INTO product_slug_history (old_slug, product_id)
       VALUES ($1, $2)
       ON CONFLICT (old_slug) DO NOTHING`,
      [u.old, u.id],
    );
    await client.query(`UPDATE products SET slug = $2 WHERE id = $1`, [u.id, u.next]);
  }
  await client.query("COMMIT");
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
}
console.log(`\napplied ${updates.length} slug rewrites (+ history rows)`);
await client.end();
