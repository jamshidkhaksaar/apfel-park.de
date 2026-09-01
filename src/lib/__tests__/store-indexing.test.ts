import { describe, expect, it } from "vitest";

import {
  buildStoreCanonicalUrl,
  isStorePaginationOutOfRange,
  resolveStoreIndexing,
} from "@/lib/store-indexing";

describe("store URL indexing policy", () => {
  it("keeps the base page indexable", () => {
    expect(resolveStoreIndexing({})).toEqual({ page: 1, noindex: false, canonicalQuery: undefined });
  });

  it("gives clean pagination a self-canonical", () => {
    expect(resolveStoreIndexing({ page: "2" })).toEqual({
      page: 2,
      noindex: false,
      canonicalQuery: "page=2",
    });
  });

  it("keeps clean pagination in the canonical for presentation URLs", () => {
    const indexing = resolveStoreIndexing({ page: "2", view: "list" });

    expect(indexing).toEqual({
      page: 2,
      noindex: true,
      canonicalQuery: "page=2",
    });
    expect(buildStoreCanonicalUrl("https://apfel-park.de/de/smartphones", indexing))
      .toBe("https://apfel-park.de/de/smartphones?page=2");
  });

  it("ignores empty presentation parameters", () => {
    expect(resolveStoreIndexing({ page: "2", view: "", q: ["", ""] })).toEqual({
      page: 2,
      noindex: false,
      canonicalQuery: "page=2",
    });
  });

  it("noindexes search, filters, sort, view, and malformed pagination", () => {
    for (const query of [
      { q: "iphone" },
      { brand: "apple" },
      { sort: "price-asc" },
      { view: "list" },
      { page: "not-a-page" },
      { page: "0" },
      { page: ["2", "3"] },
      { page: "2", stock: "available" },
    ]) {
      expect(resolveStoreIndexing(query).noindex).toBe(true);
    }
  });

  it("renders malformed pagination as page one without a query canonical", () => {
    expect(resolveStoreIndexing({ page: "2junk" })).toEqual({
      page: 1,
      noindex: true,
      canonicalQuery: undefined,
    });
  });

  it("rejects only requested pages beyond the catalog range", () => {
    expect(isStorePaginationOutOfRange(2, 2)).toBe(false);
    expect(isStorePaginationOutOfRange(3, 2)).toBe(true);
  });

  it("keeps filters and empty base collections valid on page one", () => {
    const filtered = resolveStoreIndexing({ brand: "Apple" });

    expect(filtered.page).toBe(1);
    expect(filtered.noindex).toBe(true);
    expect(isStorePaginationOutOfRange(filtered.page, 1)).toBe(false);
    expect(isStorePaginationOutOfRange(resolveStoreIndexing({}).page, 1)).toBe(false);
  });
});
