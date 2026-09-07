import { describe, expect, it } from "vitest";

import { getRelatedStoreCollectionLinks, getStoreCollectionCopy, storeCollectionIds } from "@/lib/store-collections";

describe("store collections", () => {
  it.each(['de', 'en'] as const)('links to distinct related indexed collections, not itself, in %s', locale => {
    for (const id of storeCollectionIds) {
      const links = getRelatedStoreCollectionLinks(id, locale);
      expect(links).toHaveLength(storeCollectionIds.length - 1);
      expect(new Set(links.map(link => link.href)).size).toBe(links.length);
      expect(links.some(link => link.href === getStoreCollectionCopy(id, locale).path)).toBe(false);
      expect(links.every(link => link.href.startsWith('/') && !link.href.includes('?'))).toBe(true);
    }
  });

  it.each(['iphone-17', 'xiaomi-redmi-phones', 'samsung-phones', 'used-iphones'] as const)('%s answers practical buying questions in both languages', id => {
    for (const locale of ['de', 'en'] as const) {
      const copy = getStoreCollectionCopy(id, locale);
      expect(copy.intro.length).toBeGreaterThanOrEqual(3);
      expect(copy.faq.length).toBeGreaterThanOrEqual(5);
      expect(copy.metaTitle.length).toBeLessThanOrEqual(47);
      expect(copy.description.length).toBeLessThanOrEqual(155);
    }
  });

  it('distinguishes contract-free purchase from a carrier lock', () => {
    expect(getStoreCollectionCopy('phones-without-contract', 'de').faq[0].answer).toMatch(/^Nein\./);
    expect(getStoreCollectionCopy('phones-without-contract', 'en').faq[0].answer).toMatch(/^No\./);
  });

  it('grounds iPhone battery and activation guidance in manufacturer support', () => {
    const copy = getStoreCollectionCopy('used-iphones', 'de');
    expect(copy.metaTitle).toContain('Hamburg');
    expect(copy.sources?.[0].href).toBe('https://support.apple.com/de-de/104999');
    expect(copy.faq.some(item => item.answer.includes('Mindestwert'))).toBe(true);
    expect(copy.faq.some(item => item.answer.includes('Aktivierungssperre'))).toBe(true);
    expect(getStoreCollectionCopy('iphone-17', 'de').intro.join(' ')).toContain('iPhone Air');
    expect(getStoreCollectionCopy('iphone-17', 'de').benefits[0].title).not.toContain('Alle');
  });
  it("includes the national ecommerce landing pages", () => {
    expect(storeCollectionIds).toEqual(expect.arrayContaining([
      "iphone-16-pro-max",
      "samsung-phones",
      "xiaomi-redmi-phones",
      "phones-without-contract",
    ]));
  });

  it.each([
    ["iphone-17", "/iphone-17"],
    ["iphone-16-pro-max", "/iphone-16-pro-max"],
    ["samsung-phones", "/samsung-handys"],
    ["xiaomi-redmi-phones", "/xiaomi-redmi-handys"],
    ["phones-without-contract", "/handys-ohne-vertrag"],
  ] as const)("%s has localized, search-safe metadata", (id, path) => {
    for (const locale of ["de", "en"] as const) {
      const copy = getStoreCollectionCopy(id, locale);
      expect(copy.path).toBe(path);
      expect(copy.metaTitle.length).toBeLessThanOrEqual(47);
      expect(copy.description.length).toBeLessThanOrEqual(155);
      expect(copy.intro.length).toBeGreaterThanOrEqual(2);
      expect(copy.faq.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("matches English iPhone collection snippets to Germany purchase intent", () => {
    const iphone17 = getStoreCollectionCopy("iphone-17", "en");
    const iphone16ProMax = getStoreCollectionCopy("iphone-16-pro-max", "en");

    expect(iphone17.metaTitle).toContain("in Germany");
    expect(iphone17.metaTitle).toContain("Prices");
    expect(iphone17.description).toContain("delivery across Germany");
    expect(iphone16ProMax.metaTitle).toContain("in Germany");
    expect(iphone16ProMax.metaTitle).toContain("Prices");
  });

  it("discloses Poco when Poco phones are included in the Xiaomi collection", () => {
    for (const locale of ["de", "en"] as const) {
      const copy = getStoreCollectionCopy("xiaomi-redmi-phones", locale);
      expect([
        copy.title,
        copy.description,
        copy.introTitle,
        ...copy.intro,
      ].join(" ")).toMatch(/Poco/i);
    }
  });
});
