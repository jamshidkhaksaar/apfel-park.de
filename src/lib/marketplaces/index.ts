import { query } from '@/lib/db';
import type { ListingInput, Marketplace, MarketplaceAdapter, MarketplaceOperation, MarketplaceValidation } from './types';
const renewed = new Set(['used', 'open_box', 'refurbished']);
const validateBase = (input: ListingInput): string[] => {
  const errors: string[] = [];
  if (!input.sku) errors.push('A sellable SKU is required.'); if (!input.title) errors.push('A product title is required.'); if (!input.description) errors.push('A product description is required.'); if (!Number.isFinite(input.price) || input.price <= 0) errors.push('A positive marketplace price is required.');
  if (!input.manufacturer.name || !input.manufacturer.address) errors.push('GPSR manufacturer name and address are required.'); if (!input.euResponsiblePerson.name || !input.euResponsiblePerson.address) errors.push('GPSR EU responsible-person name and address are required.'); if (!input.safetyWarnings.length) errors.push('At least one safety warning or explicit “none” statement is required.'); return errors;
};
const configured = (marketplace: Marketplace): void => {
  const prefix = marketplace === 'amazon_de' ? 'AMAZON_SP_API_' : 'EBAY_';
  if (!process.env[`${prefix}CLIENT_ID`] || !process.env[`${prefix}CLIENT_SECRET`]) throw new Error(`${marketplace} credentials are not configured in the server environment.`);
  // Intentionally lazy: live transports are only introduced after the private
  // seller app / production keys exist, keeping builds and the browser secret-free.
  throw new Error(`${marketplace} transport is not enabled; complete the credential and sandbox rollout first.`);
};
const adapter = (marketplace: Marketplace): MarketplaceAdapter => ({ validate: (input) => { const errors = validateBase(input); if (marketplace === 'amazon_de') { if (renewed.has(input.condition)) errors.push('Amazon publication is blocked until documented Amazon Renewed approval is recorded for this condition.'); if (!input.gtin && !input.asin) errors.push('Amazon requires a GTIN or an existing ASIN match before publication.'); } if (marketplace === 'ebay_de' && !input.categoryMappings.ebay_de) errors.push('An eBay.de category and required aspect mapping is required.'); return { valid: !errors.length, errors }; }, publish: async () => configured(marketplace), updatePrice: async () => configured(marketplace), updateAvailability: async () => configured(marketplace), importOrders: async () => configured(marketplace), confirmShipment: async () => configured(marketplace), reconcile: async () => configured(marketplace) });
export const getMarketplaceAdapter = (marketplace: Marketplace): MarketplaceAdapter => adapter(marketplace);
export const validateMarketplaceProduct = (marketplace: Marketplace, input: ListingInput): MarketplaceValidation => adapter(marketplace).validate(input);
export const enqueueMarketplaceJob = async (marketplace: Marketplace, operation: MarketplaceOperation, sku?: string, payload: Record<string, unknown> = {}): Promise<void> => { await query('INSERT INTO marketplace_jobs (marketplace, operation, sku, payload) VALUES ($1, $2, $3, $4)', [marketplace, operation, sku ?? null, JSON.stringify(payload)]); };
export const recordMarketplaceEvent = async (marketplace: Marketplace, eventId: string, eventType: string, payload: unknown): Promise<boolean> => { const result = await query('INSERT INTO marketplace_event_receipts (marketplace, external_event_id, event_type, payload, processed_at) VALUES ($1, $2, $3, $4, now()) ON CONFLICT (marketplace, external_event_id) DO NOTHING RETURNING id', [marketplace, eventId, eventType, JSON.stringify(payload)]); return result.rowCount === 1; };
