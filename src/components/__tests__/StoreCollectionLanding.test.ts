import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getStoreCatalog: vi.fn(),
  notFound: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  notFound: mocks.notFound,
}));

vi.mock("@/lib/products", () => ({
  getStoreCatalog: mocks.getStoreCatalog,
  parseStoreCatalogFilters: vi.fn(() => ({
    query: "",
    brands: [],
    storages: [],
    conditions: [],
    accessoryTypes: [],
    inStockOnly: false,
  })),
  parseStoreSort: vi.fn(() => "featured"),
}));

import StoreCollectionLanding from "@/components/store/StoreCollectionLanding";

const catalogResult = (pages: number, page: number, total = pages * 24) => ({
  products: [],
  total,
  page,
  pages,
  counts: {},
  facets: {},
});

describe("StoreCollectionLanding pagination", () => {
  beforeEach(() => {
    mocks.getStoreCatalog.mockReset();
    mocks.notFound.mockReset();
    mocks.notFound.mockImplementation(() => {
      throw new Error("NEXT_NOT_FOUND");
    });
  });

  it("throws Next's not-found response when the requested page is out of range", async () => {
    mocks.getStoreCatalog.mockResolvedValue(catalogResult(2, 2));

    await expect(StoreCollectionLanding({
      collection: "iphone-17",
      locale: "de",
      query: { page: "3" },
    })).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mocks.notFound).toHaveBeenCalledOnce();
  });

  it("keeps a valid second page renderable", async () => {
    mocks.getStoreCatalog.mockResolvedValue(catalogResult(2, 2));

    await expect(StoreCollectionLanding({
      collection: "iphone-17",
      locale: "de",
      query: { page: "2" },
    })).resolves.toBeTruthy();
    expect(mocks.notFound).not.toHaveBeenCalled();
  });

  it("keeps empty base collections renderable", async () => {
    mocks.getStoreCatalog.mockResolvedValue(catalogResult(1, 1, 0));

    await expect(StoreCollectionLanding({
      collection: "iphone-17",
      locale: "de",
      query: { brand: "Apple" },
    })).resolves.toBeTruthy();
    expect(mocks.notFound).not.toHaveBeenCalled();
  });
});
