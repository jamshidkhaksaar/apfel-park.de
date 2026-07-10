import { NextRequest, NextResponse } from "next/server";

import { sendViewContentTrackingEvents } from "@/lib/marketing";
import { sanitizeInput } from "@/lib/security";
import { siteInfo } from "@/lib/site";

type ViewContentPayload = {
  productId: string;
  title: string;
  category: string;
  condition?: string;
  price?: number;
  locale?: string;
  slug?: string;
};

const getClientIp = (request: NextRequest) =>
  request.headers.get("cf-connecting-ip") ||
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
  null;

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as ViewContentPayload;

    if (!payload.productId || !payload.title || !payload.category) {
      return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 });
    }

    const locale = payload.locale === "en" ? "en" : "de";
    const slug = sanitizeInput(payload.slug || "");

    await sendViewContentTrackingEvents(
      {
        eventName: "ViewContent",
        productId: sanitizeInput(payload.productId),
        title: sanitizeInput(payload.title),
        category: sanitizeInput(payload.category),
        condition: payload.condition ? sanitizeInput(payload.condition) : "new",
        price: typeof payload.price === "number" ? payload.price : undefined,
        locale,
      },
      {
        consentMode: request.cookies.get("apfel-consent")?.value ?? null,
        ipAddress: getClientIp(request),
        userAgent: request.headers.get("user-agent"),
        url: `${siteInfo.url}/${locale}/store/${slug}`,
        fbp: request.cookies.get("_fbp")?.value ?? null,
        fbc: request.cookies.get("_fbc")?.value ?? null,
        externalId: request.cookies.get("apfel-consent")?.value ? `view-${payload.productId}` : null,
      },
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Marketing] ViewContent tracking failed:", error);
    return NextResponse.json({ success: false, error: "Tracking failed" }, { status: 500 });
  }
}
