import { NextResponse, type NextRequest } from "next/server";

import { canManageProducts } from "@/lib/admin-auth";
import { query } from "@/lib/db";
import { inventoryProductDetails } from "@/lib/inventory-product-details";
import { readSessionUserFromRequest } from "@/lib/session";

const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");

/**
 * Barcode lookup for the scanner in the product list. Matches a label's SKU
 * (product or variant) or a manufacturer EAN/GTIN, exactly and
 * case-insensitively. Deleted products never match.
 */
export async function GET(request: NextRequest) {
  const user = await readSessionUserFromRequest(request);
  if (!canManageProducts(user)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const code = (request.nextUrl.searchParams.get("code") ?? "").trim().slice(0, 120);
  if (code.length < 3) return NextResponse.json({ error: "not_found" }, { status: 404 });

  try {
    const found = await query(
      `SELECT p.id, p.title, p.brand, p.model, p.sku, p.gtin, p.category, p.condition, p.price, p.stock, p.is_active,
              p.catalog_enabled, p.images, p.variants, p.specs, p.import_metadata
         FROM products p
        WHERE p.import_metadata->>'catalogDeletedAt' IS NULL
          AND (lower(p.sku) = lower($1) OR p.gtin = $1
               OR EXISTS (SELECT 1 FROM jsonb_array_elements(CASE WHEN jsonb_typeof(p.variants) = 'array' THEN p.variants ELSE '[]'::jsonb END) v
                           WHERE lower(v->>'sku') = lower($1) OR v->>'gtin' = $1)
               OR EXISTS (SELECT 1 FROM inventory_skus i WHERE i.product_id = p.id AND lower(i.sku) = lower($1)))
        ORDER BY p.is_active DESC, p.updated_at DESC
        LIMIT 1`,
      [code],
    );
    const row = found.rows[0] as Record<string, unknown> | undefined;
    if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });

    const variants = Array.isArray(row.variants) ? (row.variants as Array<Record<string, unknown>>) : [];
    const lower = code.toLowerCase();
    const variant = variants.find((entry) => text(entry.sku).toLowerCase() === lower || text(entry.gtin) === code)
      ?? (variants.length === 1 ? variants[0] : undefined);
    const sku = text(variant?.sku) || text(row.sku) || null;
    const ledger = sku
      ? (await query(
          `SELECT available_inventory(on_hand, reserved, safety_buffer)::int AS available
             FROM inventory_skus WHERE location = 'local' AND is_active = true AND lower(sku) = lower($1) LIMIT 1`,
          [sku],
        )).rows[0] as { available?: number } | undefined
      : undefined;
    const details = inventoryProductDetails({ ...row, variants: [] }, "de", "product");

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error("[Admin scan] lookup failed:", error);
    return NextResponse.json({ error: "lookup_failed" }, { status: 500 });
  }
}
