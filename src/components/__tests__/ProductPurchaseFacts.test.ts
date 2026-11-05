import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import ProductPurchaseFacts from "../ProductPurchaseFacts";

describe("ProductPurchaseFacts", () => {
  it("keeps condition transparency without repeating stock and fulfillment", () => {
    const html = renderToStaticMarkup(createElement(ProductPurchaseFacts, {
      locale: "de",
      condition: "open_box",
      conditionNote: "Geprüft und vollständig funktionsfähig.",
      model: "iPhone 15 Pro",
      stock: 5,
      hasRealProductPhotos: true,
    }));

    expect(html).toContain("Zustand transparent");
    expect(html).toContain("Echte Produktfotos");
    expect(html).not.toContain("Bestand");
    expect(html).not.toContain("Übergabe");
  });

  it("links device listings to the repair service but not accessories", () => {
    const phone = renderToStaticMarkup(createElement(ProductPurchaseFacts, {
      locale: "de",
      condition: "open_box",
      model: "iPhone 15 Pro",
      stock: 5,
      hasRealProductPhotos: true,
      category: "smartphones",
    }));
    expect(phone).toContain('href="/de/repairs"');
    expect(phone).toContain("Reparatur ansehen");

    const accessory = renderToStaticMarkup(createElement(ProductPurchaseFacts, {
      locale: "de",
      condition: "new",
      stock: 5,
      hasRealProductPhotos: true,
      category: "accessories",
    }));
    expect(accessory).not.toContain('href="/de/repairs"');
  });
});