import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import StoreBrandCards from "../store/StoreBrandCards";
import AccessoryCategoryCards from "../store/AccessoryCategoryCards";

describe("catalog discovery cards", () => {
  it("renders five real SVG brand marks with localized, crawlable filter links", () => {
    const html = renderToStaticMarkup(createElement(StoreBrandCards, { lang: "de" }));
    for (const name of ["Apple", "Samsung", "Google", "Xiaomi", "Huawei"]) {
      expect(html).toContain(`data-brand-card="${name}"`);
      expect(html).toContain(`/de/smartphones?brand=${name}#store`);
    }
    expect(html.match(/fill="#[A-F0-9]{6}"/g)).toHaveLength(4);
    expect(html).toContain("/images/brands/google-wordmark.svg");
    expect(html).toContain("Top Marken");
    expect(html).not.toContain("Wir führen alle");
  });

  it.each(["de", "en"] as const)("renders four lightweight category images and original routes in %s", (lang) => {
    const html = renderToStaticMarkup(createElement(AccessoryCategoryCards, { lang }));
    for (const slug of ["hardcases", "kopfhoerer-audio", "ladegeraete-kabel", "displayschutz"]) {
      expect(html).toContain(`/${lang}/accessories/${slug}`);
    }
    expect(html.match(/loading="lazy"/g)).toHaveLength(4);
    expect(html.match(/<img /g)).toHaveLength(4);
    expect(html).toContain("lifestyle-v1.webp");
    expect(html).toContain("motion-safe:");
    expect(html).toContain(lang === "de" ? "KI-generierte" : "AI-generated");
  });
});
