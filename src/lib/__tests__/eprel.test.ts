import { describe, expect, it } from "vitest";

import { EPREL_PRODUCT_GROUP, eprelCycles, eprelEndurance, eprelProductUrl } from "@/lib/eprel";

describe("eprelProductUrl", () => {
  it("uses the versioned product group", () => {
    // The unversioned "smartphonestablets2023" returns 404 -- every product page
    // linked there until this constant existed.
    expect(EPREL_PRODUCT_GROUP).toBe("smartphonestablets20231669");
    expect(eprelProductUrl("2402623")).toBe(
      "https://eprel.ec.europa.eu/screen/product/smartphonestablets20231669/2402623",
    );
  });
});

describe("eprelCycles", () => {
  it("converts the register's hundreds into the number printed on the label", () => {
    // EPREL returns 10 for the iPhone 17; its official label reads 1000.
    expect(eprelCycles(10)).toBe(1000);
    // 8 is the 800-cycle regulatory minimum and the register's commonest value.
    expect(eprelCycles(8)).toBe(800);
  });

  it("returns nothing rather than a misleading zero", () => {
    expect(eprelCycles(0)).toBeUndefined();
    expect(eprelCycles(null)).toBeUndefined();
    expect(eprelCycles(undefined)).toBeUndefined();
  });
});

describe("eprelEndurance", () => {
  it("formats minutes the way the official label does", () => {
    expect(eprelEndurance(2460)).toBe("41 h 0 min");
    expect(eprelEndurance(2465)).toBe("41 h 5 min");
  });

  it("ignores absent or nonsensical values", () => {
    expect(eprelEndurance(0)).toBeUndefined();
    expect(eprelEndurance(null)).toBeUndefined();
  });
});
