import { NextRequest, NextResponse } from "next/server";

import { createAdminDbClient } from "@/lib/admin-db";

const getWebhookVerifyToken = async (): Promise<string> => {
  try {
    const admin = createAdminDbClient();
    const { data } = await admin
      .from("store_settings")
      .select("value")
      .eq("key", "integrations")
      .maybeSingle();

    const value = (data?.value as Record<string, unknown> | null) ?? null;
    return typeof value?.whatsappWebhookVerifyToken === "string"
      ? value.whatsappWebhookVerifyToken.trim()
      : "";
  } catch {
    return "";
  }
};

export async function GET(request: NextRequest): Promise<NextResponse> {
  const verifyToken = await getWebhookVerifyToken();
  if (!verifyToken) {
    return NextResponse.json({ error: "WhatsApp webhook is not configured" }, { status: 503 });
  }

  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === verifyToken && challenge) {
    return new NextResponse(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return NextResponse.json({ error: "Invalid WhatsApp webhook verification" }, { status: 403 });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const payload = await request.json().catch(() => null);

  if (!payload) {
    return NextResponse.json({ error: "Invalid WhatsApp webhook payload" }, { status: 400 });
  }

  console.info("[WhatsApp Webhook] Event received", {
    object: typeof payload === "object" && "object" in payload ? payload.object : undefined,
  });

  return NextResponse.json({ received: true });
}
