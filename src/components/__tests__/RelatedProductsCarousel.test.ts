import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import RelatedProductsCarousel from "../RelatedProductsCarousel";

const products = [
  { id: "one", slug: "iphone-one", title: "iPhone One", image: "/uploads/one.webp", metaLabel: "Open-Box", price: 499 },
  { id: "two", slug: "iphone-two", title: "iPhone Two", image: "/uploads/two.webp", metaLabel: "Gebraucht A+", price: 599 },
];

describe("RelatedProductsCarousel", () => {
  it("renders a compact mobile swipe carousel and preserves the desktop grid", () => {
    const html = renderToStaticMarkup(createElement(RelatedProductsCarousel, {
      locale: "de",
      products,
    }));

    expect(html).toContain('aria-roledescription="Karussell"');
    expect(html).toContain('aria-label="iPhone One, 1 von 2"');
    expect(html).toContain('aria-label="iPhone Two, 2 von 2"');
    expect(html).not.toContain("aria-posinset");
    expect(html).not.toContain("aria-setsize");
    expect(html).toContain("snap-x");
    expect(html).toContain("snap-mandatory");
    expect(html).toContain("overflow-x-auto");
    expect(html).toContain("w-[74vw]");
    expect(html).toContain("h-44");
    expect(html).toContain("md:grid-cols-2");
    expect(html).toContain("xl:grid-cols-4");
    expect(html).toContain("Nach links wischen");
    expect(html).toContain("motion-reduce:scroll-auto");
    expect(html).toContain("rounded-2xl focus-visible:outline-none focus-visible:ring-2");
  });
});
