import { describe, expect, it } from "vitest";

import { resolveStoreIndexing } from "@/lib/store-indexing";

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

  it("noindexes search, filters, sort, view, and malformed pagination", () => {
    for (const query of [
      { q: "iphone" },
      { brand: "apple" },
      { sort: "price-asc" },
      { view: "list" },
      { page: "not-a-page" },
      { page: "0" },
      { page: "2", stock: "available" },
    ]) {
      expect(resolveStoreIndexing(query).noindex).toBe(true);
    }
  });
});
