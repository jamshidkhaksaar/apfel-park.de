import { NextRequest, NextResponse } from "next/server";

import { rejectCrossSiteAdminMutation } from "@/lib/admin-csrf";
import {
  authorizeOwnerDecision,
  productIntakeErrorResponse,
  readJsonRequest,
} from "@/lib/product-intake/http";
import {
  recordProductIntakeVisionAnalysis,
  resolveProductIntakeRunId,
} from "@/lib/product-intake/repository";
import {
  parseRunId,
  parseRunReference,
  parseVisionAnalysisInput,
} from "@/lib/product-intake/schemas";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; assetId: string }> },
) {
  try {
    const { raw, value } = await readJsonRequest(request);
    const auth = authorizeOwnerDecision(request, raw);
    if (auth.actor.type === "admin") {
      const csrf = rejectCrossSiteAdminMutation(request);
      if (csrf) return csrf;
    }
    const { id, assetId } = await context.params;
    const runId = await resolveProductIntakeRunId(parseRunReference(id));
    const result = await recordProductIntakeVisionAnalysis(
      runId,
      parseRunId(assetId),
      parseVisionAnalysisInput(value),
      auth.idempotencyKey,
      auth.actor,
    );
    return NextResponse.json(
      { success: true, duplicate: result.duplicate, asset: result.value },
      { status: result.duplicate ? 200 : 201 },
    );
  } catch (error) {
    return productIntakeErrorResponse(error);
  }
}
