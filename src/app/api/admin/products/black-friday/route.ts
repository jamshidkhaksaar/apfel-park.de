import { NextRequest, NextResponse } from "next/server";

import { rejectCrossSiteAdminMutation } from "@/lib/admin-csrf";
import { canManageProducts } from "@/lib/admin-auth";
import { createAdminServerClient } from "@/lib/admin-auth-server";
import { createAdminDbClient } from "@/lib/admin-db";
import { getBlackFridaySelection } from "@/lib/black-friday-selection";
import { parseCampaignDiscount, parseCampaignDiscounts } from "@/lib/campaign-pricing";
import { query } from "@/lib/db";

/**
 * Every key is optional: a missing key keeps the stored value, so the product
 * editor can save one product's discount without touching the curation.
 *   - `discounts`: replaces the whole map
 *   - `productId` + `discount`: sets (or with `null` removes) one discount
 */
type SelectionPayload = {
  pageIds?: unknown;
  heroIds?: unknown;
  discounts?: unknown;
  productId?: unknown;
  discount?: unknown;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const ids = (value: unknown): string[] =>
  Array.isArray(value)
    ? [...new Set(value.filter((item): item is string => typeof item === "string" && UUID.test(item)))].slice(0, 60)
    : [];

export async function PATCH(request: NextRequest) {
  const isEnglish = request.cookies.get("admin-lang")?.value === "en";
  const adminClient = await createAdminServerClient();
  const {
    data: { user },
  } = await adminClient.auth.getUser();

  if (!canManageProducts(user)) {
    return NextResponse.json({ error: isEnglish ? "Unauthorized" : "Nicht autorisiert" }, { status: 401 });
  }
  const csrf = rejectCrossSiteAdminMutation(request, isEnglish ? "Forbidden" : "Verboten");
  if (csrf) return csrf;

  try {
    const payload = (await request.json()) as SelectionPayload;
    const stored = await getBlackFridaySelection();
    const pageIds = payload.pageIds === undefined ? stored.pageIds : ids(payload.pageIds);
    const heroIds = payload.heroIds === undefined ? stored.heroIds : ids(payload.heroIds);
    let discounts = payload.discounts === undefined
      ? { ...stored.discounts }
      : parseCampaignDiscounts(payload.discounts, (id) => UUID.test(id));

    if (payload.productId !== undefined) {
      const productId = typeof payload.productId === "string" && UUID.test(payload.productId) ? payload.productId : null;
      if (!productId) {
        return NextResponse.json({ error: isEnglish ? "Invalid product" : "Ungültiges Produkt" }, { status: 400 });
      }
      if (payload.discount === null) {
        const rest = { ...discounts };
        delete rest[productId];
        discounts = rest;
      } else {
        const discount = parseCampaignDiscount(payload.discount);
        if (!discount) {
          return NextResponse.json(
            {
              error: isEnglish
                ? "Enter a percent between 1 and 90 or a euro amount above 0"
                : "Gib einen Prozentwert zwischen 1 und 90 oder einen Eurobetrag über 0 ein",
            },
            { status: 400 },
          );
        }
        discounts = { ...discounts, [productId]: discount };
      }
    }

    if (Object.keys(discounts).length > 400) {
      return NextResponse.json({ error: isEnglish ? "Too many discounts" : "Zu viele Rabatte" }, { status: 400 });
    }
    const allIds = [...new Set([...pageIds, ...heroIds, ...Object.keys(discounts)])];

    // Never persist an id that no longer exists: the storefront ranks by these
    // ids and a stale row would silently drop out of the campaign.
    if (allIds.length > 0) {
      const rows = await query("SELECT id FROM products WHERE id = ANY($1::uuid[])", [allIds]);
      const valid = new Set(rows.rows.map((row) => String((row as { id: string }).id)));
      if (valid.size !== allIds.length) {
        return NextResponse.json(
          { error: isEnglish ? "One or more products no longer exist" : "Mindestens ein Produkt existiert nicht mehr" },
          { status: 400 },
        );
      }
    }

    const admin = createAdminDbClient();
    const { error } = await admin.from("store_settings").upsert(
      {
        key: "black_friday_selection",
        value: {
          pageIds,
          heroIds,
          discounts,
          updatedAt: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" },
    );

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, pageIds, heroIds, discounts });
  } catch (error) {
    console.error("Save Black Friday selection failed:", error);
    return NextResponse.json(
      { error: isEnglish ? "Failed to save selection" : "Auswahl konnte nicht gespeichert werden" },
      { status: 500 },
    );
  }
}
