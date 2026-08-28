import { NextRequest, NextResponse } from "next/server";

import { canManageProducts } from "@/lib/admin-auth";
import { rejectCrossSiteAdminMutation } from "@/lib/admin-csrf";
import { query } from "@/lib/db";
import { adjustInventory, type InventoryAdjustmentType } from "@/lib/marketplaces/inventory";
import { readSessionUserFromRequest } from "@/lib/session";

const supportedTypes = new Set<InventoryAdjustmentType>(["shop_sale", "restock", "correction", "return"]);

type AdjustmentPayload = {
  sku?: unknown;
  type?: unknown;
  quantity?: unknown;
  note?: unknown;
  idempotencyKey?: unknown;
};

export async function POST(request: NextRequest) {
  const user = await readSessionUserFromRequest(request);
  if (!canManageProducts(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const csrf = rejectCrossSiteAdminMutation(request);
  if (csrf) return csrf;

  try {
    const payload = (await request.json()) as AdjustmentPayload;
    const sku = typeof payload.sku === "string" ? payload.sku.trim().slice(0, 120) : "";
    const type = typeof payload.type === "string" ? payload.type as InventoryAdjustmentType : null;
    const quantity = Number(payload.quantity);
    const note = typeof payload.note === "string" ? payload.note.trim().slice(0, 500) : "";
    const idempotencyKey =
      typeof payload.idempotencyKey === "string" ? payload.idempotencyKey.trim().slice(0, 160) : "";

    if (!sku || !type || !supportedTypes.has(type)) {
      return NextResponse.json({ error: "A valid SKU and adjustment type are required" }, { status: 400 });
    }
    if (!Number.isSafeInteger(quantity) || quantity === 0 || (type !== "correction" && quantity < 1)) {
      return NextResponse.json(
        { error: type === "correction" ? "Correction quantity must be a non-zero whole number" : "Quantity must be a positive whole number" },
        { status: 400 },
      );
    }
    if (!idempotencyKey || !/^[A-Za-z0-9:_-]+$/.test(idempotencyKey)) {
      return NextResponse.json({ error: "A valid idempotency key is required" }, { status: 400 });
    }

    const snapshot = await adjustInventory({
      sku,
      type,
      quantity,
      referenceType: "admin_inventory_adjustment",
      referenceId: idempotencyKey,
      actor: user?.email ?? "admin",
      metadata: { note, source: "admin_inventory" },
    });
    const targets = await query(
      `SELECT marketplace
         FROM inventory_sync_targets
        WHERE sku = $1 AND inventory_version = $2 AND status IN ('queued', 'processing')
        ORDER BY marketplace`,
      [snapshot.sku, snapshot.version],
    );

    return NextResponse.json({
      ...snapshot,
      queuedChannels: targets.rows.map((row) => String(row.marketplace)),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Inventory adjustment failed";
    const status = /unknown sku|insufficient|cannot be negative|invalid/i.test(message) ? 400 : 500;
    console.error("[Admin inventory] Adjustment failed:", error);
    return NextResponse.json({ error: message }, { status });
  }
}
