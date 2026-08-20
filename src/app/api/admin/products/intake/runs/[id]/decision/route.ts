import { NextRequest, NextResponse } from "next/server";

import { authorizeProductOwner, readAdminIdempotencyKey } from "@/lib/product-intake/admin-auth";
import { productIntakeErrorResponse, readJsonRequest } from "@/lib/product-intake/http";
import { createPreviewToken } from "@/lib/product-intake/preview-token";
import { recordProductIntakeDecision, resolveProductIntakeRunId } from "@/lib/product-intake/repository";
import { parseDecisionInput, parseRunReference } from "@/lib/product-intake/schemas";
import { recordShadowRevision } from "@/lib/product-intake/workspace-repository";
import { parseAcceptedPaths } from "@/lib/product-intake/workspace";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = authorizeProductOwner(request);
    const { value } = await readJsonRequest(request);
    const { id } = await context.params;
    const runId = await resolveProductIntakeRunId(parseRunReference(id));
    const decision = parseDecisionInput(value);
    const idempotencyKey = readAdminIdempotencyKey(
      request,
      `admin-decision:${auth.actor.id}:${runId}:${decision.decision}:${decision.stage ?? "none"}:${decision.proposalHash.slice(0, 16)}`,
    );
    const result = await recordProductIntakeDecision(runId, decision, idempotencyKey, auth.actor);
    if (decision.decision === "approve") {
      await recordShadowRevision(result.value, auth.actor, parseAcceptedPaths(decision.acceptedPaths));
    }
    const secret = process.env.PRODUCT_INTAKE_PREVIEW_SECRET?.trim() ?? "";
    const preview = result.value.proposalHash && secret.length >= 32
      ? createPreviewToken({ runId: result.value.id, proposalHash: result.value.proposalHash }, secret)
      : null;
    return NextResponse.json({
      success: true,
      duplicate: result.duplicate,
      shadowMode: result.value.mode !== "live" || process.env.PRODUCT_INTAKE_LIVE_ENABLED !== "true",
      run: result.value,
      preview,
    });
  } catch (error) {
    return productIntakeErrorResponse(error);
  }
}
