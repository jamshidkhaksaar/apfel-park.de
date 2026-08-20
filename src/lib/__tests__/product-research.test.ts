import { describe, expect, it } from "vitest";
import { sanitizeResearchResult } from "../product-research-core";

describe("sanitizeResearchResult", () => {
  it("strips IMEI, serial and EID values", () => {
    const result = sanitizeResearchResult({ title: "iPhone", description: "IMEI 490154203237518 Serial AB123 EID 89049032000000000000000000000001" });
    expect(result.title).toBe("iPhone");
    expect(result.description).toBeUndefined();
  });

  it("never returns GTIN/MPN as settable fields, only suggestions", () => {
    const result = sanitizeResearchResult({ title: "iPhone 17", gtin: "4006381333931", mpn: "MX123", brand: "Apple" });
    expect((result as Record<string, unknown>).gtin).toBeUndefined();
    expect((result as Record<string, unknown>).mpn).toBeUndefined();
    expect(result.gtinSuggestion).toBe("4006381333931");
    expect(result.mpnSuggestion).toBe("MX123");
  });

  it("accepts a plain research payload", () => {
    const result = sanitizeResearchResult({ title: "iPhone 17 256 GB", brand: "Apple", specs: [{ label: "Display", value: "6.3 inch" }], features: ["Titanium"], gallery: ["https://example.com/1.webp"] });
    expect(result.title).toBe("iPhone 17 256 GB");
    expect(result.specs?.[0].label).toBe("Display");
    expect(result.gallery).toHaveLength(1);
  });
});
