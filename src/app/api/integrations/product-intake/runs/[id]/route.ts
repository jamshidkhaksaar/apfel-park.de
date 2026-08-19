import { NextRequest, NextResponse } from "next/server";

import {
  authorizeIntegrationMutation,
  authorizeRunRead,
  productIntakeErrorResponse,
  readJsonRequest,
} from "@/lib/product-intake/http";
import { getProductIntakeRunDetail, resolveProductIntakeRunId, updateProductIntakeRun } from "@/lib/product-intake/repository";
import { createIntakeAssetToken } from "@/lib/product-intake/asset-token";
import { parseRunReference, parseUpdateRunInput } from "@/lib/product-intake/schemas";
import { siteInfo } from "@/lib/site";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: Context) {
  try {
    const actor = authorizeRunRead(request);
    const { id } = await context.params;
    const runId = await resolveProductIntakeRunId(parseRunReference(id));
    const detail = await getProductIntakeRunDetail(runId);
    const secret = process.env.PRODUCT_INTAKE_ASSET_SECRET?.trim() ?? "";
    const assets = detail.assets.map((asset) => {
      const mayShare = actor.type === "admin"
        ? !asset.containsSensitiveIdentifiers
        : asset.isRedacted && !asset.containsSensitiveIdentifiers && asset.externalProcessingAllowed;
      if (!mayShare || secret.length < 32) {
        return asset;
      }
      const signed = createIntakeAssetToken({ assetKey: asset.assetKey, sha256: asset.sha256 }, secret);
      return {
        ...asset,
        visionUrl: actor.type === "admin"
          ? `/api/integrations/product-intake/assets/${signed.token}`
          : `${siteInfo.url}/api/integrations/product-intake/assets/${signed.token}`,
        visionExpiresAt: signed.expiresAt,
      };
    });
    return NextResponse.json({ success: true, ...detail, assets });
  } catch (error) {
    return productIntakeErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest, context: Context) {
  try {
    const { raw, value } = await readJsonRequest(request);
    const auth = authorizeIntegrationMutation(request, raw);
    const { id } = await context.params;
    const runId = await resolveProductIntakeRunId(parseRunReference(id));
    const result = await updateProductIntakeRun(
      runId,
      parseUpdateRunInput(value),
      auth.idempotencyKey!,
      auth.actor,
    );
    return NextResponse.json({ success: true, duplicate: result.duplicate, run: result.value });
  } catch (error) {
    return productIntakeErrorResponse(error);
  }
}
