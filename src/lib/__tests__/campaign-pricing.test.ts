import { describe, expect, it } from "vitest";

import {
  applyCampaignDiscount,
  campaignDealFor,
  campaignSavingPercent,
  parseCampaignDiscount,
  parseCampaignDiscounts,
  productPriceKey,
} from "../campaign-pricing";

describe("campaign pricing", () => {
  it("applies percent and euro discounts with cent rounding", () => {
    expect(applyCampaignDiscount(899, { type: "percent", value: 15 })).toBe(764.15);
    expect(applyCampaignDiscount(899, { type: "amount", value: 50 })).toBe(849);
    expect(applyCampaignDiscount(19.99, { type: "percent", value: 33 })).toBe(13.39);
  });

  it("sets a fixed Black Friday price and carries the euro cut to variants", () => {
    const deal = { type: "price" as const, value: 749 };
    expect(applyCampaignDiscount(899, deal)).toBe(749);
    expect(applyCampaignDiscount(999, deal, 899)).toBe(849);
    expect(applyCampaignDiscount(899, { type: "price", value: 950 })).toBeNull();
    expect(parseCampaignDiscount({ type: "price", value: "749,90" })).toEqual({ type: "price", value: 749.9 });
  });

  it("never produces a zero or higher price", () => {
    expect(applyCampaignDiscount(40, { type: "amount", value: 40 })).toBeNull();
    expect(applyCampaignDiscount(40, { type: "amount", value: 60 })).toBeNull();
    expect(applyCampaignDiscount(0, { type: "percent", value: 10 })).toBeNull();
  });

  it("validates admin input", () => {
    expect(parseCampaignDiscount({ type: "percent", value: "12,5" })).toEqual({ type: "percent", value: 12.5 });
    expect(parseCampaignDiscount({ type: "percent", value: 95 })).toBeNull();
    expect(parseCampaignDiscount({ type: "percent", value: 0 })).toBeNull();
    expect(parseCampaignDiscount({ type: "amount", value: -5 })).toBeNull();
    expect(parseCampaignDiscount({ type: "fixed", value: 5 })).toBeNull();
    expect(parseCampaignDiscounts({ a: { type: "amount", value: 5 }, b: null }, (id) => id === "a")).toEqual({
      a: { type: "amount", value: 5 },
    });
  });

  it("rounds the advertised saving down", () => {
    expect(campaignSavingPercent(849, 899)).toBe(5); // 5.56 %
    expect(campaignSavingPercent(764.15, 899)).toBe(15);
    expect(campaignSavingPercent(900, 899)).toBe(0);
  });

  it("measures the deal against the 30-day lowest price (PAngV §11)", () => {
    // Regular 899, but it cost 849 two weeks ago: the badge uses 849.
    expect(campaignDealFor(899, 764.15, 849)).toEqual({ percent: 9, referencePrice: 849, regularPrice: 899 });
    // Without history the regular price is the reference.
    expect(campaignDealFor(899, 764.15, undefined)).toEqual({ percent: 15, referencePrice: 899, regularPrice: 899 });
    // A sale price at or above the 30-day low is not advertised as a reduction.
    expect(campaignDealFor(899, 800, 790)).toBeNull();
  });

  it("builds the same variant key as the SQL migration", () => {
    expect(productPriceKey(undefined)).toBe("");
    expect(productPriceKey({ sku: " IP16-128-BLK " })).toBe("IP16-128-BLK");
    expect(productPriceKey({ color: " Schwarz ", storage: "128GB" })).toBe("schwarz|128gb");
  });
});
