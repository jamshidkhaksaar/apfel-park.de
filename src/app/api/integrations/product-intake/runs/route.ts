import { NextRequest, NextResponse } from "next/server";

import {
  authorizeIntegrationMutation,
  authorizeRunRead,
  productIntakeErrorResponse,
  readJsonRequest,
} from "@/lib/product-intake/http";
import { createProductIntakeRun, listProductIntakeRuns } from "@/lib/product-intake/repository";
import { parseCreateRunInput } from "@/lib/product-intake/schemas";
import type { CreateRunInput } from "@/lib/product-intake/types";
import { ProductIntakeError } from "@/lib/product-intake/errors";

export const dynamic = "force-dynamic";

const ids = (name: string): Set<string> => new Set(
  (process.env[name] ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
);

export async function POST(request: NextRequest) {
  try {
    const { raw, value } = await readJsonRequest(request);
    const auth = authorizeIntegrationMutation(request, raw);
    const parsed = parseCreateRunInput(value);
    const ownerIds = ids("PRODUCT_INTAKE_OWNER_KEY_IDS");
    const safiIds = ids("PRODUCT_INTAKE_SAFI_KEY_IDS");
    const proxyIds = ids("PRODUCT_INTAKE_PROXY_KEY_IDS");
    const submittedByRole: CreateRunInput["submittedByRole"] = proxyIds.has(auth.keyId)
      ? parsed.submittedByRole
      : ownerIds.has(auth.keyId)
      ? "owner"
      : safiIds.has(auth.keyId)
        ? "safi"
        : "integration";
    const input = {
      ...parsed,
      submittedBy: proxyIds.has(auth.keyId) ? parsed.submittedBy : auth.keyId,
      submittedByRole,
    };
    const result = await createProductIntakeRun(input, auth.idempotencyKey!, auth.actor);
    return NextResponse.json(
      { success: true, duplicate: result.duplicate, run: result.value },
      { status: result.duplicate ? 200 : 201 },
    );
  } catch (error) {
    return productIntakeErrorResponse(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    authorizeRunRead(request);
    const rawLimit = request.nextUrl.searchParams.get("limit") ?? "100";
    if (!/^\d{1,3}$/.test(rawLimit)) throw new ProductIntakeError("bad_request", "limit must be an integer from 1 to 200", 400);
    const limit = Number(rawLimit);
    if (limit < 1 || limit > 200) throw new ProductIntakeError("bad_request", "limit must be an integer from 1 to 200", 400);
    return NextResponse.json({ success: true, runs: await listProductIntakeRuns(limit) });
  } catch (error) {
    return productIntakeErrorResponse(error);
  }
}
