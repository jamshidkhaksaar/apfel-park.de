import { timingSafeEqual } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";

import { sendReviewInviteEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

/**
 * Sends one review invitation. Called by scripts/review-invites.mjs, which
 * decides who gets asked; the mail itself goes through the app so the SMTP and
 * Resend configuration lives in one place.
 *
 * Authenticated with the same secret that signs the review links, compared in
 * constant time. Not reachable from a browser.
 */
export async function POST(request: NextRequest) {
  const secret = (process.env.REVIEW_TOKEN_SECRET || process.env.APP_SESSION_SECRET || "").trim();
  const provided = request.headers.get("x-review-invite-secret") ?? "";
  if (!secret) {
    return NextResponse.json({ success: false, error: "Not configured" }, { status: 503 });
  }
  const a = Buffer.from(secret);
  const b = Buffer.from(provided);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as {
      email?: string;
      name?: string;
      locale?: string;
      orderLabel?: string;
      links?: Array<{ title?: string; url?: string }>;
    };

    const links = (payload.links ?? [])
      .filter((link): link is { title: string; url: string } => Boolean(link?.title && link?.url))
      .slice(0, 10);

    if (!payload.email || links.length === 0) {
      return NextResponse.json({ success: false, error: "Missing email or links" }, { status: 400 });
    }

    const result = await sendReviewInviteEmail({
      email: payload.email,
      name: payload.name ?? "",
      locale: payload.locale === "en" ? "en" : "de",
      orderLabel: payload.orderLabel ?? "",
      links,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error ?? "Send failed" }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Review invite failed:", error);
    return NextResponse.json({ success: false, error: "Send failed" }, { status: 500 });
  }
}
