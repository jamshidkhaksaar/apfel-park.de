import { NextRequest, NextResponse } from "next/server";

import { sendViewContentTrackingEvents } from "@/lib/marketing";
import { sanitizeInput } from "@/lib/security";
import { siteInfo } from "@/lib/site";

type ViewContentPayload = {
  productId: string;
  title: string;
  category: string;
  price?: number;
  locale?: string;
  slug?: string;
};

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
        price: typeof payload.price === "number" ? payload.price : undefined,
        locale,
      },
      {
        consentMode: request.cookies.get("apfel-consent")?.value ?? null,
        ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
        userAgent: request.headers.get("user-agent"),
        url: `${siteInfo.url}/${locale}/store/${slug}`,
      },
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Marketing] ViewContent tracking failed:", error);
    return NextResponse.json({ success: false, error: "Tracking failed" }, { status: 500 });
  }
}
