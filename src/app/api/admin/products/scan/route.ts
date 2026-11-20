import { NextResponse, type NextRequest } from "next/server";

import { canManageProducts } from "@/lib/admin-auth";
import { query } from "@/lib/db";
import { inventoryProductDetails } from "@/lib/inventory-product-details";
import { labelCodeHash, normalizeScanCode, normalizedSkuSql } from "@/lib/scan-code";
import { readSessionUserFromRequest } from "@/lib/session";

const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");

/**
 * Barcode lookup for the scanner in the product list. Matches a label's SKU
 * (product or variant) or a manufacturer EAN/GTIN, exactly and
 * case-insensitively. Deleted products never match.
 *
 * When nothing matches exactly, the scan is compared layout-proof (letters and
 * digits only, Y = Z; see scan-code.ts) and as a short label code ("LB-…") for
 * long SKUs. That fallback only answers when exactly one SKU fits, so a
 * mangled scan never opens the wrong product.
 */
const ACTIVE = "p.import_metadata->>'catalogDeletedAt' IS NULL";
const fallbackSku = async (code: string): Promise<string | null> => {
  const normalized = normalizeScanCode(code);
  const hash = labelCodeHash(code);
  if (normalized.length < 3) return null;
  const result = await query(
    `WITH s AS (
       SELECT p.id AS product_id, p.sku FROM products p WHERE p.sku IS NOT NULL AND ${ACTIVE}
       UNION SELECT p.id, v->>'sku' FROM products p,
         jsonb_array_elements(CASE WHEN jsonb_typeof(p.variants) = 'array' THEN p.variants ELSE '[]'::jsonb END) v
        WHERE v->>'sku' IS NOT NULL AND ${ACTIVE}
       UNION SELECT i.product_id, i.sku FROM inventory_skus i JOIN products p ON p.id = i.product_id WHERE ${ACTIVE}
     )
     SELECT DISTINCT product_id, lower(sku) AS sku FROM s
      WHERE ${normalizedSkuSql("sku")} = $1
         OR ($2::text IS NOT NULL AND left(md5(lower(sku)), 8) = $2)
      LIMIT 2`,
    [normalized, hash],
  );
  return result.rows.length === 1 ? String((result.rows[0] as { sku: string }).sku) : null;
};

export async function GET(request: NextRequest) {
  const user = await readSessionUserFromRequest(request);
  if (!canManageProducts(user)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const scanned = (request.nextUrl.searchParams.get("code") ?? "").trim().slice(0, 120);
  if (scanned.length < 3) return NextResponse.json({ error: "not_found" }, { status: 404 });

  try {
    let code = scanned;
    let found = await lookup(code);
    if (!found.rows[0]) {
      const sku = await fallbackSku(scanned);
      if (sku) {
        code = sku;
        found = await lookup(code);
      }
    }
    const row = found.rows[0] as Record<string, unknown> | undefined;
    if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json(await scanResult(row, code));
  } catch (error) {
    console.error("[Admin scan] lookup failed:", error);
    return NextResponse.json({ error: "lookup_failed" }, { status: 500 });
  }
}

/** Exact match on SKU (product, variant, stock ledger) or EAN/GTIN. */
const lookup = (code: string) =>
  query(
    `SELECT p.id, p.title, p.brand, p.model, p.sku, p.gtin, p.category, p.condition, p.price, p.stock, p.is_active,
            p.catalog_enabled, p.images, p.variants, p.specs, p.import_metadata
       FROM products p
      WHERE ${ACTIVE}
        AND (lower(p.sku) = lower($1) OR p.gtin = $1
             OR EXISTS (SELECT 1 FROM jsonb_array_elements(CASE WHEN jsonb_typeof(p.variants) = 'array' THEN p.variants ELSE '[]'::jsonb END) v
                         WHERE lower(v->>'sku') = lower($1) OR v->>'gtin' = $1)
             OR EXISTS (SELECT 1 FROM inventory_skus i WHERE i.product_id = p.id AND lower(i.sku) = lower($1)))
      ORDER BY p.is_active DESC, p.updated_at DESC
      LIMIT 1`,
    [code],
  );

const ledgerFor = async (sku: string) =>
  (await query(
    `SELECT sku, available_inventory(on_hand, reserved, safety_buffer)::int AS available
       FROM inventory_skus WHERE location = 'local' AND is_active = true AND lower(sku) = lower($1) LIMIT 1`,
    [sku],
  )).rows[0] as { sku: string; available: number } | undefined;

const scanResult = async (row: Record<string, unknown>, code: string) => {
  const variants = Array.isArray(row.variants) ? (row.variants as Array<Record<string, unknown>>) : [];
  const lower = code.toLowerCase();
  const variant = variants.find((entry) => text(entry.sku).toLowerCase() === lower || text(entry.gtin) === code)
    ?? (variants.length === 1 ? variants[0] : undefined);
  // Sell the stock line that was scanned: the variant's SKU, else the scanned
  // ledger SKU itself, else the product SKU.
  const candidates = [text(variant?.sku), code, text(row.sku)].filter(Boolean);
  let ledger: { sku: string; available: number } | undefined;
  for (const candidate of candidates) {
    ledger = await ledgerFor(candidate);
    if (ledger) break;
  }
  const sku = ledger?.sku || text(variant?.sku) || text(row.sku) || null;
  const details = inventoryProductDetails({ ...row, variants: [] }, "de", "product");

  return {
    productId: String(row.id),
    title: text(row.title),
    brand: text(row.brand) || null,
    condition: text(row.condition) || "new",
    color: text(variant?.color) || details.color || "",
    storage: text(variant?.storage) || details.storage || "",
    price: Number(variant?.price ?? row.price) || 0,
    sku,
    stock: ledger?.available ?? Math.max(0, Number(row.stock ?? 0)),
    canSell: Boolean(ledger),
    active: Boolean(row.is_active) && row.catalog_enabled !== false,
    image: Array.isArray(row.images) ? (row.images as unknown[]).find((image) => typeof image === "string") ?? null : null,
  };
};
