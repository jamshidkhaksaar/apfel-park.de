import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { readSessionUserFromRequest } from "@/lib/session";

import { ProductIntakeError, SchemaValidationError } from "./errors";
import { isProductIntakeOwner } from "./owner";
import { intakeHmacHeaders, loadHmacSecrets, verifyHmacRequest } from "./hmac";
import { parseIdempotencyKey } from "./schemas";
import type { ProductIntakeActor } from "./types";

export const readJsonRequest = async (request: NextRequest): Promise<{ raw: string; value: unknown }> => {
  const maxBytes = 512 * 1024;
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new ProductIntakeError("bad_request", "Product-intake request exceeds 512 KiB", 413);
  }
  if (!request.body) throw new ProductIntakeError("bad_request", "JSON request body is required", 400);
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new ProductIntakeError("bad_request", "Product-intake request exceeds 512 KiB", 413);
    }
    chunks.push(value);
  }
  const raw = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))).toString("utf8");
  if (!raw) throw new ProductIntakeError("bad_request", "JSON request body is required", 400);
  try {
    return { raw, value: JSON.parse(raw) as unknown };
  } catch {
    throw new ProductIntakeError("bad_request", "Invalid JSON request body", 400);
  }
};

const integrationActor = (
  request: NextRequest,
  rawBody: string,
  options: { requireIdempotency?: boolean; ownerOnly?: boolean } = {},
): { actor: ProductIntakeActor; idempotencyKey: string | null; keyId: string } => {
  const keyId = request.headers.get(intakeHmacHeaders.keyId)?.trim() ?? "";
  const timestamp = request.headers.get(intakeHmacHeaders.timestamp)?.trim() ?? "";
  const signature = request.headers.get(intakeHmacHeaders.signature)?.trim() ?? "";
  const idempotencyValue = request.headers.get(intakeHmacHeaders.idempotencyKey);
  const idempotencyKey = idempotencyValue ? parseIdempotencyKey(idempotencyValue) : null;
  if (options.requireIdempotency && !idempotencyKey) {
    throw new ProductIntakeError("bad_request", "Idempotency-Key header is required", 400);
  }
  verifyHmacRequest(
    {
      method: request.method,
      path: request.nextUrl.pathname,
      timestamp,
      keyId,
      idempotencyKey,
      body: rawBody,
      signature,
    },
    { secrets: loadHmacSecrets() },
  );
  if (options.ownerOnly) {
    const owners = new Set(
      (process.env.PRODUCT_INTAKE_OWNER_KEY_IDS ?? "owner")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    );
    if (!owners.has(keyId)) throw new ProductIntakeError("forbidden", "Owner approval is required", 403);
  }
  return { actor: { type: "integration", id: keyId }, idempotencyKey, keyId };
};

export const authorizeIntegrationMutation = (
  request: NextRequest,
  rawBody: string,
  options: { ownerOnly?: boolean } = {},
) => integrationActor(request, rawBody, { requireIdempotency: true, ownerOnly: options.ownerOnly });

export const authorizeRunRead = async (request: NextRequest): Promise<ProductIntakeActor> => {
  const user = await readSessionUserFromRequest(request);
  if (isProductIntakeOwner(user)) return { type: "admin", id: user!.email ?? user!.id };
  if (user) throw new ProductIntakeError("forbidden", "Product-intake owner access is required", 403);
  return integrationActor(request, "", { requireIdempotency: false }).actor;
};

export const authorizeOwnerDecision = async (
  request: NextRequest,
  rawBody: string,
): Promise<{ actor: ProductIntakeActor; idempotencyKey: string }> => {
  const user = await readSessionUserFromRequest(request);
  if (isProductIntakeOwner(user)) {
    const idempotencyKey = parseIdempotencyKey(request.headers.get(intakeHmacHeaders.idempotencyKey));
    return { actor: { type: "admin", id: user!.email ?? user!.id }, idempotencyKey };
  }
  if (user) throw new ProductIntakeError("forbidden", "Owner approval is required", 403);
  const result = integrationActor(request, rawBody, { requireIdempotency: true, ownerOnly: true });
  return { actor: result.actor, idempotencyKey: result.idempotencyKey! };
};

export const productIntakeErrorResponse = (error: unknown): NextResponse => {
  if (error instanceof SchemaValidationError) {
    return NextResponse.json({ error: error.message, code: error.code, issues: error.issues }, { status: error.status });
  }
  if (error instanceof ProductIntakeError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
  }
  console.error("[Product intake] Unhandled error:", error);
  return NextResponse.json({ error: "Product-intake request failed", code: "internal_error" }, { status: 500 });
};
