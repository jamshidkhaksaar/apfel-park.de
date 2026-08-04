import { describe, expect, it } from "vitest";

import {
  isIphoneProduct,
  validateAdminProductCondition,
  type AdminProductConditionValidationInput,
} from "../admin-product-validation";

// A fully-filled "Gebraucht A+" save — the exact flow that had never once
// succeeded in production before this validator existed.
const usedProduct = (
  overrides: Partial<AdminProductConditionValidationInput> = {},
): AdminProductConditionValidationInput => ({
  condition: "used",
  conditionNote: "Leichte Gebrauchsspuren am Rahmen, Display ohne Kratzer.",
  hasRealProductPhotos: true,
  imageCount: 1,
  batteryHealth: "89",
  title: "iPhone 13 128 GB",
  brand: "Apple",
  model: "iPhone 13",
  locale: "de",
  ...overrides,
});

describe("validateAdminProductCondition", () => {
  it("accepts a fully filled used iPhone", () => {
    expect(validateAdminProductCondition(usedProduct())).toBeNull();
  });

  it("never blocks new products, even with every other field empty", () => {
    const input = usedProduct({
      condition: "new",
      conditionNote: "",
      hasRealProductPhotos: false,
      imageCount: 0,
      batteryHealth: "",
    });
    expect(validateAdminProductCondition(input)).toBeNull();
  });

  it.each([
    ["a missing condition note", { conditionNote: "" }],
    ["a whitespace-only condition note", { conditionNote: "   " }],
    ["unconfirmed real product photos", { hasRealProductPhotos: false }],
    ["no images", { imageCount: 0 }],
  ])("rejects used products with %s", (_label, overrides) => {
    expect(validateAdminProductCondition(usedProduct(overrides))).toMatch(
      /Zustandshinweis/,
    );
  });

  it("applies the same condition rules to open-box products", () => {
    const input = usedProduct({ condition: "open_box", conditionNote: "" });
    expect(validateAdminProductCondition(input)).toMatch(/Zustandshinweis/);
  });

  it("requires battery health for used iPhones", () => {
    expect(validateAdminProductCondition(usedProduct({ batteryHealth: "" }))).toMatch(
      /Batteriekapazität/,
    );
  });

  it("does not require battery health for used non-iPhones", () => {
    const input = usedProduct({
      batteryHealth: "",
      title: "Galaxy S24 Ultra 256 GB",
      brand: "Samsung",
      model: "Galaxy S24 Ultra",
    });
    expect(validateAdminProductCondition(input)).toBeNull();
  });

  it("does not require battery health for open-box iPhones", () => {
    const input = usedProduct({ condition: "open_box", batteryHealth: "" });
    expect(validateAdminProductCondition(input)).toBeNull();
  });

  it.each(["0", "101", "85.5", "abc", "-5"])(
    "rejects the invalid battery health %s",
    (batteryHealth) => {
      expect(validateAdminProductCondition(usedProduct({ batteryHealth }))).toMatch(
        /ganze Zahl/,
      );
    },
  );

  it.each(["1", "100", " 89 "])("accepts the battery health %s", (batteryHealth) => {
    expect(validateAdminProductCondition(usedProduct({ batteryHealth }))).toBeNull();
  });

  it("returns English copy for the English admin locale", () => {
    const input = usedProduct({ conditionNote: "", locale: "en" });
    expect(validateAdminProductCondition(input)).toMatch(/condition note/);
  });
});

describe("isIphoneProduct", () => {
  it.each([
    ["the brand and model", { brand: "Apple", model: "iPhone 13", title: "128 GB" }],
    ["the title alone", { brand: "", model: "", title: "iPhone 15 Pro Max" }],
    ["mixed casing", { brand: "", model: "", title: "IPHONE 12 mini" }],
  ])("detects an iPhone from %s", (_label, product) => {
    expect(isIphoneProduct(product)).toBe(true);
  });

  it("does not match non-Apple phones", () => {
    expect(
      isIphoneProduct({ brand: "Samsung", model: "Galaxy S24", title: "Galaxy S24 256 GB" }),
    ).toBe(false);
  });
});
