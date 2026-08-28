import { NextRequest, NextResponse } from "next/server";

import { canManageProducts } from "@/lib/admin-auth";
import { query } from "@/lib/db";
import { readSessionUserFromRequest } from "@/lib/session";

const unauthorized = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 });

export async function GET(request: NextRequest) {
  const user = await readSessionUserFromRequest(request);
  if (!canManageProducts(user)) return unauthorized();

  const search = request.nextUrl.searchParams.get("q")?.trim().slice(0, 100) ?? "";
  const limit = Math.min(100, Math.max(1, Number(request.nextUrl.searchParams.get("limit")) || 50));
  const pattern = `%${search}%`;

  try {
    const [inventory, adjustments, summary] = await Promise.all([
      query(
        `SELECT
           inventory.sku,
           inventory.on_hand,
           inventory.reserved,
           inventory.safety_buffer,
           available_inventory(inventory.on_hand, inventory.reserved, inventory.safety_buffer) AS available,
           inventory.version,
           inventory.updated_at,
           product.id AS product_id,
           product.title,
           product.model,
           product.is_active
         FROM inventory_skus inventory
         JOIN products product ON product.id = inventory.product_id
         WHERE inventory.location = 'local' AND inventory.is_active = true
           AND ($1 = '' OR inventory.sku ILIKE $2 OR product.title ILIKE $2 OR coalesce(product.model, '') ILIKE $2)
         ORDER BY
           CASE WHEN available_inventory(inventory.on_hand, inventory.reserved, inventory.safety_buffer) = 0 THEN 1 ELSE 0 END,
           product.title,
           inventory.sku
         LIMIT $3`,
        [search, pattern, limit],
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
      items: inventory.rows.map((row) => ({
        sku: String(row.sku),
        productId: String(row.product_id),
        title: String(row.title),
        model: row.model ? String(row.model) : null,
        active: Boolean(row.is_active),
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
