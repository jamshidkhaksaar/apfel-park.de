import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";

import {
  enqueueMarketplaceJob,
  recordMarketplaceEvent,
} from "@/lib/marketplaces";
import {
  createEbayNotificationChallengeResponse,
  verifyEbayNotificationSignature,
} from "@/lib/marketplaces/ebay";
import { recordEbayAccountDeletionRequest } from "@/lib/marketplaces/ebay-privacy";
import type { Marketplace } from "@/lib/marketplaces/types";

export const dynamic = "force-dynamic";

type MarketplaceNotificationEnvelope = {
  eventId?: string;
  eventType?: string;
  notificationType?: string;
  notificationId?: string;
  metadata?: { topic?: string };
  notification?: { notificationId?: string };
  NotificationMetadata?: { NotificationId?: string; NotificationType?: string };
  notificationMetadata?: { notificationId?: string; notificationType?: string };
};

const isMarketplace = (value: string): value is Marketplace =>
  value === "amazon_de" || value === "ebay_de";

const validAmazonSecret = (request: NextRequest): boolean => {
  const expected = process.env.AMAZON_NOTIFICATION_WEBHOOK_SECRET?.trim();
  if (!expected) return false;
  const authorization = request.headers.get("authorization") ?? "";
  const received = authorization.startsWith("Bearer ")
    ? authorization.slice(7).trim()
    : request.headers.get("x-apfel-webhook-secret")?.trim() ?? "";
  const left = Buffer.from(expected);
  const right = Buffer.from(received);
  return left.length === right.length && timingSafeEqual(left, right);
};

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

  if (marketplace === "amazon_de" && !validAmazonSecret(request)) {
    return NextResponse.json(
      { error: process.env.AMAZON_NOTIFICATION_WEBHOOK_SECRET?.trim() ? "Invalid signature" : "Notification endpoint is not configured" },
      { status: process.env.AMAZON_NOTIFICATION_WEBHOOK_SECRET?.trim() ? 401 : 503 },
    );
  }

  let payload: MarketplaceNotificationEnvelope;
  try {
    payload = (await request.json()) as MarketplaceNotificationEnvelope;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (
    marketplace === "ebay_de" &&
    !(await verifyEbayNotificationSignature(payload, request.headers.get("x-ebay-signature")))
  ) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 412 });
  }

  const eventId = payload.NotificationMetadata?.NotificationId
    ?? payload.notificationMetadata?.notificationId
    ?? payload.notification?.notificationId
    ?? payload.notificationId
    ?? payload.eventId;
  const eventType = payload.NotificationMetadata?.NotificationType
    ?? payload.notificationMetadata?.notificationType
    ?? payload.metadata?.topic
    ?? payload.notificationType
    ?? payload.eventType
    ?? "unknown";
  if (!eventId) return NextResponse.json({ error: "Missing event id" }, { status: 400 });

  if (marketplace === "ebay_de" && eventType === "MARKETPLACE_ACCOUNT_DELETION") {
    const accepted = await recordEbayAccountDeletionRequest(payload);
    return NextResponse.json({ accepted });
  }

  const accepted = await recordMarketplaceEvent(marketplace, eventId, eventType, payload);
  if (accepted && eventType.includes("ORDER")) {
    await enqueueMarketplaceJob(marketplace, "import_orders", undefined, { eventId });
  }
  return NextResponse.json({ accepted });
}
