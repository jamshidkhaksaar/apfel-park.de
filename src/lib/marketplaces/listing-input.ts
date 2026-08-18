import { query } from "@/lib/db";
import type { ListingInput } from "@/lib/marketplaces/types";

type JsonRecord = Record<string, unknown>;

export const loadMarketplaceListingInput = async (sku: string): Promise<ListingInput | null> => {
  const result = await query(
    `SELECT product.title, product.description, product.price, product.condition,
            product.gtin, product.asin, product.ebay_epid, product.variants,
            product.marketplace_category_mappings, product.manufacturer,
            product.eu_responsible_person, product.safety_warnings,
            product.safety_documents, product.amazon_renewed_approved
       FROM inventory_skus inventory
       JOIN products product ON product.id = inventory.product_id
      WHERE inventory.sku = $1 AND inventory.location = 'local' AND inventory.is_active = true
      LIMIT 1`,
    [sku],
  );
  const row = result.rows[0];
  if (!row) return null;
  const variants = Array.isArray(row.variants) ? row.variants as JsonRecord[] : [];
  const variant = variants.find((entry) => entry.sku === sku);
  return {
    sku,
    title: String(row.title ?? ""),
    description: String(row.description ?? ""),
    price: Number(variant?.price ?? row.price),
    condition: String(row.condition ?? "new"),
    gtin: variant?.gtin ? String(variant.gtin) : row.gtin as string | null,
    asin: variant?.asin ? String(variant.asin) : row.asin as string | null,
    ebayEpid: variant?.ebayEpid ? String(variant.ebayEpid) : row.ebay_epid as string | null,
    amazonRenewedApproved: Boolean(row.amazon_renewed_approved),
    categoryMappings: row.marketplace_category_mappings && typeof row.marketplace_category_mappings === "object"
      ? row.marketplace_category_mappings as Record<string, unknown>
      : {},
    manufacturer: row.manufacturer && typeof row.manufacturer === "object" ? row.manufacturer as Record<string, unknown> : {},
    euResponsiblePerson: row.eu_responsible_person && typeof row.eu_responsible_person === "object"
      ? row.eu_responsible_person as Record<string, unknown>
      : {},
    safetyWarnings: Array.isArray(row.safety_warnings) ? row.safety_warnings.map(String) : [],
    safetyDocuments: Array.isArray(row.safety_documents) ? row.safety_documents.map(String) : [],
  };
};
