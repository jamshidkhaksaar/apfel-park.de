import { describe, expect, it } from "vitest";

import { germanyPriceTitle, modelPriceDescription, modelPriceTitle, TITLE_BUDGET, titleEuro } from "../price-title";

describe("price titles", () => {
  it("formats whole euros without cents and keeps real cents", () => {
    expect(titleEuro(1049, "en")).toBe("€1,049");
    expect(titleEuro(246.05, "en")).toBe("€246.05");
    expect(titleEuro(1049, "de")).toMatch(/^1\.049\s€$/);
  });

  it("answers 'price in Germany' in the model page title", () => {
    expect(modelPriceTitle("iPhone 17", 799)).toBe("iPhone 17 Price in Germany – from €799");
    expect(modelPriceTitle("iPhone 16 Pro Max", 899)).toBe("iPhone 16 Pro Max Price in Germany – from €899");
    expect(modelPriceTitle("iPhone 17", 0)).toBeNull();
    expect(modelPriceDescription("iPhone 17", 799).length).toBeLessThanOrEqual(155);
  });

  it("puts the product price in the title and shortens it to fit", () => {
    expect(germanyPriceTitle("iPhone 15 Pro 128 GB A+", 729)).toBe("iPhone 15 Pro 128 GB A+ – €729 in Germany");
    expect(germanyPriceTitle("iPhone 16 Pro Max 256 GB Titanium Desert A+", 1049)).toBe("iPhone 16 Pro Max 256 GB Titanium Desert A+ – €1,049".length <= TITLE_BUDGET ? "iPhone 16 Pro Max 256 GB Titanium Desert A+ – €1,049" : null);
    expect(germanyPriceTitle("iPhone 13", 349, { from: true })).toBe("iPhone 13 – from €349 in Germany");
    for (const title of [germanyPriceTitle("Samsung Galaxy S25 Ultra 256 GB", 836), modelPriceTitle("iPhone 16 Pro Max", 1049)]) {
      expect(title!.length).toBeLessThanOrEqual(TITLE_BUDGET);
    }
  });
});
