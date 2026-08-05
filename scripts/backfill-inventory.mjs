#!/usr/bin/env node
/**
 * Seeds inventory_skus from products.stock.
 *
 * Checkout reserves stock through reserve_inventory(), which reads
 * inventory_skus -- but that table was never populated, so every card checkout
 * failed with "Insufficient available stock for SKU ...". The product-level
 * stock check passed first, so the storefront looked in stock right up to
 * payment.
 *
 * safety_buffer is seeded to 0, not the column default of 1: this shop sells
 * single units, and a buffer of 1 makes everything with stock 1 unbuyable.
 *
 *   node scripts/backfill-inventory.mjs           dry run
 *   node scripts/backfill-inventory.mjs --apply   writes the rows
 */
import pg from "pg";

const APPLY = process.argv.includes("--apply");
if (!process.env.DATABASE_URL) {
  console.error("ERROR: DATABASE_URL is not set");
  process.exit(1);
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

const { rows } = await client.query(`
  SELECT count(*)::int AS missing
  FROM products p
  WHERE coalesce(p.sku,'') <> ''
    AND NOT EXISTS (SELECT 1 FROM inventory_skus i WHERE i.sku = p.sku AND i.location = 'local')
`);
console.log(`${rows[0].missing} products have no local inventory row`);

if (!APPLY) {
  console.log("dry run -- pass --apply to write");
  await client.end();
  process.exit(0);
}

const result = await client.query(`
  INSERT INTO inventory_skus (product_id, sku, location, on_hand, reserved, safety_buffer)
  SELECT DISTINCT ON (p.sku) p.id, p.sku, 'local', greatest(coalesce(p.stock,0), 0), 0, 0
  FROM products p
  WHERE coalesce(p.sku,'') <> ''
  ORDER BY p.sku, p.created_at
  ON CONFLICT (sku, location) DO NOTHING
`);
console.log(`inserted ${result.rowCount} inventory rows`);
await client.end();
