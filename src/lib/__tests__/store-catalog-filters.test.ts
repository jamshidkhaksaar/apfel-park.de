import { describe, expect, it } from "vitest";

import { normalizeProductBrand, parseStoreCatalogFilters } from "../products";

describe("store catalog filters", () => {
  it("parses customer-facing filters and ignores the retired model parameter", () => {
    const filters = parseStoreCatalogFilters({
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
