import { beforeEach, describe, expect, it, vi } from "vitest";
import { Children, isValidElement, type ReactElement, type ReactNode } from "react";

const mocks = vi.hoisted(() => ({
  getStoreCatalog: vi.fn(),
  notFound: vi.fn(),
  DeviceQuoteForm: vi.fn(() => null),
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

vi.mock("@/components/DeviceQuoteForm", () => ({
  default: mocks.DeviceQuoteForm,
}));

import StoreCollectionLanding, { getDeviceQuoteBrand } from "@/components/store/StoreCollectionLanding";

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

describe("StoreCollectionLanding device quote placement", () => {
  it("offers quote requests on brand hubs only", () => {
    expect(getDeviceQuoteBrand("samsung-phones")).toBe("Samsung");
    expect(getDeviceQuoteBrand("xiaomi-redmi-phones")).toBe("Xiaomi / Redmi / Poco");
    expect(getDeviceQuoteBrand("iphone-17")).toBeNull();
    expect(getDeviceQuoteBrand("used-phones")).toBeNull();
  });

  it("keeps the stocked catalog before the request-only form on a brand hub", async () => {
    mocks.getStoreCatalog.mockResolvedValue(catalogResult(1, 1, 2));

    const landing = await StoreCollectionLanding({
      collection: "samsung-phones",
      locale: "de",
      query: {},
    }) as ReactElement<{ children: ReactNode }>;
    const children = Children.toArray(landing.props.children);
    const catalogIndex = children.findIndex((child) =>
      isValidElement<{ id?: string }>(child) && child.props.id === "angebote");
    const quoteIndex = children.findIndex((child) =>
      isValidElement(child) && child.type === mocks.DeviceQuoteForm);

    expect(catalogIndex).toBeGreaterThan(-1);
    expect(quoteIndex).toBeGreaterThan(catalogIndex);
    expect(
      isValidElement<{ initialBrand?: string }>(children[quoteIndex]) && children[quoteIndex].props.initialBrand,
    ).toBe("Samsung");
  });
});
