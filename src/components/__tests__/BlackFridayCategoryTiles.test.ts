import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import BlackFridayCategoryTiles from "../black-friday/BlackFridayCategoryTiles";
import { blackFridayCategories } from "@/lib/black-friday-categories";

describe("Black Friday category tiles", () => {
  it("show all five categories during the sale, linking empty ones to the normal shop", () => {
    const stats = blackFridayCategories.map((category) => ({
      category, count: category.id === "apple" ? 7 : 0, maxPercent: category.id === "apple" ? 10 : null, images: [],
    }));
    const html = renderToStaticMarkup(createElement(BlackFridayCategoryTiles, { lang: "de", stats, phase: "live" }));
    for (const category of blackFridayCategories) expect(html).toContain(category.title.de);
    expect(html).toContain('href="/de/store?brand=apple&amp;deals=1"');
    expect(html).toContain('href="/de/store?brand=samsung"');
    expect(html).toContain("7 Angebote");
    expect(html).toContain("Jetzt entdecken");
  });
});
