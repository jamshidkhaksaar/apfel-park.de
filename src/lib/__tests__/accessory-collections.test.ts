import { describe, expect, it } from "vitest";

import {
  accessoryCollectionSlugForSubcategory,
  accessoryCollectionSlugs,
  getAccessoryCollection,
} from "../accessory-collections";
import { ACCESSORY_SUBCATEGORIES } from "../product-subcategory";

describe("accessory collections", () => {
  it("exposes a slug per landing page and they are unique", () => {
    expect(accessoryCollectionSlugs.length).toBeGreaterThan(0);
    expect(new Set(accessoryCollectionSlugs).size).toBe(accessoryCollectionSlugs.length);
  });

  it("maps every slug to a subcategory the classifier actually produces", () => {
    for (const slug of accessoryCollectionSlugs) {
      const copy = getAccessoryCollection(slug, "de");
      expect(copy, slug).not.toBeNull();
      expect(ACCESSORY_SUBCATEGORIES as readonly string[]).toContain(copy!.subcategory);
    }
  });

  it("returns copy in both locales with the required fields", () => {
    for (const slug of accessoryCollectionSlugs) {
      for (const locale of ["de", "en"] as const) {
        const copy = getAccessoryCollection(slug, locale)!;
        expect(copy.title).toBeTruthy();
        expect(copy.metaTitle).toBeTruthy();
        expect(copy.description.length).toBeGreaterThan(50);
        expect(copy.intro.length).toBeGreaterThan(0);
        expect(copy.faq.length).toBeGreaterThanOrEqual(3);
        for (const entry of copy.faq) {
          expect(entry.question).toBeTruthy();
          expect(entry.answer).toBeTruthy();
        }
      }
    }
  });

  it("returns null for an unknown slug so the route can 404", () => {
    expect(getAccessoryCollection("does-not-exist", "de")).toBeNull();
  });

  it("resolves a subcategory back to its landing slug", () => {
    expect(accessoryCollectionSlugForSubcategory("cases-hard")).toBe("hardcases");
    expect(accessoryCollectionSlugForSubcategory("screen-protection")).toBe("displayschutz");
    // Not every subcategory earns a landing page.
    expect(accessoryCollectionSlugForSubcategory("other")).toBeNull();
  });
});
