import { NextRequest, NextResponse } from "next/server";

import {
  authorizeIntegrationMutation,
  productIntakeErrorResponse,
  readJsonRequest,
} from "@/lib/product-intake/http";
import { recordProductIntakeProposal, resolveProductIntakeRunId } from "@/lib/product-intake/repository";
import { parseProductProposal, parseRunReference } from "@/lib/product-intake/schemas";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { raw, value } = await readJsonRequest(request);
    const auth = authorizeIntegrationMutation(request, raw, { ownerOnly: true });
    const { id } = await context.params;
    const runId = await resolveProductIntakeRunId(parseRunReference(id));
    const result = await recordProductIntakeProposal(
      runId,
      parseProductProposal(value),
      auth.idempotencyKey!,
      auth.actor,
    );
    return NextResponse.json({ success: true, duplicate: result.duplicate, run: result.value });
  } catch (error) {
    return productIntakeErrorResponse(error);
  }
}
