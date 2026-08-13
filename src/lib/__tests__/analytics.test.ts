import { describe, expect, it } from "vitest";

import { analyticsItem, pushGtagCommand, withGa4Items } from "@/lib/analytics";

describe("GA4 command queue", () => {
  it("pushes Arguments objects instead of arrays", () => {
    const dataLayer: unknown[] = [];

    pushGtagCommand(dataLayer, "config", "G-TEST", { send_page_view: false });

    expect(Object.prototype.toString.call(dataLayer[0])).toBe("[object Arguments]");
    expect(Array.from(dataLayer[0] as ArrayLike<unknown>)).toEqual([
      "config",
      "G-TEST",
      { send_page_view: false },
    ]);
  });
});

describe("GA4 ecommerce payloads", () => {
  it("adds canonical item data while preserving pixel fields", () => {
    const payload = withGa4Items(
      { currency: "EUR", value: 849, content_ids: ["p-17"] },
      [analyticsItem({
        item_id: "p-17",
        item_name: "Apple iPhone 17",
        item_category: "smartphones",
        item_variant: "Schwarz 256 GB",
        price: 849,
        quantity: 1,
      })],
    );

    expect(payload).toMatchObject({
      currency: "EUR",
      value: 849,
      content_ids: ["p-17"],
      items: [{
        item_id: "p-17",
        item_name: "Apple iPhone 17",
        item_category: "smartphones",
        item_variant: "Schwarz 256 GB",
        price: 849,
        quantity: 1,
      }],
    });
  });
});
