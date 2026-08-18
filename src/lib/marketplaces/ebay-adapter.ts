import { query } from "@/lib/db";
import { siteInfo } from "@/lib/site";
import { channelPrice, requireEnabledChannel } from "@/lib/marketplaces/channel-settings";
import { getEbayApiBaseUrl, getEbayUserAccessToken, type EbayEnvironment } from "@/lib/marketplaces/ebay";
import { importMarketplaceOrder } from "@/lib/marketplaces/order-import";
import type { ListingInput, MarketplaceAdapter } from "@/lib/marketplaces/types";

type JsonRecord = Record<string, unknown>;

const environment = (): EbayEnvironment => {
  const value = process.env.EBAY_INVENTORY_ENVIRONMENT?.trim().toLowerCase() || "production";
  if (value !== "sandbox" && value !== "production") throw new Error("EBAY_INVENTORY_ENVIRONMENT is invalid");
  return value;
};

const required = (name: string): string => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured`);
  return value;
};

const ebayRequest = async <T = JsonRecord>(path: string, init: RequestInit = {}): Promise<T> => {
  const targetEnvironment = environment();
  const token = await getEbayUserAccessToken(targetEnvironment);
  const response = await fetch(`${getEbayApiBaseUrl(targetEnvironment)}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      "Content-Language": "de-DE",
      "Content-Type": "application/json",
      "X-EBAY-C-MARKETPLACE-ID": "EBAY_DE",
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
  if (!response.ok) throw new Error(`eBay API HTTP ${response.status}: ${text.slice(0, 1400)}`);
  const responses = (payload as JsonRecord).responses;
  if (Array.isArray(responses)) {
    const failed = responses.find((entry) => Number((entry as JsonRecord).statusCode ?? 200) >= 400) as JsonRecord | undefined;
    if (failed) throw new Error(`eBay bulk update failed: ${JSON.stringify(failed).slice(0, 1400)}`);
  }
  return payload;
};

type EbayProduct = {
  sku: string;
  listingId: string;
  offerId: string | null;
  externalListingId: string | null;
  title: string;
  description: string;
  condition: string;
  basePrice: number;
  quantity: number;
  gtin: string | null;
  mpn: string | null;
  brand: string | null;
  images: string[];
  categoryId: string;
  aspects: Record<string, string[]>;
  syncStock: boolean;
  syncPrice: boolean;
};

const asRecord = (value: unknown): JsonRecord => value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {};

const absoluteImage = (value: string) => /^https?:\/\//i.test(value) ? value : new URL(value, siteInfo.url).toString();

const categoryIdFrom = (mapping: unknown): string => {
  if (typeof mapping === "string" && mapping.trim()) return mapping.trim();
  const record = asRecord(mapping);
  const value = record.categoryId ?? record.category_id ?? record.id;
  if (typeof value === "string" && value.trim()) return value.trim();
  throw new Error("The approved eBay listing has no eBay.de category ID");
};

const normalizedAspects = (value: unknown): Record<string, string[]> => {
  const result: Record<string, string[]> = {};
  for (const [name, raw] of Object.entries(asRecord(value))) {
    const values = Array.isArray(raw) ? raw : [raw];
    const strings = values.map(String).map((entry) => entry.trim()).filter(Boolean);
    if (strings.length) result[name] = strings;
  }
  return result;
};

const loadApprovedProduct = async (sku: string): Promise<EbayProduct> => {
  const result = await query(
    `SELECT listing.id AS listing_id, listing.external_offer_id, listing.external_listing_id,
            listing.sync_stock, listing.sync_price,
            product.title, product.description, product.condition, product.price, product.brand,
            product.gtin, product.mpn, product.images, product.variants,
            product.marketplace_category_mappings, product.marketplace_attributes,
            inventory.sku,
            available_inventory(inventory.on_hand, inventory.reserved, inventory.safety_buffer) AS quantity
       FROM marketplace_listings listing
       JOIN inventory_skus inventory ON inventory.sku = listing.sku AND inventory.location = 'local' AND inventory.is_active = true
       JOIN products product ON product.id = inventory.product_id
      WHERE listing.marketplace = 'ebay_de' AND listing.sku = $1
        AND listing.approved_at IS NOT NULL
      LIMIT 1`,
    [sku],
  );
  const row = result.rows[0];
  if (!row) throw new Error(`eBay SKU ${sku} has not been approved for publication`);
  const variants = Array.isArray(row.variants) ? row.variants as JsonRecord[] : [];
  const variant = variants.find((entry) => entry.sku === sku);
  const mappings = asRecord(row.marketplace_category_mappings);
  const marketplaceAttributes = asRecord(row.marketplace_attributes);
  const variantImages = Array.isArray(variant?.images) ? variant.images.map(String) : [];
  const images = (variantImages.length ? variantImages : Array.isArray(row.images) ? row.images.map(String) : [])
    .filter(Boolean)
    .slice(0, 12)
    .map(absoluteImage);
  const aspects = normalizedAspects(marketplaceAttributes.ebay_de);
  if (row.brand && !aspects.Marke) aspects.Marke = [String(row.brand)];
  if (variant?.color && !aspects.Farbe) aspects.Farbe = [String(variant.color)];
  if (variant?.storage && !aspects.Speicherkapazität) aspects.Speicherkapazität = [String(variant.storage)];
  return {
    sku: String(row.sku),
    listingId: String(row.listing_id),
    offerId: row.external_offer_id ? String(row.external_offer_id) : null,
    externalListingId: row.external_listing_id ? String(row.external_listing_id) : null,
    title: String(row.title),
    description: String(row.description ?? row.title),
    condition: String(row.condition ?? "new"),
    basePrice: Number(variant?.price ?? row.price),
    quantity: Number(row.quantity),
    gtin: variant?.gtin ? String(variant.gtin) : row.gtin ? String(row.gtin) : null,
    mpn: variant?.mpn ? String(variant.mpn) : row.mpn ? String(row.mpn) : null,
    brand: row.brand ? String(row.brand) : null,
    images,
    categoryId: categoryIdFrom(mappings.ebay_de),
    aspects,
    syncStock: Boolean(row.sync_stock),
    syncPrice: Boolean(row.sync_price),
  };
};

const conditionFor = (condition: string): string => {
  if (condition === "new") return "NEW";
  if (condition === "open_box") return "LIKE_NEW";
  return "USED_EXCELLENT";
};

const discoverOfferId = async (product: EbayProduct): Promise<string> => {
  if (product.offerId) return product.offerId;
  const payload = await ebayRequest<{ offers?: Array<{ offerId?: string }> }>(
    `/sell/inventory/v1/offer?sku=${encodeURIComponent(product.sku)}&marketplace_id=EBAY_DE`,
  );
  const offerId = payload.offers?.find((offer) => offer.offerId)?.offerId;
  if (!offerId) throw new Error(`No eBay offer exists for ${product.sku}`);
  await query(
    `UPDATE marketplace_listings SET external_offer_id = $2, updated_at = now()
      WHERE id = $1`,
    [product.listingId, offerId],
  );
  return offerId;
};

const publish = async (input: ListingInput): Promise<void> => {
  const settings = await requireEnabledChannel("ebay_de", "publish");
  const product = await loadApprovedProduct(input.sku);
  const price = channelPrice(product.basePrice, settings);
  const productPayload: JsonRecord = {
    availability: { shipToLocationAvailability: { quantity: product.quantity } },
    condition: conditionFor(product.condition),
    product: {
      title: product.title.slice(0, 80),
      description: product.description.slice(0, 4000),
      aspects: product.aspects,
      imageUrls: product.images,
      ...(product.brand ? { brand: product.brand } : {}),
      ...(product.mpn ? { mpn: product.mpn } : {}),
      ...(product.gtin ? { ean: [product.gtin] } : {}),
    },
  };
  await ebayRequest(`/sell/inventory/v1/inventory_item/${encodeURIComponent(product.sku)}`, {
    method: "PUT",
    body: JSON.stringify(productPayload),
  });

  const offerPayload = {
    sku: product.sku,
    marketplaceId: "EBAY_DE",
    format: "FIXED_PRICE",
    availableQuantity: product.quantity,
    categoryId: product.categoryId,
    merchantLocationKey: required("EBAY_MERCHANT_LOCATION_KEY"),
    listingDescription: product.description.slice(0, 4000),
    listingPolicies: {
      paymentPolicyId: required("EBAY_PAYMENT_POLICY_ID"),
      fulfillmentPolicyId: required("EBAY_FULFILLMENT_POLICY_ID"),
      returnPolicyId: required("EBAY_RETURN_POLICY_ID"),
    },
    pricingSummary: { price: { currency: "EUR", value: price.toFixed(2) } },
  };
  let offerId = product.offerId;
  if (offerId) {
    await ebayRequest(`/sell/inventory/v1/offer/${encodeURIComponent(offerId)}`, {
      method: "PUT",
      body: JSON.stringify(offerPayload),
    });
  } else {
    const created = await ebayRequest<{ offerId?: string }>("/sell/inventory/v1/offer", {
      method: "POST",
      body: JSON.stringify(offerPayload),
    });
    offerId = created.offerId ?? null;
  }
  if (!offerId) throw new Error("eBay did not return an offer ID");
  const published = await ebayRequest<{ listingId?: string }>(`/sell/inventory/v1/offer/${encodeURIComponent(offerId)}/publish`, {
    method: "POST",
    body: "{}",
  });
  await query(
    `UPDATE marketplace_listings
        SET external_offer_id = $2, external_listing_id = coalesce($3, external_listing_id),
            status = 'active', price = $4, last_synced_at = now(), last_error = null, updated_at = now()
      WHERE id = $1`,
    [product.listingId, offerId, published.listingId ?? null, price],
  );
};

const updateAvailability = async (sku: string, quantity: number): Promise<void> => {
  await requireEnabledChannel("ebay_de", "stock");
  const product = await loadApprovedProduct(sku);
  if (!product.syncStock) throw new Error(`eBay stock synchronization is disabled for ${sku}`);
  const offerId = await discoverOfferId(product);
  const available = Math.max(0, Math.trunc(quantity));
  await ebayRequest("/sell/inventory/v1/bulk_update_price_quantity", {
    method: "POST",
    body: JSON.stringify({
      requests: [{
        sku: product.sku,
        shipToLocationAvailability: { quantity: available },
        offers: [{ offerId, availableQuantity: available }],
      }],
    }),
  });
  await query(
    `UPDATE marketplace_listings SET status = CASE WHEN $2::int > 0 THEN 'active' ELSE 'inactive' END,
            last_synced_at = now(), last_error = null, updated_at = now()
      WHERE id = $1`,
    [product.listingId, available],
  );
};

const updatePrice = async (sku: string, requestedBasePrice: number): Promise<void> => {
  const settings = await requireEnabledChannel("ebay_de", "price");
  const product = await loadApprovedProduct(sku);
  if (!product.syncPrice) throw new Error(`eBay price synchronization is disabled for ${sku}`);
  const offerId = await discoverOfferId(product);
  const price = channelPrice(requestedBasePrice > 0 ? requestedBasePrice : product.basePrice, settings);
  await ebayRequest("/sell/inventory/v1/bulk_update_price_quantity", {
    method: "POST",
    body: JSON.stringify({ requests: [{ sku: product.sku, offers: [{ offerId, price: { currency: "EUR", value: price.toFixed(2) } }] }] }),
  });
  await query("UPDATE marketplace_listings SET price = $2, last_synced_at = now(), last_error = null, updated_at = now() WHERE id = $1", [product.listingId, price]);
};

const unpublish = async (sku: string): Promise<void> => {
  await requireEnabledChannel("ebay_de", "publish");
  const product = await loadApprovedProduct(sku);
  const offerId = await discoverOfferId(product);
  await ebayRequest(`/sell/inventory/v1/offer/${encodeURIComponent(offerId)}/withdraw`, { method: "POST", body: "{}" });
  await query("UPDATE marketplace_listings SET status = 'inactive', last_synced_at = now(), updated_at = now() WHERE id = $1", [product.listingId]);
};

type EbayOrder = {
  orderId?: string;
  orderPaymentStatus?: string;
  orderFulfillmentStatus?: string;
  cancelStatus?: { cancelState?: string };
  lineItems?: Array<{ sku?: string; quantity?: number; lineItemId?: string }>;
};

const importOrders = async (): Promise<void> => {
  await requireEnabledChannel("ebay_de", "orders");
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const until = new Date().toISOString();
  const filter = `lastmodifieddate:[${since}..${until}]`;
  let offset = 0;
  for (;;) {
    const payload = await ebayRequest<{ orders?: EbayOrder[]; total?: number }>(
      `/sell/fulfillment/v1/order?filter=${encodeURIComponent(filter)}&limit=200&offset=${offset}`,
    );
    const orders = payload.orders ?? [];
    for (const order of orders) {
      const cancelled = order.cancelStatus?.cancelState === "CANCELED";
      if (!order.orderId || (!cancelled && order.orderPaymentStatus !== "PAID")) continue;
      await importMarketplaceOrder({
        marketplace: "ebay_de",
        externalOrderId: order.orderId,
        status: cancelled ? "CANCELLED" : order.orderFulfillmentStatus ?? "PAID",
        fulfillmentMode: "MFN",
        cancelled,
        lines: (order.lineItems ?? []).map((line) => ({ sku: line.sku ?? "", quantity: Number(line.quantity ?? 0) })),
        rawPayload: order,
      });
    }
    offset += orders.length;
    if (!orders.length || offset >= Number(payload.total ?? 0)) break;
  }
};

const confirmShipment = async (externalOrderId: string, carrier: string, trackingNumber: string): Promise<void> => {
  await requireEnabledChannel("ebay_de", "orders");
  const order = await ebayRequest<EbayOrder>(`/sell/fulfillment/v1/order/${encodeURIComponent(externalOrderId)}`);
  const lineItems = (order.lineItems ?? []).filter((line) => line.lineItemId).map((line) => ({ lineItemId: line.lineItemId, quantity: line.quantity ?? 1 }));
  if (!lineItems.length) throw new Error("eBay order has no shippable line items");
  await ebayRequest(`/sell/fulfillment/v1/order/${encodeURIComponent(externalOrderId)}/shipping_fulfillment`, {
    method: "POST",
    body: JSON.stringify({ lineItemsByShippingFulfillment: lineItems, shippingCarrierCode: carrier, trackingNumber }),
  });
};

const reconcile = async (): Promise<void> => {
  const settings = await requireEnabledChannel("ebay_de", "stock");
  const listings = await query(
    `SELECT listing.sku,
            available_inventory(inventory.on_hand, inventory.reserved, inventory.safety_buffer) AS quantity,
            product.price
       FROM marketplace_listings listing
       JOIN inventory_skus inventory ON inventory.sku = listing.sku AND inventory.location = 'local' AND inventory.is_active = true
       JOIN products product ON product.id = inventory.product_id
      WHERE listing.marketplace = 'ebay_de' AND listing.approved_at IS NOT NULL
        AND listing.sync_stock = true`,
  );
  for (const row of listings.rows) {
    await updateAvailability(String(row.sku), Number(row.quantity));
    if (settings.priceSyncEnabled) await updatePrice(String(row.sku), Number(row.price));
  }
};

export const ebayAdapter = (validate: MarketplaceAdapter["validate"]): MarketplaceAdapter => ({
  validate,
  publish,
  unpublish,
  updatePrice,
  updateAvailability,
  importOrders,
  confirmShipment,
  reconcile,
});
