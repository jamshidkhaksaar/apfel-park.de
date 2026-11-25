import { describe, expect, it } from "vitest";

import { retiredProductTarget } from "../retired-product-redirect";

describe("retired product redirect", () => {
  it("sends a sold model to its model page", () => {
    expect(retiredProductTarget({ title: "Apple iPhone 16 Pro Max 256GB", brand: "Apple", model: "iPhone 16 Pro Max", category: "smartphones", condition: "used" }, "en")).toBe("/en/iphone-16-pro-max");
    expect(retiredProductTarget({ title: "Apple iPhone 17 Pro Max 256GB", brand: "Apple", category: "smartphones", condition: "new" }, "de")).toBe("/de/iphone-17");
  });

  it("falls back to the brand or condition page in the visitor's language", () => {
    expect(retiredProductTarget({ title: "Apple iPhone 12", brand: "Apple", category: "smartphones", condition: "used" }, "en")).toBe("/en/used-iphones");
    expect(retiredProductTarget({ title: "Apple iPhone 12", brand: "Apple", category: "smartphones", condition: "used" }, "de")).toBe("/de/gebrauchte-iphones");
    expect(retiredProductTarget({ title: "Galaxy A55", brand: "Samsung", category: "smartphones", condition: "open_box" }, "en")).toBe("/en/samsung-phones");
    expect(retiredProductTarget({ title: "Redmi Note 13", brand: "Xiaomi", category: "smartphones", condition: "new" }, "de")).toBe("/de/xiaomi-redmi-handys");
  });

  it("falls back to the category for everything else", () => {
    expect(retiredProductTarget({ title: "Apple iPhone 14", brand: "Apple", category: "smartphones", condition: "new" }, "de")).toBe("/de/smartphones");
    expect(retiredProductTarget({ title: "Guess Hülle", brand: "Guess", category: "accessories", condition: "new" }, "en")).toBe("/en/accessories");
    expect(retiredProductTarget({ title: "PS5 Controller", category: "consoles", condition: "new" }, "de")).toBe("/de/gaming");
  });
});
