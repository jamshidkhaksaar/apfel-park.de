import { NextRequest, NextResponse } from "next/server";

import { authorizeProductOwner, readAdminIdempotencyKey } from "@/lib/product-intake/admin-auth";
import { productIntakeErrorResponse } from "@/lib/product-intake/http";
import { resolveProductIntakeRunId } from "@/lib/product-intake/repository";
import { parseRunReference } from "@/lib/product-intake/schemas";
import { rebaseProductIntakeRun } from "@/lib/product-intake/workspace-repository";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = authorizeProductOwner(request);
    const { id } = await context.params;
    const runId = await resolveProductIntakeRunId(parseRunReference(id));
    const idempotencyKey = readAdminIdempotencyKey(request, `admin-rebase:${auth.actor.id}:${runId}`);
    const run = await rebaseProductIntakeRun(runId, auth.actor, idempotencyKey);
    return NextResponse.json({ success: true, run });
  } catch (error) {
    return productIntakeErrorResponse(error);
  }
}
