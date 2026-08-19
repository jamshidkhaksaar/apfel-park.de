import { NextRequest, NextResponse } from "next/server";

import { createIntakeAssetToken } from "@/lib/product-intake/asset-token";
import {
  authorizeIntegrationMutation,
  productIntakeErrorResponse,
  readJsonRequest,
} from "@/lib/product-intake/http";
import { getProductIntakeAsset, resolveProductIntakeRunId } from "@/lib/product-intake/repository";
import { parseRunId, parseRunReference } from "@/lib/product-intake/schemas";
import { ProductIntakeError } from "@/lib/product-intake/errors";
import { siteInfo } from "@/lib/site";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string; assetId: string }> }) {
  try {
    const { raw } = await readJsonRequest(request);
    authorizeIntegrationMutation(request, raw);
    const { id, assetId } = await context.params;
    const runId = await resolveProductIntakeRunId(parseRunReference(id));
    const asset = await getProductIntakeAsset(runId, parseRunId(assetId));
    if (!asset.isRedacted || asset.containsSensitiveIdentifiers || !asset.externalProcessingAllowed) {
      throw new ProductIntakeError("forbidden", "Only safe redacted derivatives may be shared with vision", 403);
    }
    const secret = process.env.PRODUCT_INTAKE_ASSET_SECRET?.trim() ?? "";
    const signed = createIntakeAssetToken({ assetKey: asset.assetKey, sha256: asset.sha256 }, secret);
    return NextResponse.json({
      success: true,
      expiresAt: signed.expiresAt,
      url: `${siteInfo.url}/api/integrations/product-intake/assets/${signed.token}`,
    });
  } catch (error) {
    return productIntakeErrorResponse(error);
  }
}
