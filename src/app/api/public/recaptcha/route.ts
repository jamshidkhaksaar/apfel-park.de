import { NextResponse } from "next/server";

import { getReCaptchaSettings } from "@/lib/recaptcha";

export async function GET() {
  const settings = await getReCaptchaSettings();
  return NextResponse.json({
    enabled: settings.enabled,
    siteKey: settings.siteKey,
  });
}
