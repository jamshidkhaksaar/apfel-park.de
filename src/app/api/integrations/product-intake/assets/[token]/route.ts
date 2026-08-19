import { createHash } from "node:crypto";
import { readFile, realpath } from "node:fs/promises";
import path from "node:path";

import { NextRequest, NextResponse } from "next/server";

import { verifyIntakeAssetToken } from "@/lib/product-intake/asset-token";
import { productIntakeErrorResponse } from "@/lib/product-intake/http";
import { ProductIntakeError } from "@/lib/product-intake/errors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_request: NextRequest, context: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await context.params;
    const secret = process.env.PRODUCT_INTAKE_ASSET_SECRET?.trim() ?? "";
    const claims = verifyIntakeAssetToken(token, secret);
    const root = await realpath("/srv/n8n/media");
    const resolved = path.resolve(root, claims.assetKey);
    if (!resolved.startsWith(`${root}${path.sep}`)) throw new ProductIntakeError("forbidden", "Invalid asset path", 403);
    const actual = await realpath(resolved);
    if (!actual.startsWith(`${root}${path.sep}`)) throw new ProductIntakeError("forbidden", "Invalid asset symlink", 403);
    const bytes = await readFile(actual);
    if (createHash("sha256").update(bytes).digest("hex") !== claims.sha256) {
      throw new ProductIntakeError("forbidden", "Asset integrity check failed", 409);
    }
    const extension = path.extname(actual).toLowerCase();
    const contentType = extension === ".webp"
      ? "image/webp"
      : extension === ".png"
        ? "image/png"
        : extension === ".pdf"
          ? "application/pdf"
          : "image/jpeg";
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, no-store, max-age=0",
        "X-Robots-Tag": "noindex, nofollow, noarchive",
        "Content-Disposition": "inline",
      },
    });
  } catch (error) {
    return productIntakeErrorResponse(error);
  }
}
