import { NextRequest, NextResponse } from "next/server";

import { rejectCrossSiteAdminMutation } from "@/lib/admin-csrf";
import { canManageProducts } from "@/lib/admin-auth";
import { createAdminServerClient } from "@/lib/admin-auth-server";
import { createAdminDbClient } from "@/lib/admin-db";
import { sanitizeInput } from "@/lib/security";

type PromoPayload = {
  enabled?: boolean;
  title?: { de?: string; en?: string };
  description?: { de?: string; en?: string };
  ctaLabel?: { de?: string; en?: string };
  ctaHref?: string;
  pinnedProductIds?: string[];
};

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
    const payload = (await request.json()) as PromoPayload;
    const admin = createAdminDbClient();

    const pinnedProductIds = Array.isArray(payload.pinnedProductIds)
      ? payload.pinnedProductIds.filter((id): id is string => typeof id === "string").slice(0, 3)
      : [];

    const value = {
      enabled: Boolean(payload.enabled),
      title: {
        de: sanitizeInput(payload.title?.de || ""),
        en: sanitizeInput(payload.title?.en || ""),
      },
      description: {
        de: sanitizeInput(payload.description?.de || ""),
        en: sanitizeInput(payload.description?.en || ""),
      },
      ctaLabel: {
        de: sanitizeInput(payload.ctaLabel?.de || ""),
        en: sanitizeInput(payload.ctaLabel?.en || ""),
      },
      ctaHref: sanitizeInput(payload.ctaHref || "/de/store"),
      pinnedProductIds,
    };

    const { error } = await admin.from("store_settings").upsert(
      {
        key: "product_promo_popup",
        value,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" },
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Save product promo failed:", error);
    return NextResponse.json(
      { error: isEnglish ? "Failed to save promotion" : "Aktion konnte nicht gespeichert werden" },
      { status: 500 },
    );
  }
}
