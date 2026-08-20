import { describe, expect, it } from "vitest";
import { productMissingData } from "../product-missing-data";

const base = {
  title: "Apple iPhone 17",
  description: "New phone",
  category: "smartphones",
  condition: "new",
  brand: "Apple",
  model: "iPhone 17",
  sku: "AP-IP17",
  price: 999,
  stock: 2,
  images: ["/1.webp", "/2.webp", "/3.webp", "/4.webp"],
  gtin: "4006381333931",
  mpn: "MX123",
};

describe("product-missing-data", () => {
  it("flags missing images, GTIN and MPN", () => {
    const tips = productMissingData({ ...base, images: [], gtin: "", mpn: "" });
    const codes = tips.items.map((item) => item.code);
    expect(codes).toContain("images_none");
    expect(codes).toContain("gtin_missing");
    expect(codes).toContain("mpn_missing");
  });

  it("flags stock zero as out of stock", () => {
    const tips = productMissingData({ ...base, stock: 0 });
    expect(tips.stockZero).toBe(true);
  });

  it("flags condition note and battery for used iPhone", () => {
    const tips = productMissingData({ ...base, condition: "used", conditionNote: "", hasRealProductPhotos: false, batteryHealth: "" });
    const codes = tips.items.map((item) => item.code);
    expect(codes).toContain("condition_note_missing");
    expect(codes).toContain("battery_missing");
    expect(codes).toContain("real_photos_missing");
  });

  it("returns complete when nothing is missing", () => {
    const tips = productMissingData({ ...base });
    expect(tips.items.filter((item) => item.code === "images_none" || item.code === "gtin_missing" || item.code === "mpn_missing")).toHaveLength(0);
  });
});
