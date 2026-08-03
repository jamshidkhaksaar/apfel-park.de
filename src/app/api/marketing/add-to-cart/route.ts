import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { getVerifiedMarketingProduct, isMarketingRequestAllowed } from "@/lib/marketing-catalog";
import { sendAddToCartTrackingEvents } from "@/lib/marketing";
import { sanitizeInput } from "@/lib/security";
import { siteInfo } from "@/lib/site";

type AddToCartPayload = {
  productId: string;
  title: string;
  category: string;
  condition?: string;
  price?: number;
  locale?: string;
  slug?: string;
  eventId?: string;
  variantSku?: string;
  variantColor?: string;
  variantStorage?: string;
};

const getClientIp = (request: NextRequest) =>
  request.headers.get("cf-connecting-ip") ||
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
  null;

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    if (!isMarketingRequestAllowed(clientIp || `unknown:${request.headers.get("user-agent") || "client"}`)) {
      return NextResponse.json({ success: false, error: "Rate limit exceeded" }, { status: 429 });
    }

    const payload = (await request.json()) as AddToCartPayload;

    if (!payload.productId) {
      return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 });
    }

    const locale = payload.locale === "en" ? "en" : "de";
    const verified = await getVerifiedMarketingProduct(sanitizeInput(payload.productId), locale, {
      sku: sanitizeInput(payload.variantSku || "") || undefined,
      color: sanitizeInput(payload.variantColor || "") || undefined,
      storage: sanitizeInput(payload.variantStorage || "") || undefined,
    });
    if (!verified) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }
    const eventId = sanitizeInput(payload.eventId || "").slice(0, 100) || randomUUID();

    const results = await sendAddToCartTrackingEvents(
      {
        eventName: "AddToCart",
        eventId,
        ...verified,
      },
      {
        consentMode: request.cookies.get("apfel-consent")?.value ?? null,
        ipAddress: clientIp,
        userAgent: request.headers.get("user-agent"),
        url: `${siteInfo.url}/${locale}/store/${verified.slug}`,
        fbp: request.cookies.get("_fbp")?.value ?? null,
        fbc: request.cookies.get("_fbc")?.value ?? null,
      },
    );

    const sent = results.filter((result) => result.success).length;
    return NextResponse.json({
      success: results.length > 0 && sent === results.length,
      partial: sent > 0 && sent < results.length,
      eventId,
      integrations: results.map(({ target, success, status }) => ({ target, success, status })),
    });
  } catch (error) {
    console.error("[Marketing] AddToCart tracking failed:", error);
    return NextResponse.json({ success: false, error: "Tracking failed" }, { status: 500 });
  }
}
