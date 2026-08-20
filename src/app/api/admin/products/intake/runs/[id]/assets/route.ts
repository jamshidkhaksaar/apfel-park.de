import { createHash, randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

import { authorizeProductStaff, readAdminIdempotencyKey } from "@/lib/product-intake/admin-auth";
import { ProductIntakeError } from "@/lib/product-intake/errors";
import { productIntakeErrorResponse } from "@/lib/product-intake/http";
import { recordProductIntakeAsset, resolveProductIntakeRunId } from "@/lib/product-intake/repository";
import { parseRunReference } from "@/lib/product-intake/schemas";
import type { RecordAssetInput } from "@/lib/product-intake/types";

export const dynamic = "force-dynamic";

const MEDIA_ROOT = "/srv/n8n/media";
const ALLOWED_TYPES: Record<string, RecordAssetInput["contentType"]> = {
  "image/jpeg": "image/jpeg",
  "image/png": "image/png",
  "image/webp": "image/webp",
};
const KIND_BY_EVIDENCE: Record<string, RecordAssetInput["kind"]> = {
  barcode: "barcode_photo",
  about: "about_screenshot",
  battery: "battery_health",
  shop: "shop_photo",
  packaging: "shop_photo",
};

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = authorizeProductStaff(request, { mutate: true });
    const { id } = await context.params;
    const runId = await resolveProductIntakeRunId(parseRunReference(id));
    const form = await request.formData();
    const file = form.get("file");
    const evidence = String(form.get("evidence") ?? "shop");
    if (!(file instanceof File)) throw new ProductIntakeError("bad_request", "An image file is required", 400);
    const contentType = ALLOWED_TYPES[file.type];
    if (!contentType) throw new ProductIntakeError("bad_request", "Only JPEG, PNG and WebP images are allowed", 400);
    if (file.size <= 0 || file.size > 8 * 1024 * 1024) throw new ProductIntakeError("bad_request", "Image must be between 1 byte and 8 MiB", 400);
    const kind = KIND_BY_EVIDENCE[evidence] ?? "shop_photo";
    const bytes = Buffer.from(await file.arrayBuffer());
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    const extension = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
    const assetKey = `intake/${runId}/${kind}-${randomUUID()}.${extension}`;
    const absolute = path.join(MEDIA_ROOT, assetKey);
    await mkdir(path.dirname(absolute), { recursive: true, mode: 0o750 });
    await writeFile(absolute, bytes, { mode: 0o640 });
    const idempotencyKey = readAdminIdempotencyKey(request, `admin-asset:${auth.actor.id}:${runId}:${sha256}`);
    const result = await recordProductIntakeAsset(runId, {
      assetKey,
      kind,
      sha256,
      contentType,
      byteSize: bytes.length,
      width: null,
      height: null,
      rightsBasis: "shop_owned",
      sourceUrl: null,
      isRedacted: false,
      containsSensitiveIdentifiers: kind === "about_screenshot" || kind === "battery_health" || kind === "barcode_photo",
      externalProcessingAllowed: false,
      metadata: {
        evidenceType: evidence,
        originalName: file.name.slice(0, 180),
        uploadedBy: auth.actor.id,
        workspace: "products",
      },
    }, idempotencyKey, auth.actor);
    return NextResponse.json({ success: true, duplicate: result.duplicate, asset: result.value }, { status: result.duplicate ? 200 : 201 });
  } catch (error) {
    return productIntakeErrorResponse(error);
  }
}
