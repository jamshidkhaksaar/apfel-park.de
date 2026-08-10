import { NextRequest, NextResponse } from "next/server";

import { isAdminUser } from "@/lib/admin-auth";
import { buildEbayConsentUrl, type EbayEnvironment } from "@/lib/marketplaces/ebay";
import { readSessionUserFromRequest } from "@/lib/session";

export const dynamic = "force-dynamic";

const isEnvironment = (value: string | null): value is EbayEnvironment =>
  value === "sandbox" || value === "production";

const adminRedirect = (request: NextRequest, error: string): NextResponse =>
  NextResponse.redirect(new URL(`/admin/marketplaces?error=${encodeURIComponent(error)}`, request.url));

export async function GET(request: NextRequest): Promise<NextResponse> {
  const user = readSessionUserFromRequest(request);
  if (!isAdminUser(user) || !user?.email) return adminRedirect(request, "auth");

  const environment = request.nextUrl.searchParams.get("environment");
  if (!isEnvironment(environment)) return adminRedirect(request, "ebay_environment");

  try {
    const response = NextResponse.redirect(buildEbayConsentUrl(environment, user.email));
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
    return response;
  } catch {
    return adminRedirect(request, "ebay_configuration");
  }
}
