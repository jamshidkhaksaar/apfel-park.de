import { describe, expect, it } from "vitest";

import { labelBrandAndModel } from "../label-text";

describe("label brand and model", () => {
  it("moves the brand off a long Samsung name", () => {
    expect(labelBrandAndModel("Samsung Galaxy S24 Ultra 256 GB", "256 GB", "Samsung")).toEqual({ brand: "Samsung", model: "Galaxy S24 Ultra" });
  });

  it("finds the brand in the name when the brand field is empty", () => {
    expect(labelBrandAndModel("Xiaomi Redmi Note 13 Pro 256GB", "256 GB", "")).toEqual({ brand: "Xiaomi", model: "Redmi Note 13 Pro" });
  });

  it("knows iPhones are Apple", () => {
    expect(labelBrandAndModel("iPhone 12 64 GB", "64 GB", "")).toEqual({ brand: "Apple", model: "iPhone 12" });
    expect(labelBrandAndModel("Apple iPhone 15 Pro Max", "256 GB", "APPLE")).toEqual({ brand: "Apple", model: "iPhone 15 Pro Max" });
  });

  it("keeps brand spelling tidy", () => {
    expect(labelBrandAndModel("OnePlus 12", "", "ONEPLUS").brand).toBe("OnePlus");
    expect(labelBrandAndModel("Galaxy A55", "", "SAMSUNG").brand).toBe("Samsung");
  });

  it("never empties the model", () => {
    expect(labelBrandAndModel("Samsung", "", "Samsung").model).toBe("Samsung");
  });
});
