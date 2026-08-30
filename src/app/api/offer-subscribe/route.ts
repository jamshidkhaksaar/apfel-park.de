import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "node:crypto";

import { query } from "@/lib/db";
import { sendOfferSubscriptionConfirmationEmail } from "@/lib/email";
import { getReCaptchaSettings, verifyReCaptcha } from "@/lib/recaptcha";
import { consumePublicRateLimit } from "@/lib/public-rate-limit";
import { isValidEmail, isValidInputLength, sanitizeInput } from "@/lib/security";

const hashToken = (token: string): string => createHash("sha256").update(token).digest("hex");

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const limit = await consumePublicRateLimit(request.headers, "offer_subscribe", 5, 60 * 60);
    if (!limit.allowed) {
      return NextResponse.json({ success: false, error: "too_many_requests" }, { status: 429 });
    }

    const payload = (await request.json()) as {
      email?: unknown;
      locale?: unknown;
      recaptchaToken?: unknown;
      website?: unknown;
    };
    const email = sanitizeInput(typeof payload.email === "string" ? payload.email : "").toLowerCase();
    const locale = payload.locale === "en" ? "en" : "de";
    const honeypot = sanitizeInput(typeof payload.website === "string" ? payload.website : "");
    const settings = await getReCaptchaSettings();

    if (honeypot) return NextResponse.json({ success: true });
    if (!isValidEmail(email) || !isValidInputLength(email, 254)) {
      return NextResponse.json({ success: false, error: "invalid_email" }, { status: 400 });
    }
    if (settings.enabled) {
      const captcha = await verifyReCaptcha(
        typeof payload.recaptchaToken === "string" ? payload.recaptchaToken : "",
        "offer_subscribe",
      );
      if (!captcha.success) {
        return NextResponse.json({ success: false, error: "security_failed" }, { status: 403 });
      }
    }

    const token = randomBytes(32).toString("hex");
    const existingResult = await query(
      `SELECT id, confirmed_at, unsubscribed_at FROM offer_subscribers WHERE email = $1 LIMIT 1`,
      [email],
    );
    const existing = existingResult.rows[0] as { id?: string; confirmed_at?: string | null; unsubscribed_at?: string | null } | undefined;

    if (existing?.confirmed_at && !existing.unsubscribed_at) {
      return NextResponse.json({ success: true, alreadySubscribed: true });
    }

    await query(
      `INSERT INTO offer_subscribers (
         email, locale, confirmed_at, confirmation_token_hash,
         confirmation_sent_at, unsubscribed_at, updated_at
       ) VALUES ($1, $2, NULL, $3, now(), NULL, now())
       ON CONFLICT (email) DO UPDATE SET
         locale = EXCLUDED.locale,
         confirmed_at = NULL,
         confirmation_token_hash = EXCLUDED.confirmation_token_hash,
         confirmation_sent_at = now(),
         unsubscribed_at = NULL,
         updated_at = now()`,
      [email, locale, hashToken(token)],
    );

    const emailResult = await sendOfferSubscriptionConfirmationEmail({ email, locale, token });
    if (!emailResult.success) {
      console.error("[Offer subscribe] confirmation email failed:", emailResult.error);
      return NextResponse.json({ success: false, error: "email_failed" }, { status: 503 });
    }

    return NextResponse.json({ success: true, pendingConfirmation: true });
  } catch (error) {
    console.error("[Offer subscribe] request failed:", error);
    return NextResponse.json({ success: false, error: "internal_error" }, { status: 500 });
  }
}
