import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

import { query } from "@/lib/db";
import { sendContactNotificationEmail } from "@/lib/email";
import { getReCaptchaSettings, verifyReCaptcha } from "@/lib/recaptcha";
import { isValidEmail, isValidInputLength, sanitizeInput, validateImageFileExtension } from "@/lib/security";
import { consumePublicRateLimit } from "@/lib/public-rate-limit";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxSize = 5 * 1024 * 1024;
const maxBodySize = 22 * 1024 * 1024;

const privateRoot = process.env.TRADE_IN_PRIVATE_DIR || path.join(path.dirname(process.env.UPLOADS_DIR || "/srv/apfel-park/app/shared/uploads"), "private", "trade-ins");

const storePrivateImage = async (file: File): Promise<string> => {
  const id = `${randomUUID()}.webp`;
  const output = await sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 24_000_000 })
    .rotate()
    .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 86 })
    .toBuffer();
  await mkdir(privateRoot, { recursive: true, mode: 0o750 });
  await writeFile(path.join(privateRoot, id), output, { mode: 0o640 });
  return id;
};

export async function POST(request: NextRequest) {
  const length = Number(request.headers.get("content-length"));
  if (!Number.isFinite(length) || length <= 0 || length > maxBodySize) return NextResponse.json({ success: false, error: "invalid_size" }, { status: 413 });
  const limit = await consumePublicRateLimit(request.headers, "trade_in", 5, 15 * 60);
  if (!limit.allowed) return NextResponse.json({ success: false, error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });
  const storedIds: string[] = [];
  try {
    const settings = await getReCaptchaSettings();
    if (!settings.enabled || !settings.secretKey) return NextResponse.json({ success: false, error: "security_unavailable" }, { status: 503 });
    const form = await request.formData();
    const locale = form.get("locale") === "en" ? "en" : "de";
    const name = sanitizeInput(String(form.get("name") ?? ""));
    const email = sanitizeInput(String(form.get("email") ?? ""));
    const phone = sanitizeInput(String(form.get("phone") ?? ""));
    const brand = sanitizeInput(String(form.get("brand") ?? ""));
    const model = sanitizeInput(String(form.get("model") ?? ""));
    const storage = sanitizeInput(String(form.get("storage") ?? ""));
    const condition = sanitizeInput(String(form.get("condition") ?? ""));
    const notes = sanitizeInput(String(form.get("notes") ?? ""));
    const token = String(form.get("recaptchaToken") ?? "");
    const consent = form.get("consent") === "true";
    if (!name || !email || !brand || !model || !condition || !consent || !isValidEmail(email)) return NextResponse.json({ success: false, error: "invalid_fields" }, { status: 400 });
    if (![name, email, phone, brand, model, storage, condition].every((value) => isValidInputLength(value, 160)) || !isValidInputLength(notes, 3000)) return NextResponse.json({ success: false, error: "too_long" }, { status: 400 });
    const captcha = await verifyReCaptcha(token, "trade_in");
    if (!captcha.success) return NextResponse.json({ success: false, error: captcha.error || "security_failed" }, { status: 403 });
    const files = form.getAll("images").filter((item): item is File => item instanceof File && item.size > 0);
    if (files.length > 4) return NextResponse.json({ success: false, error: "too_many_images" }, { status: 400 });
    for (const file of files) {
      if (!allowedTypes.has(file.type) || file.size > maxSize || !validateImageFileExtension(file)) return NextResponse.json({ success: false, error: "invalid_image" }, { status: 400 });
    }
    for (const file of files) storedIds.push(await storePrivateImage(file));
    const imageUrls = storedIds;
    const result = await query(
      `INSERT INTO trade_in_requests (customer_name,email,phone,locale,device,condition_notes,image_urls,consent)
       VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7::text[],$8) RETURNING id`,
      [name, email, phone || null, locale, JSON.stringify({ brand, model, storage, condition }), notes || null, imageUrls, consent],
    );
    const id = String(result.rows[0]?.id ?? "");
    await sendContactNotificationEmail({ name, email, device: `${brand} ${model}`, message: `Trade-in ${id}\n${condition}\n${storage}\n${notes}`, locale }).catch(() => undefined);
    return NextResponse.json({ success: true, id });
  } catch (error) {
    await Promise.all(storedIds.map((id) => rm(path.join(privateRoot, id), { force: true }).catch(() => undefined)));
    console.error("Trade-in submission failed:", error);
    return NextResponse.json({ success: false, error: "failed" }, { status: 500 });
  }
}
