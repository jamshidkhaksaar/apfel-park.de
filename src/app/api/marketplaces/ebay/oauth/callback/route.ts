import { NextRequest, NextResponse } from "next/server";

import { isAdminUser } from "@/lib/admin-auth";
import {
  exchangeEbayAuthorizationCode,
  saveEbayConnection,
  verifyEbayOAuthState,
} from "@/lib/marketplaces/ebay";
import { readSessionUserFromRequest } from "@/lib/session";

export const dynamic = "force-dynamic";

const redirectToAdmin = (request: NextRequest, params: Record<string, string>): NextResponse => {
  const siteUrl = process.env.SITE_URL?.trim() || request.nextUrl.origin;
  const destination = new URL("/admin/marketplaces", siteUrl);
  for (const [key, value] of Object.entries(params)) destination.searchParams.set(key, value);
  const response = NextResponse.redirect(destination);
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
};

export async function GET(request: NextRequest): Promise<NextResponse> {
  const user = readSessionUserFromRequest(request);
  if (!isAdminUser(user) || !user?.email) return redirectToAdmin(request, { error: "auth" });

  const stateValue = request.nextUrl.searchParams.get("state") ?? "";
  const state = verifyEbayOAuthState(stateValue);
  if (!state || state.actor !== user.email.trim().toLowerCase()) {
    return redirectToAdmin(request, { error: "ebay_state" });
  }

  if (request.nextUrl.searchParams.has("error")) {
    return redirectToAdmin(request, { error: "ebay_declined" });
  }

  const code = request.nextUrl.searchParams.get("code") ?? "";
  if (!code || code.length > 2048) return redirectToAdmin(request, { error: "ebay_code" });

  try {
    const token = await exchangeEbayAuthorizationCode(state.environment, code);
    await saveEbayConnection(state.environment, token, user.email);
    return redirectToAdmin(request, { ebay_connected: state.environment });
  } catch {
    return redirectToAdmin(request, { error: "ebay_token" });
  }
}
