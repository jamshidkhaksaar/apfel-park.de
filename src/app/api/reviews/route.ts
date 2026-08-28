import { NextResponse, type NextRequest } from "next/server";

import { submitProductReview, verifyReviewToken } from "@/lib/product-reviews";
import { consumePublicRateLimit } from "@/lib/public-rate-limit";
import { getReCaptchaSettings, verifyReCaptcha } from "@/lib/recaptcha";
import { deleteReviewMedia, storePendingReviewImage } from "@/lib/review-media";
import { validateImageFileExtension } from "@/lib/security";

export const dynamic = "force-dynamic";

const messages = {
  de: { invalid_rating: "Bitte vergib eine Bewertung von 1 bis 5 Sternen.", missing_fields: "Bitte fülle Name und Bewertungstext aus.", too_long: "Die Eingaben sind zu lang.", duplicate: "Für diese Bestellung liegt bereits eine Bewertung vor.", failed: "Bewertung konnte nicht gespeichert werden." },
  en: { invalid_rating: "Please give a rating from 1 to 5 stars.", missing_fields: "Please fill in your name and review text.", too_long: "The input is too long.", duplicate: "A review already exists for this order.", failed: "The review could not be saved." },
} as const;
const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxFile = 5 * 1024 * 1024;
const maxMultipartBody = 17 * 1024 * 1024;
const maxJsonBody = 32 * 1024;

export async function POST(request: NextRequest) {
  const stored: string[] = [];
  const multipart = request.headers.get("content-type")?.includes("multipart/form-data") === true;
  const length = Number(request.headers.get("content-length"));
  const maximum = multipart ? maxMultipartBody : maxJsonBody;
  if (!Number.isFinite(length) || length <= 0 || length > maximum) return NextResponse.json({ success: false, error: "Invalid upload size" }, { status: 413 });
  const limit = await consumePublicRateLimit(request.headers, "product_review", 8, 15 * 60);
  if (!limit.allowed) return NextResponse.json({ success: false, error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });

  try {
    let payload: Record<string, unknown>;
    let files: File[] = [];
    if (multipart) {
      const form = await request.formData();
      payload = Object.fromEntries(Array.from(form.entries()).filter(([, value]) => typeof value === "string"));
      files = form.getAll("images").filter((item): item is File => item instanceof File && item.size > 0);
      if (files.length > 3) return NextResponse.json({ success: false, error: "Maximum 3 images" }, { status: 400 });
    } else payload = await request.json() as Record<string, unknown>;

    const locale = payload.locale === "en" ? "en" : "de";
    const settings = await getReCaptchaSettings();
    if (!settings.enabled || !settings.secretKey) return NextResponse.json({ success: false, error: "security_unavailable" }, { status: 503 });
    const captcha = await verifyReCaptcha(typeof payload.recaptchaToken === "string" ? payload.recaptchaToken : "", "product_review");
    if (!captcha.success) return NextResponse.json({ success: false, error: "security_failed" }, { status: 403 });

    const productId = typeof payload.productId === "string" ? payload.productId : "";
    const orderId = typeof payload.orderId === "string" ? payload.orderId : null;
    const token = typeof payload.token === "string" ? payload.token : null;
    const verified = Boolean(orderId && token && verifyReviewToken(orderId, productId, token));
    if (files.length && !verified) return NextResponse.json({ success: false, error: locale === "de" ? "Fotos sind nur über eine verifizierte Kaufeinladung möglich." : "Photos require a verified purchase invitation." }, { status: 403 });
    for (const file of files) {
      if (!allowed.has(file.type) || file.size > maxFile || !validateImageFileExtension(file)) return NextResponse.json({ success: false, error: "Invalid image" }, { status: 400 });
    }
    for (const file of files) stored.push(await storePendingReviewImage(file));

    const result = await submitProductReview({
      productId,
      authorName: typeof payload.authorName === "string" ? payload.authorName : "",
      rating: typeof payload.rating === "number" ? payload.rating : Number(payload.rating),
      title: typeof payload.title === "string" ? payload.title : undefined,
      body: typeof payload.body === "string" ? payload.body : "",
      locale,
      orderId,
      token,
      mediaUrls: stored,
    });
    if (!result.ok) {
      await deleteReviewMedia(stored);
      return NextResponse.json({ success: false, error: messages[locale][result.error] }, { status: 400 });
    }
    return NextResponse.json({ success: true, verified: result.verified });
  } catch (error) {
    await deleteReviewMedia(stored);
    console.error("Submit review failed:", error);
    return NextResponse.json({ success: false, error: messages.de.failed }, { status: 400 });
  }
}
