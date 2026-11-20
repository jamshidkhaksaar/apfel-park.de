import { describe, expect, it } from "vitest";

import { looksLikeScan } from "../scan-burst";
import { barcodeValueForSku, labelCodeForSku, labelCodeHash, normalizeScanCode } from "../scan-code";

describe("scanned codes on a German keyboard layout", () => {
  it("matches a SKU whose dashes arrived as ß", () => {
    expect(normalizeScanCode("APßAPPß00035")).toBe(normalizeScanCode("AP-APP-00035"));
  });

  it("matches with Y and Z swapped and in any case", () => {
    expect(normalizeScanCode("GUES-IP15PM-PINK-CCS")).toBe(normalizeScanCode("gues-ip15pm-pink-ccs"));
    expect(normalizeScanCode("AP-XIA-00006")).toBe(normalizeScanCode("AP-XIA-00006"));
    expect(normalizeScanCode("ZUB-YELLOW")).toBe(normalizeScanCode("YUB-ZELLOW"));
  });

  it("keeps different SKUs apart", () => {
    expect(normalizeScanCode("AP-APP-00035")).not.toBe(normalizeScanCode("AP-APP-00036"));
  });
});

describe("label barcode value", () => {
  it("prints short SKUs as they are", () => {
    expect(barcodeValueForSku("AP-APP-00035")).toBe("AP-APP-00035");
    expect(barcodeValueForSku("GUES-IP15PM-PINK-CCS")).toBe("GUES-IP15PM-PINK-CCS");
  });

  it("gives long SKUs a short, stable label code the scan lookup understands", () => {
    const sku = "AP-851bcc93-138f-4ac1-ad86-4a17e6d92c32";
    const code = barcodeValueForSku(sku);
    expect(code).toMatch(/^LB-[0-9A-F]{8}$/);
    expect(code).toBe(labelCodeForSku(sku.toUpperCase()));
    expect(labelCodeHash(code)).toBe(code.slice(3).toLowerCase());
    // ... also when the scanner typed the dash as ß
    expect(labelCodeHash(code.replace("-", "ß"))).toBe(code.slice(3).toLowerCase());
  });

  it("gives SKUs with characters a barcode cannot carry a label code too", () => {
    expect(barcodeValueForSku("Hülle-Grün")).toMatch(/^LB-[0-9A-F]{8}$/);
  });

  it("is not a label code for ordinary SKUs", () => {
    expect(labelCodeHash("AP-APP-00035")).toBeNull();
  });
});

describe("scanner or person", () => {
  const typed = (count: number, gap: number) => Array.from({ length: count }, (_, index) => index * gap);

  it("recognises a scanner burst", () => {
    expect(looksLikeScan(typed(12, 8), 11 * 8 + 10)).toBe(true);
  });

  it("does not take a person typing for a scan", () => {
    expect(looksLikeScan(typed(12, 130), 11 * 130 + 150)).toBe(false);
  });

  it("needs at least four keys and a prompt Enter", () => {
    expect(looksLikeScan(typed(3, 8), 30)).toBe(false);
    expect(looksLikeScan(typed(8, 8), 7 * 8 + 500)).toBe(false);
  });
});
