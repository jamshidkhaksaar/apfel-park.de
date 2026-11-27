import { NextResponse, type NextRequest } from "next/server";

import { canManageProducts } from "@/lib/admin-auth";
import { rejectCrossSiteAdminMutation } from "@/lib/admin-csrf";
import { lookupScannedProduct, recordScannedProductSale } from "@/lib/product-scan-sale";
import { readSessionUserFromRequest } from "@/lib/session";

export async function GET(request: NextRequest) {
  const user = await readSessionUserFromRequest(request);
  if (!canManageProducts(user)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const scanned = (request.nextUrl.searchParams.get("code") ?? "").trim().slice(0, 120);
  if (scanned.length < 3) return NextResponse.json({ error: "not_found" }, { status: 404 });

  try {
    const result = await lookupScannedProduct(scanned);
    if (!result) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json(result);
  } catch (error) {
    console.error("[Admin scan] lookup failed:", error);
    return NextResponse.json({ error: "lookup_failed" }, { status: 500 });
  }
}

type ScanSellPayload = {
  code?: unknown;
  sku?: unknown;
  discount?: unknown;
  idempotencyKey?: unknown;
  note?: unknown;
  notifyTelegram?: unknown;
};

export async function POST(request: NextRequest) {
  const user = await readSessionUserFromRequest(request);
  if (!canManageProducts(user)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const csrf = rejectCrossSiteAdminMutation(request);
  if (csrf) return csrf;

  try {
    const payload = (await request.json()) as ScanSellPayload;
    const rawCode = typeof payload.sku === "string" && payload.sku.trim()
      ? payload.sku
      : typeof payload.code === "string"
        ? payload.code
        : "";
    const codeOrSku = rawCode.trim().slice(0, 120);
    const idempotencyKey =
      typeof payload.idempotencyKey === "string" ? payload.idempotencyKey.trim().slice(0, 160) : "";
    const discount = payload.discount === undefined || payload.discount === null ? 0 : Number(payload.discount);
    const note = typeof payload.note === "string" ? payload.note.trim().slice(0, 500) : undefined;
    const notifyTelegram = payload.notifyTelegram !== false;

    if (codeOrSku.length < 3) {
      return NextResponse.json({ error: "A valid SKU or barcode is required" }, { status: 400 });
    }
    if (!idempotencyKey || !/^[A-Za-z0-9:_-]+$/.test(idempotencyKey)) {
      return NextResponse.json({ error: "A valid idempotency key is required" }, { status: 400 });
    }

    const result = await recordScannedProductSale({
      codeOrSku,
      actor: user?.email ?? "admin",
      idempotencyKey,
      discount,
      note,
      source: "admin_scan",
      notifyTelegram,
    });

    return NextResponse.json({
      ...result.product,
      salePrice: result.salePrice,
      originalPrice: result.originalPrice,
      available: result.snapshot.available,
      version: result.snapshot.version,
      telegram: result.telegram,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "scan_sell_failed";
    if (message === "not_found") return NextResponse.json({ error: "not_found" }, { status: 404 });
    if (message === "insufficient_stock" || message === "no_stock_sku") {
      return NextResponse.json({ error: message }, { status: 409 });
    }
    const status = /invalid|unknown sku|insufficient|negative/i.test(message) ? 400 : 500;
    console.error("[Admin scan] sale failed:", error);
    return NextResponse.json({ error: message }, { status });
  }
}
