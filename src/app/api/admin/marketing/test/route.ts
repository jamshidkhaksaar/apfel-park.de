import { NextRequest, NextResponse } from "next/server";

import { rejectCrossSiteAdminMutation } from "@/lib/admin-csrf";
import { isAdminUser } from "@/lib/admin-auth";
import { createAdminServerClient } from "@/lib/admin-auth-server";
import { sendTrackingTestEvents } from "@/lib/marketing";

export async function POST(request: NextRequest) {
  const adminClient = await createAdminServerClient();
  const {
    data: { user },
  } = await adminClient.auth.getUser();

  if (!isAdminUser(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const csrf = rejectCrossSiteAdminMutation(request);
  if (csrf) return csrf;

  const results = await sendTrackingTestEvents();
  return NextResponse.json({ success: true, results });
}
