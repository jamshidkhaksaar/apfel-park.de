import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import RepairPriceTable from "../RepairPriceTable";
import type { RepairCatalog } from "@/lib/repair-catalog";

const catalog: RepairCatalog = {
  brands: [
    {
      id: "apple",
      name: "Apple",
      icon: "apple",
      families: [
        {
          id: "iphone",
          name: "iPhone",
          models: [
            {
              id: "iphone-16-pro-max",
              name: "iPhone 16 Pro Max",
              price: null,
              parts: [
                {
                  id: "display",
                  name: "Display",
                  variants: [
                    { id: "original", label: "Display repair (original)", quality: "genuine", price: 314.1 },
                    { id: "premium", label: "Display repair (Soft OLED 120HZ)", quality: "premium", price: 179.1 },
                    { id: "standard", label: "Display repair (LCD)", quality: "standard", price: 125.1 },
                  ],
                },
                {
                  id: "battery",
                  name: "Battery",
                  variants: [
                    { id: "battery-original", label: "Battery replacement (original)", quality: "genuine", price: 139.9 },
                    { id: "battery-oem", label: "Battery replacement (OEM)", quality: "premium", price: 71.1 },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

describe("RepairPriceTable", () => {
  it("renders crawlable Original, Premium and Standard model prices", () => {
    const html = renderToStaticMarkup(React.createElement(RepairPriceTable, { lang: "de", catalog }));
    expect(html).toContain("iPhone 16 Pro Max");
    expect(html).toContain("Original");
    expect(html).toContain("Premium / Soft OLED");
    expect(html).toContain("Standard / LCD");
    expect(html).toContain("314,10 €");
    expect(html).toContain("179,10 €");
    expect(html).toContain("125,10 €");
    expect(html).toContain("Premium / OEM");
    expect(html).toContain("71,10 €");
  });
});
