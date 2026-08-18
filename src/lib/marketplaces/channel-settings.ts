import { query } from "@/lib/db";

export type SalesChannel = "google_merchant" | "ebay_de" | "amazon_de";

export type ChannelSettings = {
  marketplace: SalesChannel;
  enabled: boolean;
  stockSyncEnabled: boolean;
  priceSyncEnabled: boolean;
  orderSyncEnabled: boolean;
  priceMarkupPercent: number;
  priceMarkupFixed: number;
  priceRuleConfirmedAt: string | null;
};

export const getChannelSettings = async (marketplace: SalesChannel): Promise<ChannelSettings> => {
  const result = await query(
    `SELECT marketplace, enabled, stock_sync_enabled, price_sync_enabled, order_sync_enabled,
            price_markup_percent, price_markup_fixed, price_rule_confirmed_at
       FROM marketplace_channel_settings
      WHERE marketplace = $1`,
    [marketplace],
  );
  const row = result.rows[0];
  if (!row) throw new Error(`Channel settings are missing for ${marketplace}`);
  return {
    marketplace,
    enabled: Boolean(row.enabled),
    stockSyncEnabled: Boolean(row.stock_sync_enabled),
    priceSyncEnabled: Boolean(row.price_sync_enabled),
    orderSyncEnabled: Boolean(row.order_sync_enabled),
    priceMarkupPercent: Number(row.price_markup_percent ?? 0),
    priceMarkupFixed: Number(row.price_markup_fixed ?? 0),
    priceRuleConfirmedAt: row.price_rule_confirmed_at ? new Date(row.price_rule_confirmed_at).toISOString() : null,
  };
};

export const channelPrice = (basePrice: number, settings: ChannelSettings): number => {
  if (!Number.isFinite(basePrice) || basePrice <= 0) throw new Error("A positive website base price is required");
  if (!settings.priceRuleConfirmedAt) {
    throw new Error(`${settings.marketplace} price rule has not been confirmed by the owner`);
  }
  const price = basePrice * (1 + settings.priceMarkupPercent / 100) + settings.priceMarkupFixed;
  return Math.max(0.01, Math.round((price + Number.EPSILON) * 100) / 100);
};

export const requireEnabledChannel = async (
  marketplace: SalesChannel,
  capability: "stock" | "price" | "orders" | "publish",
): Promise<ChannelSettings> => {
  const settings = await getChannelSettings(marketplace);
  const capabilityEnabled =
    capability === "publish"
      ? settings.enabled && settings.priceRuleConfirmedAt !== null
      : settings.enabled && (
        capability === "stock" ? settings.stockSyncEnabled
          : capability === "price" ? settings.priceSyncEnabled
            : settings.orderSyncEnabled
      );
  if (!capabilityEnabled) throw new Error(`${marketplace} ${capability} synchronization is disabled`);
  return settings;
};
