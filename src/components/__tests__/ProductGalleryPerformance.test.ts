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
    // The first thumbnails load at once: lazy ones in the sideways strip stayed
    // blank on phones until tapped.
    expect(html.match(/loading="eager"/g)).toHaveLength(2);
    expect(html).toContain("object-contain");
  });

  it("still lazy-loads thumbnails beyond the first five", () => {
    const images = Array.from({ length: 7 }, (_, index) => `/images/fixture-${index}.png`);
    const html = renderToStaticMarkup(createElement(ProductGallery, { title: "Fixture phone", locale: "de", images }));
    expect(html.match(/loading="eager"/g)).toHaveLength(5);
    expect(html.match(/loading="lazy"/g)).toHaveLength(2);
  });
});
