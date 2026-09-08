import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import StoreBrandCards, { getBrandBrowsePath } from "../store/StoreBrandCards";
import AccessoryCategoryCards from "../store/AccessoryCategoryCards";

describe("catalog discovery cards", () => {
  it("renders five real SVG brand marks with localized, crawlable filter links", () => {
    const html = renderToStaticMarkup(createElement(StoreBrandCards, { lang: "de" }));
    for (const name of ["Apple", "Samsung", "Google", "Xiaomi", "Huawei"]) {
      expect(html).toContain(`data-brand-card="${name}"`);
      expect(html).toContain(`/de${getBrandBrowsePath(name)}`);
    }
    expect(html.match(/fill="#[A-F0-9]{6}"/g)).toHaveLength(4);
    expect(html).toContain("/images/brands/google-wordmark.svg");
    expect(html).toContain("Top Marken");
    expect(html).not.toContain("Wir führen alle");
    expect(getBrandBrowsePath('Samsung')).toBe('/samsung-handys#angebote');
    expect(getBrandBrowsePath('Xiaomi')).toBe('/xiaomi-redmi-handys#angebote');
    expect(getBrandBrowsePath('Apple')).toBe('/smartphones?brand=Apple#store');
  });

  it.each(["de", "en"] as const)("renders four lightweight category images and working browse destinations in %s", (lang) => {
    const html = renderToStaticMarkup(createElement(AccessoryCategoryCards, { lang }));
    expect(html).toContain(`/${lang}/accessories?atype=cases#store`);
    expect(html).not.toContain(`/${lang}/accessories/hardcases`);
    for (const slug of ["kopfhoerer-audio", "ladegeraete-kabel", "displayschutz"]) {
      expect(html).toContain(`/${lang}/accessories/${slug}`);
    }
    expect(html.match(/loading="lazy"/g)).toHaveLength(4);
    expect(html.match(/<img /g)).toHaveLength(4);
    expect(html).toContain("lifestyle-v1.webp");
    expect(html).toContain("motion-safe:");
    expect(html).toContain(lang === "de" ? "KI-generierte" : "AI-generated");
  });
});
