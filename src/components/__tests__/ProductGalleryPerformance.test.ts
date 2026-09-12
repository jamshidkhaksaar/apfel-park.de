import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import ProductGallery from "../ProductGallery";

describe("gallery responsive image budget", () => {
  it("describes 72px mobile and 96px desktop thumbnails, retaining the full gallery", () => {
    const html = renderToStaticMarkup(createElement(ProductGallery, {
      title: "Fixture phone", locale: "de", images: ["/images/ipad.png", "/images/shop2.jpg"],
    }));
    expect(html.match(/sizes="\(max-width: 639px\) 72px, 96px"/g)).toHaveLength(2);
    expect(html).toContain('aria-label="Bild 2 von 2"');
    expect(html).toContain('aria-label="Bildergalerie öffnen: Fixture phone"');
    expect(html).toContain('<link rel="preload" as="image"');
    expect(html).toContain('loading="lazy"');
    expect(html).toContain("object-contain");
  });
});
