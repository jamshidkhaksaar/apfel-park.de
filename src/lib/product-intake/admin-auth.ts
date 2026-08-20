import { NextRequest, NextResponse } from "next/server";

import { canManageProducts } from "@/lib/admin-auth";
import { rejectCrossSiteAdminMutation } from "@/lib/admin-csrf";
import { readSessionUserFromRequest } from "@/lib/session";
import type { User } from "@/lib/auth-types";

import { ProductIntakeError } from "./errors";
import { isProductIntakeOwner } from "./owner";
import { parseIdempotencyKey } from "./schemas";
import type { ProductIntakeActor } from "./types";

export const unauthorized = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 });
export const forbidden = (message = "Forbidden") => NextResponse.json({ error: message }, { status: 403 });

export const actorFromUser = (user: User): ProductIntakeActor => ({
  type: "admin",
  id: user.email ?? user.id,
});

export const authorizeProductStaff = (request: NextRequest, options: { mutate?: boolean } = {}) => {
  const user = readSessionUserFromRequest(request);
  if (!canManageProducts(user) || !user) {
    throw new ProductIntakeError("forbidden", "Product access is required", 401);
  }
  if (options.mutate) {
    const csrf = rejectCrossSiteAdminMutation(request);
    if (csrf) throw new ProductIntakeError("forbidden", "Forbidden", 403);
  }
  return { user, actor: actorFromUser(user), owner: isProductIntakeOwner(user) };
};

export const authorizeProductOwner = (request: NextRequest) => {
  const auth = authorizeProductStaff(request, { mutate: true });
  if (!auth.owner) throw new ProductIntakeError("forbidden", "Owner approval is required", 403);
  return auth;
};

export const readAdminIdempotencyKey = (request: NextRequest, fallback: string): string => {
  const header = request.headers.get("idempotency-key");
  if (header) return parseIdempotencyKey(header);
  const sanitized = fallback.replace(/[^A-Za-z0-9._:-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 160);
  return parseIdempotencyKey(sanitized.padEnd(8, "x"));
};
