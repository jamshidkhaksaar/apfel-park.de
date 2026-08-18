import { describe, expect, it } from "vitest";

import { channelPrice, type ChannelSettings } from "@/lib/marketplaces/channel-settings";

const settings = (overrides: Partial<ChannelSettings> = {}): ChannelSettings => ({
  marketplace: "ebay_de",
  enabled: true,
  stockSyncEnabled: true,
  priceSyncEnabled: true,
  orderSyncEnabled: true,
  priceMarkupPercent: 0,
  priceMarkupFixed: 0,
  priceRuleConfirmedAt: "2026-08-18T00:00:00.000Z",
  ...overrides,
});

describe("marketplace channel pricing", () => {
  it("applies percentage and fixed adjustments to the website base price", () => {
    expect(channelPrice(999, settings({ priceMarkupPercent: 8, priceMarkupFixed: 4.9 }))).toBe(1083.82);
  });

  it("rounds the final channel price to cents", () => {
    expect(channelPrice(19.99, settings({ priceMarkupPercent: 7.5 }))).toBe(21.49);
  });

  it("blocks publication pricing until the owner confirms the rule", () => {
    expect(() => channelPrice(499, settings({ priceRuleConfirmedAt: null }))).toThrow(/confirmed by the owner/i);
  });

  it("rejects a non-positive website base price", () => {
    expect(() => channelPrice(0, settings())).toThrow(/positive website base price/i);
  });
});
