import { describe, expect, it } from "vitest";

import { getProductModelCollectionLink } from "@/lib/product-model-collection";

describe("getProductModelCollectionLink", () => {
  it("links iPhone 16 Pro Max products to the permanent model collection", () => {
    expect(getProductModelCollectionLink("Apple iPhone 16 Pro Max 256GB", "smartphones", "en")).toEqual({
      href: "/iphone-16-pro-max",
      label: "All iPhone 16 Pro Max offers",
    });
  });

  it("links every iPhone 17 variant to the iPhone 17 collection", () => {
    expect(getProductModelCollectionLink("Apple iPhone 17 Air 256 GB", "smartphones", "de")).toEqual({
      href: "/iphone-17",
      label: "Alle iPhone-17-Modelle",
    });
  });

  it("does not link an iPhone 17 accessory to the phone collection", () => {
    expect(getProductModelCollectionLink("Case for iPhone 17", "accessories", "en")).toBeNull();
  });

  it("does not link an iPhone 16 Pro Max accessory to the phone collection", () => {
    expect(getProductModelCollectionLink("iPhone 16 Pro Max case", "accessories", "en")).toBeNull();
  });

  it("does not invent a collection link for unrelated products", () => {
    expect(getProductModelCollectionLink("Samsung Galaxy S25", "smartphones", "en")).toBeNull();
  });
});
