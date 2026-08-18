import { existsSync } from "node:fs";
import { join } from "node:path";

import { NextResponse, type NextRequest } from "next/server";

import { canManageProducts } from "@/lib/admin-auth";
import { createAdminServerClient } from "@/lib/admin-auth-server";
import { query } from "@/lib/db";
import { EPREL_PRODUCT_GROUP, eprelAssetRoutes } from "@/lib/eprel";

export const dynamic = "force-dynamic";

type EprelHit = {
  eprelRegistrationNumber?: string | number;
  supplierOrTrademark?: string;
  modelIdentifier?: string;
  deviceType?: string;
  energyClass?: string;
  batteryEndurancePerCycleInHours?: number;
  batteryEndurancePerCycle?: number;
  batteryEnduranceInCycles?: number;
  repairabilityClass?: string;
  repeatedFreeFallReliabilityClass?: string;
  ingressProtectionRating?: string;
  onMarketStartDate?: number[];
};

const withMirroredAssets = <T extends { registration_number: string }>(row: T) => {
  const routes = eprelAssetRoutes(row.registration_number);
  const exists = (route: string) => existsSync(join(process.cwd(), "public", route.slice(1)));
  return {
    ...row,
    label_image: exists(routes.labelImage) ? routes.labelImage : null,
    fiche_de: exists(routes.ficheDe) ? routes.ficheDe : null,
    fiche_en: exists(routes.ficheEn) ? routes.ficheEn : null,
  };
};

/** Asks the register directly, shaped like a row of the local mirror. */
const lookupLive = async (term: string) => {
  const url =
    `https://eprel.ec.europa.eu/api/products/${EPREL_PRODUCT_GROUP}` +
    `?_page=1&_limit=10&modelIdentifier=${encodeURIComponent(term)}`;
  const response = await fetch(url, {
    // The public API refuses requests that do not look like its own front end.
    headers: {
      "User-Agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36",
      Accept: "application/json, text/plain, */*",
      Referer: `https://eprel.ec.europa.eu/screen/product/${EPREL_PRODUCT_GROUP}`,
    },
    cache: "no-store",
  });
  if (!response.ok) return [];
  const hits = ((await response.json()) as { hits?: EprelHit[] }).hits ?? [];
  return hits.map((hit) => withMirroredAssets({
    registration_number: String(hit.eprelRegistrationNumber ?? ""),
    supplier: hit.supplierOrTrademark ?? "",
    model_identifier: hit.modelIdentifier ?? "",
    device_type: hit.deviceType ?? null,
    energy_class: hit.energyClass ?? null,
    battery_endurance_hours: hit.batteryEndurancePerCycleInHours ?? null,
    battery_endurance_minutes: hit.batteryEndurancePerCycle ?? null,
    battery_endurance_cycles: hit.batteryEnduranceInCycles ?? null,
    repairability_class: hit.repairabilityClass ?? null,
    reliability_class: hit.repeatedFreeFallReliabilityClass ?? null,
    ingress_protection: hit.ingressProtectionRating ?? null,
    on_market_start: Array.isArray(hit.onMarketStartDate)
      ? `${hit.onMarketStartDate[0]}-${String(hit.onMarketStartDate[1]).padStart(2, "0")}-${String(hit.onMarketStartDate[2]).padStart(2, "0")}`
      : null,
  }));
};

/**
 * Searches the mirrored EPREL register so an admin can attach the correct
 * registration to a product.
 *
 * EPREL holds no marketing name -- only the manufacturer model number printed
 * on the box (A3090, SM-X826B) -- so this is a search, not an auto-match. The
 * figures shown come straight from the register and are never derived.
 */
export async function GET(request: NextRequest) {
  const adminClient = await createAdminServerClient();
  const {
    data: { user },
  } = await adminClient.auth.getUser();
  if (!canManageProducts(user)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const term = (request.nextUrl.searchParams.get("q") ?? "").trim();
  if (term.length < 2) {
    return NextResponse.json({ success: true, results: [] });
  }

  try {
    const result = await query(
      `SELECT registration_number, supplier, model_identifier, device_type, energy_class,
              battery_endurance_hours, battery_endurance_minutes, battery_endurance_cycles, repairability_class,
              reliability_class, ingress_protection, on_market_start
       FROM eprel_models
       WHERE model_identifier ILIKE $1 OR supplier ILIKE $1 OR registration_number ILIKE $1
       ORDER BY on_market_start DESC NULLS LAST, model_identifier
       LIMIT 25`,
      [`%${term}%`],
    );
    if (result.rows.length > 0) {
      return NextResponse.json({
        success: true,
        results: result.rows.map((row) => withMirroredAssets({
          ...row,
          registration_number: String(row.registration_number ?? ""),
        })),
      });
    }
    // The mirror is built by paging the register, and paging cannot reach every
    // registration: A3523 (iPhone 17 Pro) is absent from a converged crawl yet
    // returns fine when asked for by model number. So fall back to asking EPREL
    // directly rather than telling an admin a real registration does not exist.
    return NextResponse.json({ success: true, results: await lookupLive(term) });
  } catch (error) {
    console.error("EPREL lookup failed:", error);
    return NextResponse.json({ success: false, error: "Lookup failed" }, { status: 500 });
  }
}
