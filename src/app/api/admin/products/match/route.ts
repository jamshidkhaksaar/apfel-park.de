import { NextRequest, NextResponse } from "next/server";

import { canManageProducts } from "@/lib/admin-auth";
import { createAdminServerClient } from "@/lib/admin-auth-server";
import { rejectCrossSiteAdminMutation } from "@/lib/admin-csrf";
import { withTransaction } from "@/lib/db";
import {
  classifyCatalogOfferMatch,
  findModelCatalogCandidates,
  normalizeBatteryTuple,
  type OfferCondition,
} from "@/lib/catalog-offer-resolution";
import { sanitizeInput } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const adminClient = await createAdminServerClient();
  const {
    data: { user },
  } = await adminClient.auth.getUser();
  if (!canManageProducts(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const csrf = rejectCrossSiteAdminMutation(request, "Unauthorized");
  if (csrf) return csrf;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const rawCondition = String(body.condition ?? "new").toLowerCase().trim();
    const condition: OfferCondition =
      rawCondition === "open_box" || rawCondition === "refurbished"
        ? "open_box"
        : rawCondition === "used"
          ? "used"
          : "new";

    const rawMin = body.batteryHealth != null && body.batteryHealth !== "" ? Number(body.batteryHealth) : null;
    const rawMax = body.batteryHealthMax != null && body.batteryHealthMax !== "" ? Number(body.batteryHealthMax) : null;
    const battery = normalizeBatteryTuple(condition, rawMin, rawMax);

    const configuration =
      body.configuration && typeof body.configuration === "object" && !Array.isArray(body.configuration)
        ? Object.fromEntries(
            Object.entries(body.configuration as Record<string, unknown>)
              .map(([k, v]) => [sanitizeInput(k), sanitizeInput(String(v ?? ""))])
              .filter(([k, v]) => Boolean(k && v)),
          )
        : null;

    const input = {
      productId: typeof body.productId === "string" && body.productId.trim() ? body.productId.trim() : null,
      sku: typeof body.sku === "string" && body.sku.trim() ? sanitizeInput(body.sku) : null,
      gtin: typeof body.gtin === "string" && body.gtin.trim() ? sanitizeInput(body.gtin) : null,
      mpn: typeof body.mpn === "string" && body.mpn.trim() ? sanitizeInput(body.mpn) : null,
      category: typeof body.category === "string" && body.category.trim() ? sanitizeInput(body.category) : "smartphones",
      brand: typeof body.brand === "string" && body.brand.trim() ? sanitizeInput(body.brand) : null,
      model: typeof body.model === "string" && body.model.trim() ? sanitizeInput(body.model) : null,
      title: typeof body.title === "string" && body.title.trim() ? sanitizeInput(body.title) : null,
      condition,
      color: typeof body.color === "string" && body.color.trim() ? sanitizeInput(body.color) : null,
      storage: typeof body.storage === "string" && body.storage.trim() ? sanitizeInput(body.storage) : null,
      configuration,
      batteryHealth: battery.min,
      batteryHealthMax: battery.max,
    };

    const resolution = await withTransaction(async (client) => {
      const candidates = await findModelCatalogCandidates(client, input);
      return classifyCatalogOfferMatch(input, candidates);
    });

    if (resolution.kind === "exact_offer") {
      return NextResponse.json({
        kind: "exact_offer",
        reason: resolution.reason,
        familyId: resolution.familyId,
        siblingCount: resolution.siblingIds.length,
        candidate: {
          id: resolution.candidate.id,
          title: resolution.candidate.title,
          brand: resolution.candidate.brand,
          model: resolution.candidate.model,
          condition: resolution.candidate.condition,
          color: resolution.candidate.color,
          storage: resolution.candidate.storage,
          batteryHealth: resolution.candidate.batteryHealth,
          batteryHealthMax: resolution.candidate.batteryHealthMax,
          price: resolution.candidate.price,
          stock: resolution.candidate.stock,
          sku: resolution.candidate.sku,
          images: resolution.candidate.images,
          eprelId: resolution.candidate.eprelId,
        },
      });
    }

    if (resolution.kind === "next_variant") {
      return NextResponse.json({
        kind: "next_variant",
        familyId: resolution.familyId,
        siblingCount: resolution.siblingIds.length,
        templateCandidate: {
          id: resolution.templateCandidate.id,
          title: resolution.templateCandidate.title,
          brand: resolution.templateCandidate.brand,
          model: resolution.templateCandidate.model,
          category: resolution.templateCandidate.category,
          subtitle: resolution.templateCandidate.subtitle,
          description: resolution.templateCandidate.description,
          specs: resolution.templateCandidate.specs,
          featureBullets: resolution.templateCandidate.featureBullets,
          manufacturer: resolution.templateCandidate.manufacturer,
          euResponsiblePerson: resolution.templateCandidate.euResponsiblePerson,
          safetyWarnings: resolution.templateCandidate.safetyWarnings,
          eprelId: resolution.templateCandidate.eprelId,
        },
      });
    }

    return NextResponse.json({
      kind: "new_product",
      familyId: null,
      siblingCount: 0,
    });
  } catch (error) {
    console.error("Catalog match preview failed:", error);
    return NextResponse.json({ error: "Match lookup failed" }, { status: 500 });
  }
}
