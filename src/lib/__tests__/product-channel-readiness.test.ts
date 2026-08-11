import { describe, expect, it } from "vitest";

import { evaluateProductChannelReadiness, type ProductChannelFacts } from "../product-channel-readiness";

const complete: ProductChannelFacts = {
  title: "Apple iPhone 17 256 GB Schwarz",
  description: "Originalverpacktes Apple Smartphone.",
  category: "smartphones",
  condition: "new",
  brand: "Apple",
  price: 999,
  stock: 2,
  sku: "AP-IP17-256-BLK",
  gtin: "4006381333931",
  identifierStatus: "assigned",
  images: ["/1.webp", "/2.webp", "/3.webp", "/4.webp"],
  manufacturer: { name: "Apple", address: "Hollyhill, Cork, Ireland", email: "contactus.de@euro.apple.com" },
  euResponsiblePerson: { name: "Apple Distribution International", address: "Hollyhill, Cork, Ireland", email: "contactus.de@euro.apple.com" },
  safetyWarnings: ["Contains a lithium-ion battery."],
  countryOfOrigin: "CN",
  packageWeightKg: 0.5,
  packageLengthCm: 18,
  packageWidthCm: 10,
  packageHeightCm: 4,
  batteryDetails: {
    included: true,
    cellComposition: "lithium_ion",
    count: 1,
    wattHours: 14,
    unNumber: "UN3481",
  },
  marketplaceCategoryMappings: {
    ebay_de: { categoryId: "9355", categoryName: "Handys & Smartphones", requiredAspects: ["Marke"] },
    amazon_de: { productType: "CELLULAR_PHONE" },
  },
  marketplaceAttributes: { ebay_de: { Marke: ["Apple"] } },
};

describe("evaluateProductChannelReadiness", () => {
  it("marks an evidence-complete new product ready for all channels", () => {
    const result = evaluateProductChannelReadiness(complete);
    expect(result.store.ready).toBe(true);
    expect(result.google.ready).toBe(true);
    expect(result.ebay.ready).toBe(true);
    expect(result.amazon.ready).toBe(true);
  });

  it("requires identifiers independently for every variant", () => {
    const result = evaluateProductChannelReadiness({
      ...complete,
      sku: "",
      gtin: "",
      variants: [
        { color: "Schwarz", storage: "128 GB", sku: "BLACK-128", gtin: "4006381333931", identifierStatus: "assigned" },
        { color: "Blau", storage: "256 GB", sku: "BLUE-256", identifierStatus: "unknown" },
      ],
    });
    expect(result.google.ready).toBe(false);
    expect(result.google.errors).toContain("Variant “Blau 256 GB”: confirm whether manufacturer identifiers exist.");
  });

  it("accepts an explicit no-identifier decision for Google without asserting a GTIN", () => {
    const result = evaluateProductChannelReadiness({
      ...complete,
      gtin: "",
      mpn: "",
      identifierStatus: "not_applicable",
    });
    expect(result.google.ready).toBe(true);
  });

  it("blocks non-new Amazon listings until Renewed approval is recorded", () => {
    const result = evaluateProductChannelReadiness({
      ...complete,
      condition: "used",
      conditionNote: "Very good condition",
      hasRealProductPhotos: true,
    });
    expect(result.amazon.ready).toBe(false);
    expect(result.amazon.errors).toContain(
      "Amazon publication remains blocked until Amazon Renewed approval is documented.",
    );
  });
});
