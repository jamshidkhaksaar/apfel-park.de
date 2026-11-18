import { NextRequest, NextResponse } from "next/server";

import { canManageOrders } from "@/lib/admin-auth";
import { loadDashboardOverview } from "@/lib/admin-dashboard-overview";
import { readActiveVisitors } from "@/lib/admin-live-visitors";
import { readSessionUserFromRequest } from "@/lib/session";

export const dynamic = "force-dynamic";

/** Live data for the owner dashboard; the page polls it. */
export async function GET(request: NextRequest) {
  const user = await readSessionUserFromRequest(request);
  if (!canManageOrders(user)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const [overview, visitors] = await Promise.all([loadDashboardOverview(), readActiveVisitors()]);
    return NextResponse.json({ overview, visitors }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[Admin dashboard] overview failed:", error);
    return NextResponse.json({ error: "Dashboard data unavailable" }, { status: 500 });
  }
}
