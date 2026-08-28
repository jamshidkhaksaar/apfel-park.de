import { NextRequest, NextResponse } from "next/server";

import { authorizeProductOwner, readAdminIdempotencyKey } from "@/lib/product-intake/admin-auth";
import { productIntakeErrorResponse, readJsonRequest } from "@/lib/product-intake/http";
import { startAdminProductIntakeRun, listProductRevisions } from "@/lib/product-intake/workspace-repository";
import { SchemaValidationError } from "@/lib/product-intake/errors";

export const dynamic = "force-dynamic";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { authorizeProductStaff } = await import("@/lib/product-intake/admin-auth");
    await authorizeProductStaff(request);
    const { id } = await context.params;
    if (!uuidPattern.test(id)) throw new SchemaValidationError(["product id must be a UUID"]);
    return NextResponse.json({ success: true, revisions: await listProductRevisions(id, 100) });
  } catch (error) {
    return productIntakeErrorResponse(error);
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authorizeProductOwner(request);
    const { id } = await context.params;
    if (!uuidPattern.test(id)) throw new SchemaValidationError(["product id must be a UUID"]);
    const { value } = await readJsonRequest(request);
    const body = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
    const revisionId = typeof body.revisionId === "string" ? body.revisionId : "";
    if (!uuidPattern.test(revisionId)) throw new SchemaValidationError(["revisionId must be a UUID"]);
    const idempotencyKey = readAdminIdempotencyKey(request, `admin-restore:${auth.actor.id}:${id}:${revisionId}`);
    const result = await startAdminProductIntakeRun({
      productId: id,
      condition: null,
      scopes: ["full_review"],
      submittedBy: auth.actor.id,
      submittedByRole: "owner",
      locale: request.cookies.get("admin-lang")?.value === "en" ? "en" : "de",
      notes: `Restore request from revision ${revisionId}`,
      actor: auth.actor,
      idempotencyKey,
    });
    return NextResponse.json({
      success: true,
      shadowMode: true,
      run: result.run,
      revisionId,
    }, { status: 201 });
  } catch (error) {
    return productIntakeErrorResponse(error);
  }
}
