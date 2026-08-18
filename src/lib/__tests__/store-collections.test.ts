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
});
