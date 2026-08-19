import { NextRequest, NextResponse } from "next/server";

import { rejectCrossSiteAdminMutation } from "@/lib/admin-csrf";
import {
  applyApprovedProductUpdate,
  createApprovedProductDraft,
  discardRejectedProductDraft,
  publishApprovedProductDraft,
} from "@/lib/product-intake/apply";
import {
  authorizeOwnerDecision,
  productIntakeErrorResponse,
  readJsonRequest,
} from "@/lib/product-intake/http";
import { createPreviewToken } from "@/lib/product-intake/preview-token";
import {
  recordProductIntakeApplyFailure,
  recordProductIntakeDecision,
  resolveProductIntakeRunId,
} from "@/lib/product-intake/repository";
import { parseDecisionInput, parseRunReference } from "@/lib/product-intake/schemas";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { raw, value } = await readJsonRequest(request);
    const auth = authorizeOwnerDecision(request, raw);
    if (auth.actor.type === "admin") {
      const csrf = rejectCrossSiteAdminMutation(request);
      if (csrf) return csrf;
    }
    const { id } = await context.params;
    const runId = await resolveProductIntakeRunId(parseRunReference(id));
    const decision = parseDecisionInput(value);
    const decisionActor = auth.actor.type === "integration" && decision.actorId
      ? { type: "admin" as const, id: decision.actorId }
      : auth.actor;
    const result = await recordProductIntakeDecision(
      runId,
      decision,
      auth.idempotencyKey,
      decisionActor,
    );
    let appliedRun = result.value;
    try {
      if (appliedRun.mode === "live" && process.env.PRODUCT_INTAKE_LIVE_ENABLED === "true") {
        if (decision.decision === "reject") {
          appliedRun = await discardRejectedProductDraft(appliedRun, decisionActor, auth.idempotencyKey);
        } else if (decision.stage === "update" && appliedRun.proposal?.operation === "update" && appliedRun.status === "approved_once") {
          appliedRun = await applyApprovedProductUpdate(appliedRun, decisionActor, auth.idempotencyKey);
        } else if (decision.stage === "draft" && appliedRun.proposal?.operation === "create"
          && appliedRun.status === "approved_once" && !appliedRun.targetProductId) {
          appliedRun = await createApprovedProductDraft(appliedRun, decisionActor, auth.idempotencyKey);
        } else if (decision.stage === "publish" && appliedRun.proposal?.operation === "create" && appliedRun.status === "approved_twice") {
          appliedRun = await publishApprovedProductDraft(appliedRun, decisionActor, auth.idempotencyKey);
        }
      }
    } catch (applyError) {
      const message = applyError instanceof Error ? applyError.message : "Product-intake application failed";
      await recordProductIntakeApplyFailure(runId, decisionActor, auth.idempotencyKey, message).catch(() => undefined);
      throw applyError;
    }
    const secret = process.env.PRODUCT_INTAKE_PREVIEW_SECRET?.trim() ?? "";
    const preview = appliedRun.proposalHash && secret.length >= 32
      ? createPreviewToken({ runId: appliedRun.id, proposalHash: appliedRun.proposalHash }, secret)
      : null;
    return NextResponse.json({
      success: true,
      duplicate: result.duplicate,
      shadowMode: appliedRun.mode !== "live" || process.env.PRODUCT_INTAKE_LIVE_ENABLED !== "true",
      draftMutation: appliedRun.mode === "live" && appliedRun.proposal?.operation === "create" && Boolean(appliedRun.targetProductId),
      productMutation: appliedRun.status === "applied" || (appliedRun.proposal?.operation === "create" && Boolean(appliedRun.targetProductId)),
      inventoryMutation: (appliedRun.proposal?.operation === "create" && appliedRun.mode === "live" && Boolean(appliedRun.targetProductId && appliedRun.proposal.changes.inventory))
        || (appliedRun.status === "applied" && Boolean(appliedRun.proposal?.changes.inventory)),
      run: appliedRun,
      preview,
    });
  } catch (error) {
    return productIntakeErrorResponse(error);
  }
}
