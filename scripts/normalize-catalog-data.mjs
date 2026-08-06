#!/usr/bin/env node
/**
 * Cleans two catalog data problems that reach customers and Google.
 *
 * 1. Brand spelling. "Guess"/"GUESS", "Tumi"/"TUMI" and "XByte"/"XBYTE" are
 *    stored as separate values, so the admin brand filter splits them and the
 *    Merchant feed publishes two brands for one manufacturer. The most common
 *    spelling wins rather than a style rule of ours, so "Karl Lagerfeld" and
 *    "TUMI" keep their real casing -- normalizeProductBrand() in products.ts
 *    cannot be used here because it lowercases everything after the first
 *    letter. "Apple iphone" is corrected to "Apple" explicitly.
 *
 * 2. Placeholder SKUs. Five products share the literal SKU "N/A", so they also
 *    share one inventory_skus row: selling one decrements all five.
 *
 *   node scripts/normalize-catalog-data.mjs           dry run
 *   node scripts/normalize-catalog-data.mjs --apply   writes
 */
import pg from "pg";

const APPLY = process.argv.includes("--apply");
if (!process.env.DATABASE_URL) {
  console.error("ERROR: DATABASE_URL is not set");
  process.exit(1);
}

const EXPLICIT_BRAND = new Map([["apple iphone", "Apple"]]);

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

// ---------------------------------------------------------------- brands ---
const { rows: brandRows } = await client.query(`
  SELECT brand, count(*)::int AS n
  FROM products
  WHERE coalesce(brand,'') <> ''
  GROUP BY brand
`);

const byKey = new Map();
for (const row of brandRows) {
  const key = row.brand.trim().toLowerCase();
  const list = byKey.get(key) ?? [];
  list.push({ brand: row.brand, n: row.n });
  byKey.set(key, list);
}

const brandFixes = [];
for (const [key, forms] of byKey) {
  const explicit = EXPLICIT_BRAND.get(key);
  // Most common spelling wins; ties go to the form with fewer capitals, which
  // is the Title Case one rather than the SHOUTED one.
  const canonical =
    explicit ??
    forms.slice().sort((a, b) => {
      if (b.n !== a.n) return b.n - a.n;
      const caps = (v) => v.brand.replace(/[^A-Z]/g, "").length;
      return caps(a) - caps(b);
    })[0].brand;
  for (const form of forms) {
    if (form.brand !== canonical) {
      brandFixes.push({ from: form.brand, to: canonical, n: form.n });
    }
  }
}

console.log("brand normalisation:");
if (brandFixes.length === 0) console.log("  nothing to do");
for (const fix of brandFixes) {
  console.log(`  ${String(fix.n).padStart(4)}  ${JSON.stringify(fix.from)} -> ${JSON.stringify(fix.to)}`);
}

// ------------------------------------------------------------------ skus ---
const { rows: badSkuRows } = await client.query(`
  SELECT id, coalesce(brand,'') AS brand, title
  FROM products
  WHERE coalesce(sku,'') IN ('', 'N/A', 'n/a', '-')
     OR sku IN (SELECT sku FROM products WHERE coalesce(sku,'') <> '' GROUP BY sku HAVING count(*) > 1)
  ORDER BY created_at
`);

// Continue the AP-<BRAND3>-<seq> series already in use so the codes stay uniform.
const { rows: seqRows } = await client.query(`
  SELECT substring(sku from '^AP-([A-Z]{3})-') AS prefix,
         max(substring(sku from '^AP-[A-Z]{3}-([0-9]{5})$')::int) AS highest
  FROM products
  WHERE sku ~ '^AP-[A-Z]{3}-[0-9]{5}$'
  GROUP BY 1
`);
const nextSeq = new Map(seqRows.filter((r) => r.prefix).map((r) => [r.prefix, r.highest ?? 0]));

const skuFixes = [];
for (const row of badSkuRows) {
  const prefix = (row.brand.replace(/[^a-z]/gi, "").slice(0, 3) || "GEN").toUpperCase();
  const next = (nextSeq.get(prefix) ?? 0) + 1;
  nextSeq.set(prefix, next);
  skuFixes.push({ id: row.id, title: row.title, sku: `AP-${prefix}-${String(next).padStart(5, "0")}` });
}

console.log("\nplaceholder / duplicate SKUs:");
if (skuFixes.length === 0) console.log("  nothing to do");
for (const fix of skuFixes) {
  console.log(`  ${fix.sku}  ${fix.title.slice(0, 60)}`);
}

if (!APPLY) {
  console.log("\ndry run -- pass --apply to write");
  await client.end();
  process.exit(0);
}

await client.query("BEGIN");
for (const fix of brandFixes) {
  await client.query(`UPDATE products SET brand = $2 WHERE brand = $1`, [fix.from, fix.to]);
}
for (const fix of skuFixes) {
  await client.query(`UPDATE products SET sku = $2 WHERE id = $1`, [fix.id, fix.sku]);
  // Give each product its own ledger row so stock stops being shared.
  await client.query(
    `INSERT INTO inventory_skus (product_id, sku, location, on_hand, reserved, safety_buffer)
     SELECT p.id, p.sku, 'local', greatest(coalesce(p.stock,0), 0), 0, 0
     FROM products p WHERE p.id = $1
     ON CONFLICT (sku, location) DO NOTHING`,
    [fix.id],
  );
}
await client.query("COMMIT");
console.log(`\napplied ${brandFixes.length} brand fixes and ${skuFixes.length} sku fixes`);
await client.end();
