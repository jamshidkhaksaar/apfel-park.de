import { NextRequest, NextResponse } from "next/server";

import { mapAdminProduct, type ProductRow } from "@/lib/admin-product-data";
import { query } from "@/lib/db";
import { SchemaValidationError } from "@/lib/product-intake/errors";
import { authorizeProductStaff } from "@/lib/product-intake/admin-auth";
import { productIntakeErrorResponse } from "@/lib/product-intake/http";
import { listIntakeRunsForProduct, listProductRevisions } from "@/lib/product-intake/workspace-repository";

export const dynamic = "force-dynamic";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const PRODUCT_SELECT = `SELECT id,title,subtitle,description,category,condition,battery_health,has_real_product_photos,condition_note,brand,model,sku,mpn,gtin,identifier_status,asin,ebay_epid,country_of_origin,package_weight_kg,package_length_cm,package_width_cm,package_height_cm,battery_details,charger_included,charging_power_min_w,charging_power_max_w,usb_pd_supported,marketplace_category_mappings,marketplace_attributes,amazon_gtin_exemption,amazon_renewed_approved,price,compare_at_price,stock,slug,is_active,images,feature_bullets,specs,variants,created_at,manufacturer,eu_responsible_person,safety_warnings,safety_documents,eprel_id,energy_label,faq,created_at AS updated_at FROM products`;

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    authorizeProductStaff(request);
    const { id } = await context.params;
    if (!uuidPattern.test(id)) throw new SchemaValidationError(["product id must be a UUID"]);
    const [productResult, featuredResult, runs, revisions] = await Promise.all([
      query(`${PRODUCT_SELECT} WHERE id = $1 LIMIT 1`, [id]),
      query(`SELECT value FROM store_settings WHERE key = 'featured_product_ids' LIMIT 1`),
      listIntakeRunsForProduct(id, 50),
      listProductRevisions(id, 50),
    ]);
    const row = productResult.rows[0] as ProductRow | undefined;
    if (!row) throw new SchemaValidationError(["Product not found"]);
    const featuredValue = (featuredResult.rows[0] as { value?: unknown } | undefined)?.value;
    const featuredIds = Array.isArray(featuredValue)
      ? featuredValue.filter((item): item is string => typeof item === "string")
      : [];
    return NextResponse.json({
      success: true,
      product: mapAdminProduct(row, featuredIds),
      runs,
      revisions,
    });
  } catch (error) {
    return productIntakeErrorResponse(error);
  }
}
