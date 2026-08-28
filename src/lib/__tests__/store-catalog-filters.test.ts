import { describe, expect, it } from "vitest";

import type { Product } from "../products";
import { normalizeCatalogSearchText, normalizeProductBrand, parseStoreCatalogFilters, searchCatalogProducts } from "../products";

describe("store catalog filters", () => {
  it("parses customer-facing filters and ignores the retired model parameter", () => {
    const filters = parseStoreCatalogFilters({
      q: "  iPhone 17  ",
      brand: "apple,samsung",
      model: "AG01-01,BH01-01",
      storage: "128GB,256GB",
      condition: "new,used,invalid",
      atype: "cases,cables,invalid",
      stock: "available",
      pmin: "100",
      pmax: "900",
    });

    expect(filters).toEqual({
      query: "iPhone 17",
      brands: ["apple", "samsung"],
      storages: ["128GB", "256GB"],
      conditions: ["new", "used"],
      accessoryTypes: ["cases", "cables"],
      inStockOnly: true,
      priceMin: 100,
      priceMax: 900,
    });
    expect(filters).not.toHaveProperty("models");
  });

  it("normalizes unsafe and reversed price ranges", () => {
    expect(parseStoreCatalogFilters({ pmin: "900", pmax: "100" })).toMatchObject({
      priceMin: 100,
      priceMax: 900,
    });
    expect(parseStoreCatalogFilters({ pmin: "-40", pmax: "not-a-number" })).toMatchObject({
      priceMin: 0,
      priceMax: undefined,
    });
  });

  it("only enables availability for the supported URL value", () => {
    expect(parseStoreCatalogFilters({ stock: "available" }).inStockOnly).toBe(true);
    expect(parseStoreCatalogFilters({ stock: "all" }).inStockOnly).toBe(false);
  });
});

describe("store catalog search", () => {
  const product = (overrides: Partial<Product>): Product => ({
    id: "1",
    title: "Apple iPhone 17 Pro Max",
    subtitle: "256 GB Tiefblau",
    description: "",
    price: 1299,
    category: "smartphones",
    condition: "new",
    isOpenBox: false,
    hasRealProductPhotos: true,
    image: "/iphone.webp",
    images: ["/iphone.webp"],
    identifierStatus: "assigned",
    stock: 2,
    slug: "iphone-17-pro-max",
    featureBullets: ["A19 Pro Chip"],
    specs: [{ label: "Display", value: "6,9 Zoll" }],
    faq: [],
    variants: [{ color: "Tiefblau", storage: "256 GB", stock: 2 }],
    hasDiscount: false,
    ...overrides,
  });

  it("normalizes German characters and punctuation", () => {
    expect(normalizeCatalogSearchText("  Hülle für Weiß  ")).toBe("hulle fur weiss");
  });

  it("matches title, specs, features and variant data", () => {
    const candidate = product({});
    expect(searchCatalogProducts([candidate], "iphone 17 tiefblau")).toEqual([candidate]);
    expect(searchCatalogProducts([candidate], "a19 pro")).toEqual([candidate]);
    expect(searchCatalogProducts([candidate], "pixel 10")).toEqual([]);
  });

  it("places in-stock matches before unavailable matches", () => {
    const unavailable = product({ id: "2", stock: 0, title: "iPhone 17 Standard" });
    const available = product({ id: "3", stock: 1, title: "iPhone 17 Air" });
    expect(searchCatalogProducts([unavailable, available], "iphone 17").map((item) => item.id)).toEqual(["3", "2"]);
  });

  it("prioritizes devices unless the query explicitly asks for an accessory", () => {
    const device = product({ id: "phone", title: "Apple iPhone 17 Pro" });
    const caseProduct = product({ id: "case", title: "Guess iPhone 17 Pro MagSafe Hülle", category: "accessories" });
    expect(searchCatalogProducts([caseProduct, device], "iphone 17 pro")[0].id).toBe("phone");
    expect(searchCatalogProducts([device, caseProduct], "iphone 17 pro hülle")[0].id).toBe("case");
  });
});

describe("storefront brand labels", () => {
  it.each([
    ["Apple iPhone", "Apple"],
    ["samsung electronics", "Samsung"],
    ["redmi", "Xiaomi"],
    ["bmw m", "BMW M"],
    ["ccit", "CCIT"],
    ["trusmi", "TRUSMI"],
  ])("normalizes %s as %s", (input, expected) => {
    expect(normalizeProductBrand(input)).toBe(expected);
  });
});
