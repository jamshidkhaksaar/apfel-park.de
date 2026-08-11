import { NextResponse, type NextRequest } from "next/server";

import { canManageProducts } from "@/lib/admin-auth";
import { createAdminServerClient } from "@/lib/admin-auth-server";
import {
  getEbayDeCategoryAspects,
  searchEbayDeCategories,
  type EbayEnvironment,
} from "@/lib/marketplaces/ebay";

export const dynamic = "force-dynamic";

const environment = (): EbayEnvironment =>
  process.env.EBAY_TAXONOMY_ENVIRONMENT?.trim().toLowerCase() === "sandbox" ? "sandbox" : "production";

export async function GET(request: NextRequest) {
  const adminClient = await createAdminServerClient();
  const {
    data: { user },
  } = await adminClient.auth.getUser();
  if (!canManageProducts(user)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const categoryId = request.nextUrl.searchParams.get("categoryId")?.trim() ?? "";
    if (categoryId) {
      const aspects = await getEbayDeCategoryAspects(categoryId, environment());
      return NextResponse.json({ success: true, aspects });
    }

    const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
    const results = await searchEbayDeCategories(query, environment());
    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error("eBay taxonomy lookup failed:", error);
    return NextResponse.json(
      { success: false, error: "Could not load the live eBay.de category requirements." },
      { status: 502 },
    );
  }
}
