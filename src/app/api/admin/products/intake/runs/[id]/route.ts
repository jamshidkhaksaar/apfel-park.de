import { NextRequest, NextResponse } from "next/server";

import { createIntakeAssetToken } from "@/lib/product-intake/asset-token";
import { authorizeProductStaff } from "@/lib/product-intake/admin-auth";
import { productIntakeErrorResponse } from "@/lib/product-intake/http";
import { getProductIntakeRunDetail, resolveProductIntakeRunId } from "@/lib/product-intake/repository";
import { parseRunReference } from "@/lib/product-intake/schemas";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    authorizeProductStaff(request);
    const { id } = await context.params;
    const runId = await resolveProductIntakeRunId(parseRunReference(id));
    const detail = await getProductIntakeRunDetail(runId);
    const secret = process.env.PRODUCT_INTAKE_ASSET_SECRET?.trim() ?? "";
    const assets = detail.assets.map((asset) => {
      if (asset.containsSensitiveIdentifiers || secret.length < 32) return asset;
      const signed = createIntakeAssetToken({ assetKey: asset.assetKey, sha256: asset.sha256 }, secret);
      return {
        ...asset,
        visionUrl: `/api/integrations/product-intake/assets/${signed.token}`,
        visionExpiresAt: signed.expiresAt,
      };
    });
    return NextResponse.json({ success: true, ...detail, assets });
  } catch (error) {
    return productIntakeErrorResponse(error);
  }
}
