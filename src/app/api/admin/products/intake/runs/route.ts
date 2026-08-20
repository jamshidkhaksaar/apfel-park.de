import { NextRequest, NextResponse } from "next/server";

import { productIntakeErrorResponse, readJsonRequest } from "@/lib/product-intake/http";
import { authorizeProductStaff, readAdminIdempotencyKey } from "@/lib/product-intake/admin-auth";
import { listProductIntakeRuns } from "@/lib/product-intake/repository";
import { startAdminProductIntakeRun } from "@/lib/product-intake/workspace-repository";
import { catalogConditionToIntake, parseProductIntakeScopes, productIntakeConditions } from "@/lib/product-intake/workspace";
import { SchemaValidationError } from "@/lib/product-intake/errors";

export const dynamic = "force-dynamic";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  try {
    authorizeProductStaff(request);
    const rawLimit = request.nextUrl.searchParams.get("limit") ?? "100";
    const limit = Number(rawLimit);
    if (!Number.isInteger(limit) || limit < 1 || limit > 200) {
      throw new SchemaValidationError(["limit must be an integer from 1 to 200"]);
    }
    return NextResponse.json({ success: true, runs: await listProductIntakeRuns(limit) });
  } catch (error) {
    return productIntakeErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = authorizeProductStaff(request, { mutate: true });
    const { value } = await readJsonRequest(request);
    const body = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
    const productId = typeof body.productId === "string" ? body.productId : "";
    if (!uuidPattern.test(productId)) throw new SchemaValidationError(["productId must be a UUID"]);
    const condition = body.condition == null || body.condition === ""
      ? null
      : catalogConditionToIntake(String(body.condition));
    if (body.condition && !(productIntakeConditions as readonly string[]).includes(String(condition))) {
      throw new SchemaValidationError(["condition must be sealed, open_box or used"]);
    }
    const scopes = parseProductIntakeScopes(body.scopes);
    const price = body.price == null || body.price === "" ? null : Number(body.price);
    if (price != null && (!Number.isFinite(price) || price < 0.01)) throw new SchemaValidationError(["price is invalid"]);
    const inventoryMode = body.inventoryMode === "set" || body.inventoryMode === "add" ? body.inventoryMode : null;
    const quantity = body.quantity == null || body.quantity === "" ? null : Number(body.quantity);
    if (inventoryMode && (quantity == null || !Number.isInteger(quantity) || quantity < 0)) {
      throw new SchemaValidationError(["quantity must be a whole number"]);
    }
    const notes = typeof body.notes === "string" ? body.notes.slice(0, 1000) : null;
    const idempotencyKey = readAdminIdempotencyKey(request, `admin-start:${auth.actor.id}:${productId}:${scopes.join(",")}`);
    const result = await startAdminProductIntakeRun({
      productId,
      condition,
      scopes,
      submittedBy: auth.actor.id,
      submittedByRole: auth.owner ? "owner" : "admin",
      locale: request.cookies.get("admin-lang")?.value === "en" ? "en" : "de",
      price,
      inventoryMode,
      quantity,
      notes,
      actor: auth.actor,
      idempotencyKey,
    });
    return NextResponse.json(
      { success: true, duplicate: result.duplicate, run: result.run, snapshot: result.snapshot },
      { status: result.duplicate ? 200 : 201 },
    );
  } catch (error) {
    return productIntakeErrorResponse(error);
  }
}
