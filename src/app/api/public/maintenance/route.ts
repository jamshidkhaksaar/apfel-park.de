import { NextResponse } from "next/server";

import { createAdminDbClient } from "@/lib/admin-db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = createAdminDbClient();
    const { data } = await admin
      .from("store_settings")
      .select("value")
      .eq("key", "maintenance")
      .maybeSingle();

    const maintenance = (data?.value as { siteEnabled?: boolean; storeEnabled?: boolean } | null) ?? null;

    return NextResponse.json({
      siteEnabled: Boolean(maintenance?.siteEnabled),
      storeEnabled: Boolean(maintenance?.storeEnabled),
    });
  } catch {
    return NextResponse.json({ siteEnabled: false, storeEnabled: false });
  }
}
