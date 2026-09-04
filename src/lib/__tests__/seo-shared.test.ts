import { describe, expect, it } from "vitest";

import { seoRouteDefinitions, splitKeywords } from "@/lib/seo-shared";
import { getStoreCollectionCopy } from "@/lib/store-collections";

describe("splitKeywords", () => {
  it("splits, trims and drops empties", () => {
    expect(splitKeywords("a, b ,  c ")).toEqual(["a", "b", "c"]);
    expect(splitKeywords("a,,b,")).toEqual(["a", "b"]);
  });

  it("returns [] for empty input", () => {
    expect(splitKeywords("")).toEqual([]);
    expect(splitKeywords("  ")).toEqual([]);
  });

  // The original 500: defaultKeywords[locale] was undefined for an unknown
  // locale and splitKeywords called .split() straight on it.
  it("tolerates undefined and null instead of throwing", () => {
    expect(splitKeywords(undefined)).toEqual([]);
    expect(splitKeywords(null)).toEqual([]);
  });

  it("registers the national ecommerce routes for sitemap and admin SEO settings", () => {
    const paths = new Set(seoRouteDefinitions.map((route) => route.path));
    expect(paths).toContain("/iphone-16-pro-max");
    expect(paths).toContain("/samsung-handys");
    expect(paths).toContain("/xiaomi-redmi-handys");
    expect(paths).toContain("/handys-ohne-vertrag");
    expect(paths).toContain("/handy-shop-hamburg-wilhelmsburg");
    expect(paths.size).toBe(seoRouteDefinitions.length);
  });

  it("keeps registered iPhone and local-shop defaults aligned with search intent", () => {
    const iphone17 = seoRouteDefinitions.find((route) => route.path === "/iphone-17");
    const iphone16ProMax = seoRouteDefinitions.find((route) => route.path === "/iphone-16-pro-max");
    const localShop = seoRouteDefinitions.find((route) => route.path === "/handy-shop-hamburg-wilhelmsburg");

    expect(iphone17?.defaultTitle.en).toContain("in Germany");
    expect(iphone16ProMax?.defaultTitle.en).toContain("in Germany");
    expect(localShop?.defaultTitle.de).not.toMatch(/Apfel Park/i);
    expect(localShop?.defaultTitle.de.length).toBeLessThanOrEqual(47);
  });

  it("keeps Xiaomi and Redmi route metadata synchronized with the collection", () => {
    const route = seoRouteDefinitions.find((entry) => entry.path === "/xiaomi-redmi-handys");

    for (const locale of ["de", "en"] as const) {
      const copy = getStoreCollectionCopy("xiaomi-redmi-phones", locale);
      expect(route?.defaultTitle[locale]).toBe(copy.metaTitle);
      expect(route?.defaultDescription[locale]).toBe(copy.description);
    }
  });
});
