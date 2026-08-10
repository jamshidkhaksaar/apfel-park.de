import { NextRequest, NextResponse } from "next/server";

import {
  enqueueMarketplaceJob,
  recordMarketplaceEvent,
} from "@/lib/marketplaces";
import {
  createEbayNotificationChallengeResponse,
  verifyEbayNotificationSignature,
} from "@/lib/marketplaces/ebay";
import type { Marketplace } from "@/lib/marketplaces/types";

export const dynamic = "force-dynamic";

type EbayNotificationEnvelope = {
  eventId?: string;
  eventType?: string;
  notificationId?: string;
  metadata?: { topic?: string };
  notification?: { notificationId?: string };
};

const isMarketplace = (value: string): value is Marketplace =>
  value === "amazon_de" || value === "ebay_de";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ marketplace: string }> },
): Promise<NextResponse> {
  const { marketplace } = await params;
  if (marketplace !== "ebay_de") {
    return NextResponse.json({ error: "Unknown marketplace" }, { status: 404 });
  }
  const challengeCode = request.nextUrl.searchParams.get("challenge_code");
  if (!challengeCode) return NextResponse.json({ error: "Missing challenge code" }, { status: 400 });

  try {
    const response = NextResponse.json({
      challengeResponse: createEbayNotificationChallengeResponse(challengeCode),
    });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    return NextResponse.json({ error: "Notification endpoint is not configured" }, { status: 503 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ marketplace: string }> },
): Promise<NextResponse> {
  const { marketplace } = await params;
  if (!isMarketplace(marketplace)) {
    return NextResponse.json({ error: "Unknown marketplace" }, { status: 404 });
  }

  let payload: EbayNotificationEnvelope;
  try {
    payload = (await request.json()) as EbayNotificationEnvelope;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (
    marketplace === "ebay_de" &&
    !(await verifyEbayNotificationSignature(payload, request.headers.get("x-ebay-signature")))
  ) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 412 });
  }

  const eventId = payload.notification?.notificationId ?? payload.notificationId ?? payload.eventId;
  const eventType = payload.metadata?.topic ?? payload.eventType ?? "unknown";
  if (!eventId) return NextResponse.json({ error: "Missing event id" }, { status: 400 });

  const accepted = await recordMarketplaceEvent(marketplace, eventId, eventType, payload);
  if (accepted && eventType.includes("ORDER")) {
    await enqueueMarketplaceJob(marketplace, "import_orders", undefined, { eventId });
  }
  return NextResponse.json({ accepted });
}
