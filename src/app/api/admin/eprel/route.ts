import { NextResponse, type NextRequest } from "next/server";

import { canManageProducts } from "@/lib/admin-auth";
import { createAdminServerClient } from "@/lib/admin-auth-server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Searches the mirrored EPREL register so an admin can attach the correct
 * registration to a product.
 *
 * EPREL holds no marketing name -- only the manufacturer model number printed
 * on the box (A3090, SM-X826B) -- so this is a search, not an auto-match. The
 * figures shown come straight from the register and are never derived.
 */
export async function GET(request: NextRequest) {
  const adminClient = await createAdminServerClient();
  const {
    data: { user },
  } = await adminClient.auth.getUser();
  if (!canManageProducts(user)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const term = (request.nextUrl.searchParams.get("q") ?? "").trim();
  if (term.length < 2) {
    return NextResponse.json({ success: true, results: [] });
  }

  try {
    const result = await query(
      `SELECT registration_number, supplier, model_identifier, device_type, energy_class,
              battery_endurance_hours, battery_endurance_cycles, repairability_class,
              reliability_class, ingress_protection, on_market_start
       FROM eprel_models
       WHERE model_identifier ILIKE $1 OR supplier ILIKE $1 OR registration_number ILIKE $1
       ORDER BY on_market_start DESC NULLS LAST, model_identifier
       LIMIT 25`,
      [`%${term}%`],
    );
    return NextResponse.json({ success: true, results: result.rows });
  } catch (error) {
    console.error("EPREL lookup failed:", error);
    return NextResponse.json({ success: false, error: "Lookup failed" }, { status: 500 });
  }
}
