import { query } from "@/lib/db";
import { amazonAdapter } from "@/lib/marketplaces/amazon-adapter";
import { ebayAdapter } from "@/lib/marketplaces/ebay-adapter";
import type {
  ListingInput,
  Marketplace,
  MarketplaceAdapter,
  MarketplaceOperation,
  MarketplaceValidation,
} from "@/lib/marketplaces/types";

const validateBase = (input: ListingInput): string[] => {
  const errors: string[] = [];
  if (!input.sku) errors.push("A sellable SKU is required.");
  if (!input.title) errors.push("A product title is required.");
  if (!input.description) errors.push("A product description is required.");
  if (!Number.isFinite(input.price) || input.price <= 0) errors.push("A positive marketplace price is required.");
  if (!input.manufacturer.name || !input.manufacturer.address) {
    errors.push("GPSR manufacturer name and address are required.");
  }
  if (!input.euResponsiblePerson.name || !input.euResponsiblePerson.address) {
    errors.push("GPSR EU responsible-person name and address are required.");
  }
  if (!input.safetyWarnings.length) {
    errors.push("At least one safety warning or explicit ‘none’ statement is required.");
  }
  return errors;
};

const validate = (marketplace: Marketplace, input: ListingInput): MarketplaceValidation => {
  const errors = validateBase(input);
  if (marketplace === "amazon_de") {
    if (["used", "open_box", "refurbished"].includes(input.condition) && !input.amazonRenewedApproved) {
      errors.push("Amazon publication is blocked until Amazon Renewed approval is recorded for this condition.");
    }
    if (!input.gtin && !input.asin) errors.push("Amazon requires a GTIN or an existing ASIN match before publication.");
    if (!input.categoryMappings.amazon_de) errors.push("An Amazon.de productType mapping is required.");
  }
  if (marketplace === "ebay_de" && !input.categoryMappings.ebay_de) {
    errors.push("An eBay.de category and required aspect mapping is required.");
  }
  return { valid: errors.length === 0, errors };
};

export const getMarketplaceAdapter = (marketplace: Marketplace): MarketplaceAdapter => {
  const validator: MarketplaceAdapter["validate"] = (input) => validate(marketplace, input);
  return marketplace === "ebay_de" ? ebayAdapter(validator) : amazonAdapter(validator);
};

export const validateMarketplaceProduct = (
  marketplace: Marketplace,
  input: ListingInput,
): MarketplaceValidation => validate(marketplace, input);

export const enqueueMarketplaceJob = async (
  marketplace: Marketplace,
  operation: MarketplaceOperation,
  sku?: string,
  payload: Record<string, unknown> = {},
): Promise<void> => {
  await query(
    `INSERT INTO marketplace_jobs (marketplace, operation, sku, payload)
     SELECT $1, $2, $3, $4::jsonb
      WHERE NOT EXISTS (
        SELECT 1 FROM marketplace_jobs
         WHERE marketplace = $1 AND operation = $2
           AND sku IS NOT DISTINCT FROM $3
           AND status IN ('queued', 'processing')
      )
     ON CONFLICT DO NOTHING`,
    [marketplace, operation, sku ?? null, JSON.stringify(payload)],
  );
};

export const recordMarketplaceEvent = async (
  marketplace: Marketplace,
  eventId: string,
  eventType: string,
  payload: unknown,
): Promise<boolean> => {
  const result = await query(
    `INSERT INTO marketplace_event_receipts (
       marketplace, external_event_id, event_type, payload, processed_at
     ) VALUES ($1, $2, $3, $4::jsonb, now())
     ON CONFLICT (marketplace, external_event_id) DO NOTHING
     RETURNING id`,
    [marketplace, eventId, eventType, JSON.stringify(payload)],
  );
  return result.rowCount === 1;
};
