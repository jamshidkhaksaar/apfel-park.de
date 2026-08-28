import { describe, expect, it } from "vitest";

import { getFamilyOptionTarget, resolveBundleCartSelection, sanitizeProductExperienceProfile } from "../product-experience";

describe("sanitizeProductExperienceProfile", () => {
  it("fails closed with every storefront section disabled", () => {
    const profile = sanitizeProductExperienceProfile({});
    expect(Object.values(profile.enabledSections).every((enabled) => enabled === false)).toBe(true);
    expect(profile.packageContents).toEqual([]);
    expect(profile.conditionGuide).toEqual([]);
    expect(profile.bundleProductIds).toEqual([]);
  });

  it("keeps localized configured evidence while dropping unsafe or invalid values", () => {
    const profile = sanitizeProductExperienceProfile({
      enabledSections: { packageContents: true, conditionGuide: true, sizeComparison: true },
      packageContents: [
        { label: { de: "USB-C Kabel", en: "USB-C cable" }, included: true },
        { label: { de: "", en: "" }, included: true },
      ],
      conditionGuide: [
        { condition: "open_box", label: { de: "Open-Box", en: "Open box" }, description: { de: "Geöffnet.", en: "Opened." }, imageUrls: ["/uploads/conditions/open-box.webp", "javascript:alert(1)"] },
      ],
      dimensions: { heightMm: 146.6, widthMm: 70.6, depthMm: -4, weightG: 187, screenInches: 6.1 },
      comparisonProductIds: ["11111111-1111-4111-8111-111111111111", "bad"],
      bundleProductIds: ["22222222-2222-4222-8222-222222222222"],
    });

    expect(profile.packageContents).toHaveLength(1);
    expect(profile.conditionGuide[0].imageUrls).toEqual(["/uploads/conditions/open-box.webp"]);
    expect(profile.dimensions.depthMm).toBeUndefined();
    expect(profile.dimensions.heightMm).toBe(146.6);
    expect(profile.comparisonProductIds).toEqual(["11111111-1111-4111-8111-111111111111"]);
  });
});

describe("getFamilyOptionTarget", () => {
  it("preserves every other selected axis and disables missing combinations", () => {
    const base = { image: "", price: 1, stock: 1 };
    const family = { id: "f", name: "Phone", slug: "phone", optionAxes: ["Storage", "Color"], members: [
      { ...base, productId: "a", slug: "a", title: "A", optionValues: { Storage: "128", Color: "Black" }, selected: true },
      { ...base, productId: "b", slug: "b", title: "B", optionValues: { Storage: "128", Color: "Blue" }, selected: false },
      { ...base, productId: "c", slug: "c", title: "C", optionValues: { Storage: "256", Color: "Blue" }, selected: false },
    ] };
    expect(getFamilyOptionTarget(family, "Color", "Blue")?.productId).toBe("b");
    expect(getFamilyOptionTarget(family, "Storage", "256")).toBeNull();
  });
});

describe("resolveBundleCartSelection", () => {
  it("adds only products with no variants or one unambiguous variant", () => {
    expect(resolveBundleCartSelection([])).toEqual({ requiresVariantSelection: false, variantColor: null, variantStorage: null });
    expect(resolveBundleCartSelection([{ color: "Black", storage: "128 GB", stock: 1, isActive: true }])).toEqual({ requiresVariantSelection: false, variantColor: "Black", variantStorage: "128 GB" });
    expect(resolveBundleCartSelection([{ color: "Black", storage: "128 GB", stock: 0, isActive: true }]).requiresVariantSelection).toBe(true);
    expect(resolveBundleCartSelection([{ color: "Black", storage: "128 GB", stock: 1, isActive: false }]).requiresVariantSelection).toBe(true);
    expect(resolveBundleCartSelection([{ color: "Black", storage: "128 GB" }]).requiresVariantSelection).toBe(true);
    expect(resolveBundleCartSelection([{ color: "Black", storage: "128 GB" }, { color: "Blue", storage: "256 GB" }]).requiresVariantSelection).toBe(true);
  });
});
