import { NextRequest, NextResponse } from "next/server";

import { rejectCrossSiteAdminMutation } from "@/lib/admin-csrf";
import { canManageProducts } from "@/lib/admin-auth";
import { createAdminServerClient } from "@/lib/admin-auth-server";
import { createAdminDbClient } from "@/lib/admin-db";
import { query } from "@/lib/db";

type SelectionPayload = {
  pageIds?: unknown;
  heroIds?: unknown;
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
    const pageIds = ids(payload.pageIds);
    const heroIds = ids(payload.heroIds);
    const allIds = [...new Set([...pageIds, ...heroIds])];

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
          updatedAt: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" },
    );

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, pageIds, heroIds });
  } catch (error) {
    console.error("Save Black Friday selection failed:", error);
    return NextResponse.json(
      { error: isEnglish ? "Failed to save selection" : "Auswahl konnte nicht gespeichert werden" },
      { status: 500 },
    );
  }
}
