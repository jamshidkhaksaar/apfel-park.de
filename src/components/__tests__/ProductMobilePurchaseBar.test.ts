import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ProductMobilePurchaseBarContent } from "../ProductMobilePurchaseBar";

describe("ProductMobilePurchaseBar", () => {
  it("keeps the product image, title, price, discount and purchase actions visible", () => {
    const html = renderToStaticMarkup(createElement(ProductMobilePurchaseBarContent, {
      locale: "de",
      title: "Apple iPhone 16 256 GB",
      image: "/uploads/iphone-16.webp",
      price: 849,
      discount: 11,
      isOutOfStock: false,
      added: false,
      buyHref: "/de/checkout",
      onAddToCart: () => undefined,
      onBuy: () => undefined,
      visible: true,
    }));

    expect(html).toContain('alt="Apple iPhone 16 256 GB"');
    expect(html).toContain("Apple iPhone 16 256 GB");
    expect(html).toContain("849,00");
    expect(html).toContain("−11%");
    expect(html).toContain("Warenkorb");
    expect(html).toContain("Kaufen");
    expect(html).toContain("fixed inset-x-0");
    expect(html).toContain("--apfel-cookie-banner-height");
    expect(html).toContain("md:hidden");
  });

  it("does not expose a checkout link when the product is out of stock", () => {
    const html = renderToStaticMarkup(createElement(ProductMobilePurchaseBarContent, {
      locale: "de",
      title: "Ausverkauftes Produkt",
      image: "/uploads/sold-out.webp",
      price: 99,
      discount: null,
      isOutOfStock: true,
      added: false,
      buyHref: "/de/checkout",
      onAddToCart: () => undefined,
      onBuy: () => undefined,
      visible: true,
    }));

    expect(html).toContain("Ausverkauft");
    expect(html).not.toContain('href="/de/checkout"');
  });
});
