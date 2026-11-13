import { describe, expect, it } from "vitest";

import { MIN_INDEXABLE_CATEGORY_SKUS, isCategoryIndexable } from "@/lib/category-indexing";

describe("thin category indexing", () => {
  it("keeps categories below three active SKUs out of the index", () => {
    expect(isCategoryIndexable(0)).toBe(false);
    expect(isCategoryIndexable(1)).toBe(false);
    expect(isCategoryIndexable(2)).toBe(false);
  });

  it("indexes again automatically from three active SKUs on", () => {
    expect(MIN_INDEXABLE_CATEGORY_SKUS).toBe(3);
    expect(isCategoryIndexable(3)).toBe(true);
    expect(isCategoryIndexable(240)).toBe(true);
  });

  it("indexes the curated laptops and parts landing pages from their first SKU", () => {
    expect(isCategoryIndexable(1, "laptops")).toBe(true);
    expect(isCategoryIndexable(1, "parts")).toBe(true);
    expect(isCategoryIndexable(0, "laptops")).toBe(false);
    expect(isCategoryIndexable(0, "parts")).toBe(false);
  });

  it("treats a broken count as thin instead of indexing on garbage", () => {
    expect(isCategoryIndexable(Number.NaN)).toBe(false);
    expect(isCategoryIndexable(Number.POSITIVE_INFINITY)).toBe(false);
  });
});
