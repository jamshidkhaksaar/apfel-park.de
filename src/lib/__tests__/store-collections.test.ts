import { describe, expect, it } from "vitest";

import { getStoreCollectionCopy, storeCollectionIds } from "@/lib/store-collections";

describe("store collections", () => {
  it("includes the national ecommerce landing pages", () => {
    expect(storeCollectionIds).toEqual(expect.arrayContaining([
      "iphone-16-pro-max",
      "samsung-phones",
      "phones-without-contract",
    ]));
  });

  it.each([
    ["iphone-17", "/iphone-17"],
    ["iphone-16-pro-max", "/iphone-16-pro-max"],
    ["samsung-phones", "/samsung-handys"],
    ["phones-without-contract", "/handys-ohne-vertrag"],
  ] as const)("%s has localized, search-safe metadata", (id, path) => {
    for (const locale of ["de", "en"] as const) {
      const copy = getStoreCollectionCopy(id, locale);
      expect(copy.path).toBe(path);
      expect(copy.metaTitle.length).toBeLessThanOrEqual(47);
      expect(copy.description.length).toBeLessThanOrEqual(155);
      expect(copy.intro.length).toBeGreaterThanOrEqual(2);
      expect(copy.faq.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("matches English iPhone collection snippets to Germany purchase intent", () => {
    const iphone17 = getStoreCollectionCopy("iphone-17", "en");
    const iphone16ProMax = getStoreCollectionCopy("iphone-16-pro-max", "en");

    expect(iphone17.metaTitle).toContain("in Germany");
    expect(iphone17.metaTitle).toContain("Prices");
    expect(iphone17.description).toContain("delivery across Germany");
    expect(iphone16ProMax.metaTitle).toContain("in Germany");
    expect(iphone16ProMax.metaTitle).toContain("Prices");
  });
});
