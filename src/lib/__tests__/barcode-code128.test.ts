import { BitArray, Code128Reader } from "@zxing/library";
import { describe, expect, it } from "vitest";

import { code128Width, encodeCode128B } from "../barcode-code128";

/** Lays the bars into a row with quiet zones and decodes it with zxing. */
const decode = (value: string): string => {
  const widths = encodeCode128B(value);
  const quiet = 12;
  const row = new BitArray(code128Width(widths) + quiet * 2);
  let x = quiet;
  widths.forEach((width, index) => {
    if (index % 2 === 0) for (let k = 0; k < width; k += 1) row.set(x + k);
    x += width;
  });
  return new Code128Reader().decodeRow(0, row, new Map()).getText();
};

describe("Code 128 labels", () => {
  it.each(["AP-APP-00035", "AP-69ed2b60-5359-471d-879f-bd6b657309bd", "S25U-256-BLK", "a b/c.1"])(
    "round-trips %s through a real decoder",
    (sku) => {
      expect(decode(sku)).toBe(sku);
    },
  );

  it("rejects characters a scanner could not reproduce", () => {
    expect(() => encodeCode128B("Grün")).toThrow();
    expect(() => encodeCode128B("")).toThrow();
  });
});
