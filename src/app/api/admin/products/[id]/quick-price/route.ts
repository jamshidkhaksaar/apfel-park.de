import { NextResponse, type NextRequest } from "next/server";

import { canManageProducts } from "@/lib/admin-auth";
import { rejectCrossSiteAdminMutation } from "@/lib/admin-csrf";
import { withTransaction } from "@/lib/db";
import { productPriceUpdateForSku } from "@/lib/product-intake/apply";
import { markOpenIntakeRunsStale } from "@/lib/product-intake/stale-runs";
import { readSessionUserFromRequest } from "@/lib/session";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Quick price edit from the admin product list. `sku` selects a variant;
 * without it (or when it is the product SKU of a product without variants)
 * the product price changes. Price history is recorded by the database
 * trigger; marketplace price sync is queued like an approved intake change.
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await readSessionUserFromRequest(request);
  if (!canManageProducts(user)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const csrf = rejectCrossSiteAdminMutation(request);
  if (csrf) return csrf;
  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: "Invalid product" }, { status: 400 });

  const payload = (await request.json().catch(() => ({}))) as { price?: unknown; sku?: unknown };
  const raw = typeof payload.price === "string" ? Number(payload.price.replace(",", ".")) : payload.price;
  const price = typeof raw === "number" && Number.isFinite(raw) ? Math.round(raw * 100) / 100 : NaN;
  if (!(price > 0 && price < 100000)) {
    return NextResponse.json({ error: "Bitte einen Preis über 0 € eingeben." }, { status: 400 });
  }
  const sku = typeof payload.sku === "string" && payload.sku.trim() ? payload.sku.trim().slice(0, 120) : null;

  try {
    const result = await withTransaction(async (db) => {
      const found = await db.query("SELECT id, sku, variants FROM products WHERE id = $1 FOR UPDATE", [id]);
      const product = found.rows[0] as { id: string; sku: string | null; variants: unknown } | undefined;
      if (!product) return { status: 404 as const };
      const variants = Array.isArray(product.variants) ? (product.variants as Array<Record<string, unknown>>) : [];

      if (variants.length > 0) {
        const update = productPriceUpdateForSku(variants, sku, price);
        if (!update.matched) return { status: 409 as const };
        await db.query(
          "UPDATE products SET variants = $2::jsonb, price = CASE WHEN $3 THEN $4 ELSE price END, updated_at = now() WHERE id = $1",
          [id, JSON.stringify(update.variants), update.updateBase || variants.length === 1, price],
        );
      } else {
        if (sku && product.sku && sku.toLowerCase() !== product.sku.trim().toLowerCase()) return { status: 409 as const };
        await db.query("UPDATE products SET price = $2, updated_at = now() WHERE id = $1", [id, price]);
      }

      await db.query(
        `INSERT INTO marketplace_jobs (marketplace, operation, sku, payload)
         SELECT listing.marketplace, 'update_price', listing.sku, '{}'::jsonb
           FROM marketplace_listings listing
           JOIN inventory_skus inventory ON inventory.sku = listing.sku AND inventory.location = 'local'
           JOIN marketplace_channel_settings settings ON settings.marketplace = listing.marketplace
          WHERE inventory.product_id = $1::uuid AND listing.approved_at IS NOT NULL
            AND listing.sync_price = true AND settings.enabled = true AND settings.price_sync_enabled = true
         ON CONFLICT DO NOTHING`,
        [id],
      );
      await markOpenIntakeRunsStale(id, "Price changed in the product list", db);
      return { status: 200 as const };
    });

    if (result.status === 404) return NextResponse.json({ error: "Produkt nicht gefunden." }, { status: 404 });
    if (result.status === 409) {
      return NextResponse.json({ error: "Variante nicht gefunden – bitte Seite neu laden." }, { status: 409 });
    }
    return NextResponse.json({ success: true, price });
  } catch (error) {
    console.error("[Admin quick price] update failed:", error);
    return NextResponse.json({ error: "Preis konnte nicht gespeichert werden." }, { status: 500 });
  }
}
