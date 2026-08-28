import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ProductDesktopPurchaseBarContent, shouldShowPurchaseBar } from "../ProductDesktopPurchaseBar";

describe("ProductDesktopPurchaseBar", () => {
  it("hides whenever the mini cart is open", () => {
    expect(shouldShowPurchaseBar(true, false, false)).toBe(true);
    expect(shouldShowPurchaseBar(true, false, true)).toBe(false);
    expect(shouldShowPurchaseBar(true, true, false)).toBe(false);
  });
  it("renders the selected product summary and cart action on desktop", () => {
    const html = renderToStaticMarkup(createElement(ProductDesktopPurchaseBarContent, {
      locale: "de",
      title: "Apple iPhone 15 Pro 128 GB Titan Schwarz",
      image: "/uploads/iphone-15-pro.webp",
      variantLabel: "Titan Schwarz · 128 GB · Open-Box",
      price: 720,
      compareAtPrice: 749,
      discount: 4,
      isOutOfStock: false,
      added: false,
      visible: true,
      onAddToCart: () => undefined,
    }));

    expect(html).toContain('alt="Apple iPhone 15 Pro 128 GB Titan Schwarz"');
    expect(html).toContain("Titan Schwarz · 128 GB · Open-Box");
    expect(html).toContain("720,00");
    expect(html).toContain("749,00");
    expect(html).toContain("−4%");
    expect(html).toContain("In den Warenkorb");
    expect(html).toContain("fixed inset-x-0 bottom-0");
    expect(html).toContain("hidden xl:block");
    expect(html).toContain("min-h-24");
    expect(html).toContain('aria-hidden="false"');
  });

  it("does not expose an active cart button while unavailable", () => {
    const html = renderToStaticMarkup(createElement(ProductDesktopPurchaseBarContent, {
      locale: "de",
      title: "Nicht verfügbares Produkt",
      image: "/uploads/sold-out.webp",
      variantLabel: "Open-Box",
      price: 99,
      compareAtPrice: undefined,
      discount: null,
      isOutOfStock: true,
      added: false,
      visible: true,
      onAddToCart: () => undefined,
    }));

    expect(html).toContain("Ausverkauft");
    expect(html).toContain("disabled");
  });

  it("removes the hidden bar from interaction and the accessibility tree", () => {
    const html = renderToStaticMarkup(createElement(ProductDesktopPurchaseBarContent, {
      locale: "de",
      title: "Apple iPhone 15 Pro",
      image: "/uploads/iphone-15-pro.webp",
      variantLabel: "Open-Box",
      price: 720,
      compareAtPrice: 749,
      discount: 4,
      isOutOfStock: false,
      added: false,
      visible: false,
      onAddToCart: () => undefined,
    }));

    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("pointer-events-none");
    expect(html).toContain("translate-y-full");
    expect(html).toContain('tabindex="-1"');
    expect(html).toContain("disabled");
  });
});
