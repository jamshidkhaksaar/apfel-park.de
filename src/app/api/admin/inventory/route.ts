import { NextRequest, NextResponse } from "next/server";

import { canManageProducts } from "@/lib/admin-auth";
import { inventoryCatalogFrom, inventoryCatalogWhere } from "@/lib/inventory-catalog";
import { query } from "@/lib/db";
import { readSessionUserFromRequest } from "@/lib/session";

const unauthorized = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 });

export async function GET(request: NextRequest) {
  const user = await readSessionUserFromRequest(request);
  if (!canManageProducts(user)) return unauthorized();

  const search = request.nextUrl.searchParams.get("q")?.trim().slice(0, 100) ?? "";
  const limit = Math.min(100, Math.max(1, Number.parseInt(request.nextUrl.searchParams.get("limit") ?? "50", 10) || 50));
  const requestedPage = Math.max(1, Math.min(1000000, Number.parseInt(request.nextUrl.searchParams.get("page") ?? "1", 10) || 1));
  const requestedStatus = request.nextUrl.searchParams.get("status") ?? "all";
  const status = ["all", "inventory", "draft", "published"].includes(requestedStatus) ? requestedStatus : "all";
  const pattern = `%${search}%`;

  try {
    const count = await query(`SELECT count(*)::int AS total ${inventoryCatalogFrom} ${inventoryCatalogWhere}`, [search, pattern, status]);
    const total = Number(count.rows[0]?.total ?? 0);
    const pages = Math.max(1, Math.ceil(total / limit));
    const page = Math.min(requestedPage, pages);
    const [inventory, adjustments, summary] = await Promise.all([
      query(
        `SELECT
           coalesce(inventory.sku, product.sku, '') AS sku,
           coalesce(inventory.on_hand, product.stock, 0) AS on_hand,
           coalesce(inventory.reserved, 0) AS reserved,
           coalesce(inventory.safety_buffer, 0) AS safety_buffer,
           CASE WHEN inventory.id IS NULL THEN 0 ELSE available_inventory(inventory.on_hand, inventory.reserved, inventory.safety_buffer) END AS available,
           coalesce(inventory.version, 0) AS version,
           coalesce(inventory.updated_at, product.updated_at, product.created_at) AS updated_at,
           inventory.id IS NOT NULL AS can_adjust,
           product.id AS product_id, product.title, product.model, product.is_active, product.catalog_enabled
         ${inventoryCatalogFrom} ${inventoryCatalogWhere}
         ORDER BY product.title, product.id, inventory.sku
         LIMIT $4 OFFSET $5`,
        [search, pattern, status, limit, (page - 1) * limit],
      ),
      query(
        `SELECT adjustment.id,
                inventory.sku,
                adjustment.quantity_delta AS adjustment,
                coalesce(adjustment.metadata ->> 'adjustmentType', adjustment.event_type) AS reason,
                adjustment.actor,
                adjustment.metadata,
                adjustment.created_at
           FROM inventory_adjustments adjustment
           JOIN inventory_skus inventory ON inventory.id = adjustment.inventory_sku_id
          ORDER BY adjustment.created_at DESC
          LIMIT 20`,
      ),
      query(
        `SELECT
           coalesce(sum(available_inventory(on_hand, reserved, safety_buffer)), 0)::int AS available,
           coalesce(sum(reserved), 0)::int AS reserved,
           count(*) FILTER (WHERE available_inventory(on_hand, reserved, safety_buffer) BETWEEN 1 AND 3)::int AS low,
           count(*) FILTER (WHERE available_inventory(on_hand, reserved, safety_buffer) = 0)::int AS out
         FROM inventory_skus inventory
         JOIN products product ON product.id = inventory.product_id
        WHERE inventory.location = 'local' AND inventory.is_active = true AND product.is_active = true`,
      ),
    ]);

    return NextResponse.json({
      pagination: { page, pages, total, limit },
      items: inventory.rows.map((row) => ({
        sku: String(row.sku),
        productId: String(row.product_id),
        title: String(row.title),
        model: row.model ? String(row.model) : null,
        active: Boolean(row.is_active),
        catalogEnabled: Boolean(row.catalog_enabled),
        canAdjust: Boolean(row.can_adjust),
        onHand: Number(row.on_hand),
        reserved: Number(row.reserved),
        safetyBuffer: Number(row.safety_buffer),
        available: Number(row.available),
        version: Number(row.version),
        updatedAt: new Date(row.updated_at).toISOString(),
      })),
      recentAdjustments: adjustments.rows.map((row) => ({
        id: String(row.id),
        sku: String(row.sku),
        adjustment: Number(row.adjustment),
        reason: String(row.reason),
        actor: row.actor ? String(row.actor) : null,
        note:
          row.metadata && typeof row.metadata === "object" && typeof row.metadata.note === "string"
            ? row.metadata.note
            : null,
        createdAt: new Date(row.created_at).toISOString(),
      })),
      summary: {
        available: Number(summary.rows[0]?.available ?? 0),
        reserved: Number(summary.rows[0]?.reserved ?? 0),
        low: Number(summary.rows[0]?.low ?? 0),
        out: Number(summary.rows[0]?.out ?? 0),
      },
    });
  } catch (error) {
    console.error("[Admin inventory] Read failed:", error);
    return NextResponse.json({ error: "Inventory could not be loaded" }, { status: 500 });
  }
}
