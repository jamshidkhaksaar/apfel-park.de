import { NextRequest, NextResponse } from "next/server";

import { rejectCrossSiteAdminMutation } from "@/lib/admin-csrf";
import { clearSessionCookie } from "@/lib/session";

export async function POST(request: NextRequest) {
  const csrf = rejectCrossSiteAdminMutation(request);
  if (csrf) return csrf;

  await clearSessionCookie();
  return NextResponse.json({ success: true });
}
