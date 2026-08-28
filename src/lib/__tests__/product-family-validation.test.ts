import { describe, expect, it } from "vitest";

import { normalizeFamilyOptionValues, validateFamilyConfiguration } from "../product-family-validation";

describe("validateFamilyConfiguration", () => {
  it("rejects an active member missing a configured axis", () => {
    expect(() => validateFamilyConfiguration(["Storage", "Color"], [
      { productId: "p1", optionValues: { Storage: "128 GB" }, isActive: true },
    ])).toThrow("family_axis_value_required");
  });

  it("rejects duplicate active option combinations", () => {
    expect(() => validateFamilyConfiguration(["Storage", "Color"], [
      { productId: "p1", optionValues: { Storage: "128 GB", Color: "Black" }, isActive: true },
      { productId: "p2", optionValues: { Storage: "128 GB", Color: "Black" }, isActive: true },
    ])).toThrow("duplicate_family_combination");
  });

  it("allows unique complete active combinations", () => {
    expect(() => validateFamilyConfiguration(["Storage", "Color"], [
      { productId: "p1", optionValues: { Storage: "128 GB", Color: "Black" }, isActive: true },
      { productId: "p2", optionValues: { Storage: "128 GB", Color: "Blue" }, isActive: true },
    ])).not.toThrow();
  });

  it("persists only configured axes even when junk keys come first", () => {
    const values = Object.fromEntries([...Array.from({ length: 8 }, (_, index) => [`junk${index}`, "x"]), ["Storage", "128 GB"], ["Color", "Black"]]);
    expect(normalizeFamilyOptionValues(["Storage", "Color"], values)).toEqual({ Storage: "128 GB", Color: "Black" });
  });
});
