import { query } from "@/lib/db";
import { channelPrice, requireEnabledChannel } from "@/lib/marketplaces/channel-settings";
import { importMarketplaceOrder } from "@/lib/marketplaces/order-import";
import type { ListingInput, MarketplaceAdapter } from "@/lib/marketplaces/types";

type JsonRecord = Record<string, unknown>;

let accessTokenCache: { token: string; expiresAt: number } | null = null;

const required = (name: string): string => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured`);
  return value;
};

const marketplaceId = () => process.env.AMAZON_SP_API_MARKETPLACE_ID?.trim() || "A1PA6795UKMFR9";
const endpoint = () => (process.env.AMAZON_SP_API_ENDPOINT?.trim() || "https://sellingpartnerapi-eu.amazon.com").replace(/\/$/, "");

const getAccessToken = async (): Promise<string> => {
  if (accessTokenCache && accessTokenCache.expiresAt - 120_000 > Date.now()) return accessTokenCache.token;
  const response = await fetch("https://api.amazon.com/auth/o2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: required("AMAZON_SP_API_REFRESH_TOKEN"),
      client_id: required("AMAZON_SP_API_CLIENT_ID"),
      client_secret: required("AMAZON_SP_API_CLIENT_SECRET"),
    }),
    signal: AbortSignal.timeout(15_000),
  });
  const payload = await response.json().catch(() => null) as { access_token?: string; expires_in?: number; error_description?: string } | null;
  if (!response.ok || !payload?.access_token) {
    throw new Error(`Amazon LWA HTTP ${response.status}: ${payload?.error_description ?? "missing token"}`);
  }
  accessTokenCache = {
    token: payload.access_token,
    expiresAt: Date.now() + Math.max(300, Number(payload.expires_in ?? 3600)) * 1000,
  };
  return payload.access_token;
};

const amazonRequest = async <T = JsonRecord>(path: string, init: RequestInit = {}): Promise<T> => {
  const token = await getAccessToken();
  const response = await fetch(`${endpoint()}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": "ApfelPark-Omnichannel/1.0 (Language=TypeScript)",
      "x-amz-access-token": token,
      "x-amz-date": new Date().toISOString().replace(/[:-]|\.\d{3}/g, ""),
      ...init.headers,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(25_000),
  });
  const text = await response.text();
  let payload: T;
  try {
    payload = text ? JSON.parse(text) as T : {} as T;
  } catch {
    payload = {} as T;
  }
  if (!response.ok) throw new Error(`Amazon SP-API HTTP ${response.status}: ${text.slice(0, 1400)}`);
  const issues = (payload as JsonRecord).issues;
  if (Array.isArray(issues)) {
    const errors = issues.filter((issue) => String((issue as JsonRecord).severity ?? "").toUpperCase() === "ERROR");
    if (errors.length) throw new Error(`Amazon listing rejected: ${JSON.stringify(errors).slice(0, 1400)}`);
  }
  return payload;
};

const asRecord = (value: unknown): JsonRecord => value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {};

type AmazonProduct = {
  listingId: string;
  sku: string;
  condition: string;
  basePrice: number;
  quantity: number;
  asin: string | null;
  gtin: string | null;
  productType: string;
  renewedApproved: boolean;
  syncStock: boolean;
  syncPrice: boolean;
};

const amazonProductType = (mapping: unknown): string => {
  if (typeof mapping === "string" && mapping.trim()) return mapping.trim();
  const record = asRecord(mapping);
  const value = record.productType ?? record.product_type ?? record.type;
  if (typeof value === "string" && value.trim()) return value.trim();
  throw new Error("The approved Amazon listing has no productType mapping");
};

const loadApprovedProduct = async (sku: string): Promise<AmazonProduct> => {
  const result = await query(
    `SELECT listing.id AS listing_id, listing.sync_stock, listing.sync_price, inventory.sku,
            available_inventory(inventory.on_hand, inventory.reserved, inventory.safety_buffer) AS quantity,
            product.condition, product.price, product.asin, product.gtin, product.variants,
            product.marketplace_category_mappings, product.amazon_renewed_approved
       FROM marketplace_listings listing
       JOIN inventory_skus inventory ON inventory.sku = listing.sku AND inventory.location = 'local' AND inventory.is_active = true
       JOIN products product ON product.id = inventory.product_id
      WHERE listing.marketplace = 'amazon_de' AND listing.sku = $1
        AND listing.approved_at IS NOT NULL
      LIMIT 1`,
    [sku],
  );
  const row = result.rows[0];
  if (!row) throw new Error(`Amazon SKU ${sku} has not been approved for publication`);
  const variants = Array.isArray(row.variants) ? row.variants as JsonRecord[] : [];
  const variant = variants.find((entry) => entry.sku === sku);
  const mappings = asRecord(row.marketplace_category_mappings);
  return {
    listingId: String(row.listing_id),
    sku: String(row.sku),
    condition: String(row.condition ?? "new"),
    basePrice: Number(variant?.price ?? row.price),
    quantity: Number(row.quantity),
    asin: variant?.asin ? String(variant.asin) : row.asin ? String(row.asin) : null,
    gtin: variant?.gtin ? String(variant.gtin) : row.gtin ? String(row.gtin) : null,
    productType: amazonProductType(mappings.amazon_de),
    renewedApproved: Boolean(row.amazon_renewed_approved),
    syncStock: Boolean(row.sync_stock),
    syncPrice: Boolean(row.sync_price),
  };
};

const conditionFor = (product: AmazonProduct): string => {
  if (product.condition === "new") return "new_new";
  if (!product.renewedApproved) throw new Error("Amazon Renewed approval is required for non-new products");
  return product.condition === "open_box" ? "used_like_new" : "used_very_good";
};

const listingPath = (product: AmazonProduct): string => {
  const params = new URLSearchParams({ marketplaceIds: marketplaceId(), issueLocale: "de_DE" });
  return `/listings/2021-08-01/items/${encodeURIComponent(required("AMAZON_SP_API_SELLER_ID"))}/${encodeURIComponent(product.sku)}?${params}`;
};

const availabilityPatch = (quantity: number) => ({
  op: "replace",
  path: "/attributes/fulfillment_availability",
  value: [{ fulfillment_channel_code: "DEFAULT", quantity: Math.max(0, Math.trunc(quantity)) }],
});

const pricePatch = (price: number) => ({
  op: "replace",
  path: "/attributes/purchasable_offer",
  value: [{
    marketplace_id: marketplaceId(),
    audience: "ALL",
    currency: "EUR",
    our_price: [{ schedule: [{ value_with_tax: price }] }],
  }],
});

const publish = async (input: ListingInput): Promise<void> => {
  const settings = await requireEnabledChannel("amazon_de", "publish");
  const product = await loadApprovedProduct(input.sku);
  const price = channelPrice(product.basePrice, settings);
  if (!product.asin && !product.gtin) throw new Error("Amazon publication requires an ASIN or GTIN");
  const attributes: JsonRecord = {
    condition_type: [{ value: conditionFor(product), marketplace_id: marketplaceId() }],
    fulfillment_availability: [{ fulfillment_channel_code: "DEFAULT", quantity: product.quantity }],
    purchasable_offer: [{
      marketplace_id: marketplaceId(), audience: "ALL", currency: "EUR",
      our_price: [{ schedule: [{ value_with_tax: price }] }],
    }],
    ...(product.asin ? { merchant_suggested_asin: [{ value: product.asin, marketplace_id: marketplaceId() }] } : {}),
    ...(!product.asin && product.gtin ? {
      externally_assigned_product_identifier: [{ value: product.gtin, marketplace_id: marketplaceId() }],
    } : {}),
  };
  await amazonRequest(listingPath(product), {
    method: "PUT",
    body: JSON.stringify({ productType: product.productType, requirements: "LISTING_OFFER_ONLY", attributes }),
  });
  await query(
    `UPDATE marketplace_listings SET status = CASE WHEN $2::int > 0 THEN 'active' ELSE 'inactive' END,
            price = $3, fulfillment_mode = 'MFN', last_synced_at = now(), last_error = null, updated_at = now()
      WHERE id = $1`,
    [product.listingId, product.quantity, price],
  );
};

const updateAvailability = async (sku: string, quantity: number): Promise<void> => {
  await requireEnabledChannel("amazon_de", "stock");
  const product = await loadApprovedProduct(sku);
  if (!product.syncStock) throw new Error(`Amazon stock synchronization is disabled for ${sku}`);
  const available = Math.max(0, Math.trunc(quantity));
  await amazonRequest(listingPath(product), {
    method: "PATCH",
    body: JSON.stringify({ productType: product.productType, patches: [availabilityPatch(available)] }),
  });
  await query(
    `UPDATE marketplace_listings SET status = CASE WHEN $2::int > 0 THEN 'active' ELSE 'inactive' END,
            last_synced_at = now(), last_error = null, updated_at = now() WHERE id = $1`,
    [product.listingId, available],
  );
};

const updatePrice = async (sku: string, requestedBasePrice: number): Promise<void> => {
  const settings = await requireEnabledChannel("amazon_de", "price");
  const product = await loadApprovedProduct(sku);
  if (!product.syncPrice) throw new Error(`Amazon price synchronization is disabled for ${sku}`);
  const price = channelPrice(requestedBasePrice > 0 ? requestedBasePrice : product.basePrice, settings);
  await amazonRequest(listingPath(product), {
    method: "PATCH",
    body: JSON.stringify({ productType: product.productType, patches: [pricePatch(price)] }),
  });
  await query("UPDATE marketplace_listings SET price = $2, last_synced_at = now(), last_error = null, updated_at = now() WHERE id = $1", [product.listingId, price]);
};

const unpublish = async (sku: string): Promise<void> => {
  await requireEnabledChannel("amazon_de", "publish");
  const product = await loadApprovedProduct(sku);
  await amazonRequest(listingPath(product), { method: "DELETE" });
  await query("UPDATE marketplace_listings SET status = 'inactive', last_synced_at = now(), updated_at = now() WHERE id = $1", [product.listingId]);
};

const recordValue = (record: JsonRecord, ...keys: string[]): unknown => {
  for (const key of keys) if (record[key] !== undefined) return record[key];
  return undefined;
};

const importOrders = async (): Promise<void> => {
  await requireEnabledChannel("amazon_de", "orders");
  const params = new URLSearchParams({
    marketplaceIds: marketplaceId(),
    lastUpdatedAfter: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    lastUpdatedBefore: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    includedData: "FULFILLMENT,CANCELLATION",
    fulfilledBy: "MERCHANT",
    maxResultsPerPage: "100",
  });
  for (;;) {
    const payload = await amazonRequest<JsonRecord>(`/orders/2026-01-01/orders?${params}`);
    const orders = Array.isArray(payload.orders) ? payload.orders as JsonRecord[] : [];
    for (const order of orders) {
      const externalOrderId = String(recordValue(order, "orderId", "amazonOrderId", "AmazonOrderId") ?? "");
      const fulfillment = asRecord(recordValue(order, "fulfillment", "Fulfillment"));
      const status = String(
        recordValue(fulfillment, "fulfillmentStatus", "status")
          ?? recordValue(order, "fulfillmentStatus", "orderStatus", "OrderStatus")
          ?? "PENDING",
      ).toUpperCase();
      if (!externalOrderId || status === "PENDING") continue;
      const itemsValue = recordValue(order, "orderItems", "items", "OrderItems");
      const items = Array.isArray(itemsValue) ? itemsValue as JsonRecord[] : [];
      const lines = items.map((item) => {
        const product = asRecord(recordValue(item, "product", "Product"));
        return {
          sku: String(recordValue(item, "sellerSku", "SellerSKU", "sku") ?? recordValue(product, "sellerSku", "sku") ?? ""),
          quantity: Number(recordValue(item, "quantityOrdered", "quantity", "QuantityOrdered") ?? 0),
        };
      });
      const fulfilledBy = String(
        recordValue(fulfillment, "fulfilledBy", "fulfillmentChannel")
          ?? recordValue(order, "fulfilledBy", "fulfillmentChannel", "FulfillmentChannel")
          ?? "MERCHANT",
      ).toUpperCase();
      await importMarketplaceOrder({
        marketplace: "amazon_de",
        externalOrderId,
        status,
        fulfillmentMode: fulfilledBy === "AMAZON" || fulfilledBy === "AFN" ? "FBA" : "MFN",
        cancelled: status === "CANCELLED" || status === "CANCELED",
        lines,
        rawPayload: order,
      });
    }
    const pagination = asRecord(payload.pagination);
    const nextToken = recordValue(pagination, "nextToken") ?? recordValue(payload, "nextToken", "paginationToken");
    if (typeof nextToken !== "string" || !nextToken) break;
    params.set("paginationToken", nextToken);
  }
};

const reconcile = async (): Promise<void> => {
  const settings = await requireEnabledChannel("amazon_de", "stock");
  const listings = await query(
    `SELECT listing.sku,
            available_inventory(inventory.on_hand, inventory.reserved, inventory.safety_buffer) AS quantity,
            product.price
       FROM marketplace_listings listing
       JOIN inventory_skus inventory ON inventory.sku = listing.sku AND inventory.location = 'local' AND inventory.is_active = true
       JOIN products product ON product.id = inventory.product_id
      WHERE listing.marketplace = 'amazon_de' AND listing.approved_at IS NOT NULL
        AND listing.sync_stock = true`,
  );
  for (const row of listings.rows) {
    await updateAvailability(String(row.sku), Number(row.quantity));
    if (settings.priceSyncEnabled) await updatePrice(String(row.sku), Number(row.price));
  }
};

export const amazonAdapter = (validate: MarketplaceAdapter["validate"]): MarketplaceAdapter => ({
  validate,
  publish,
  unpublish,
  updatePrice,
  updateAvailability,
  importOrders,
  confirmShipment: async () => {
    throw new Error("Amazon shipment confirmation is not enabled; configure the seller-fulfilled shipment workflow first");
  },
  reconcile,
});
