import { NextRequest, NextResponse } from "next/server";

import {
  authorizeIntegrationMutation,
  productIntakeErrorResponse,
  readJsonRequest,
} from "@/lib/product-intake/http";
import { recordProductIntakeAsset, resolveProductIntakeRunId } from "@/lib/product-intake/repository";
import { parseRecordAssetInput, parseRunReference } from "@/lib/product-intake/schemas";
import { createIntakeAssetToken } from "@/lib/product-intake/asset-token";
import { siteInfo } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { raw, value } = await readJsonRequest(request);
    const auth = authorizeIntegrationMutation(request, raw);
    const { id } = await context.params;
    const runId = await resolveProductIntakeRunId(parseRunReference(id));
    const result = await recordProductIntakeAsset(
      runId,
      parseRecordAssetInput(value),
      auth.idempotencyKey!,
      auth.actor,
    );
    const secret = process.env.PRODUCT_INTAKE_ASSET_SECRET?.trim() ?? "";
    const signed = result.value.isRedacted && !result.value.containsSensitiveIdentifiers
      && result.value.externalProcessingAllowed && secret.length >= 32
      ? createIntakeAssetToken({ assetKey: result.value.assetKey, sha256: result.value.sha256 }, secret)
      : null;
    return NextResponse.json(
      {
        success: true,
        duplicate: result.duplicate,
        asset: result.value,
        visionAsset: signed ? { url: `${siteInfo.url}/api/integrations/product-intake/assets/${signed.token}`, expiresAt: signed.expiresAt } : null,
      },
      { status: result.duplicate ? 200 : 201 },
    );
  } catch (error) {
    return productIntakeErrorResponse(error);
  }
}
