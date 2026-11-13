import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ settings: vi.fn(), products: vi.fn(), count: vi.fn(), categoryCount: vi.fn() }));

vi.mock("@/lib/admin-db", () => ({
  createAdminDbClient: () => ({ from: () => ({ select: () => ({ eq: () => ({ maybeSingle: mocks.settings }) }) }) }),
}));

vi.mock("@/lib/products", () => ({
  countActiveCategoryProducts: mocks.categoryCount,
  countActiveSubcategoryProducts: mocks.count,
  getProducts: mocks.products,
}));

import { getSeoSettings, getSitemapEntries } from "@/lib/seo";
import sitemap from "@/app/sitemap";

beforeEach(() => {
  mocks.settings.mockReset().mockResolvedValue({ data: null, error: null });
  mocks.products.mockReset().mockResolvedValue([]);
  mocks.count.mockReset().mockResolvedValue(0);
  mocks.categoryCount.mockReset().mockResolvedValue(0);
});

const comparisonPath = "/repairs/preisvergleich-hamburg";

describe("repair comparison sitemap publication gate", () => {
  it("includes both public trade-in pages without indexing cart or checkout", async () => {
    const entries = await getSitemapEntries();
    expect(entries.filter((entry) => entry.url.endsWith('/trade-in')).map((entry) => entry.url)).toEqual([
      'https://apfel-park.de/de/trade-in', 'https://apfel-park.de/en/trade-in',
    ]);
    expect(entries.some((entry) => /\/(cart|checkout)$/.test(entry.url))).toBe(false);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });
  it("lists the Wilhelmsburg landing page under each locale's own slug", async () => {
    const entries = await getSitemapEntries();
    const urls = entries.map((entry) => entry.url);

    expect(urls).toContain("https://apfel-park.de/en/phone-store-hamburg-wilhelmsburg");
    expect(urls).toContain("https://apfel-park.de/de/handy-shop-hamburg-wilhelmsburg");
    expect(urls).not.toContain("https://apfel-park.de/en/handy-shop-hamburg-wilhelmsburg");

    const english = entries.find((entry) => entry.url.endsWith("/en/phone-store-hamburg-wilhelmsburg"));
    expect(english?.alternates?.languages?.de).toBe("https://apfel-park.de/de/handy-shop-hamburg-wilhelmsburg");
    expect(english?.alternates?.languages?.["x-default"]).toBe("https://apfel-park.de/de/handy-shop-hamburg-wilhelmsburg");
  });


  it("omits both localized comparison URLs while the benchmark is unpublished", async () => {
    vi.stubEnv("REPAIR_PRICE_COMPARISON_VERIFIED", "false");

    const entries = await getSitemapEntries();

    expect(entries.some((entry) => entry.url.endsWith(comparisonPath))).toBe(false);
  });

  it("restores both localized comparison URLs when publication is verified", async () => {
    vi.stubEnv("REPAIR_PRICE_COMPARISON_VERIFIED", "true");

    const entries = await getSitemapEntries();
    const comparisonUrls = entries
      .map((entry) => entry.url)
      .filter((url) => url.endsWith(comparisonPath));

    expect(comparisonUrls).toEqual([
      `https://apfel-park.de/de${comparisonPath}`,
      `https://apfel-park.de/en${comparisonPath}`,
    ]);
  });
});

describe("thin-category and sold-out sitemap hygiene", () => {
  it("lists a category at three SKUs, and the curated laptops/parts pages from one", async () => {
    mocks.categoryCount.mockImplementation(async (category: string) =>
      category === "smartphones" ? 3 : category === "laptops" || category === "parts" ? 1 : 2,
    );

    const urls = (await getSitemapEntries()).map((entry) => entry.url);

    expect(urls).toContain("https://apfel-park.de/de/smartphones");
    expect(urls).toContain("https://apfel-park.de/en/smartphones");
    expect(urls).toContain("https://apfel-park.de/de/laptops");
    expect(urls).toContain("https://apfel-park.de/en/laptops");
    expect(urls).toContain("https://apfel-park.de/de/parts");
    expect(urls).toContain("https://apfel-park.de/en/parts");
    expect(urls.some((url) => url.endsWith("/de/accessories"))).toBe(false);
  });

  it("drops a category again as soon as its active stock falls below three", async () => {
    mocks.categoryCount.mockResolvedValue(2);
    const urls = (await getSitemapEntries()).map((entry) => entry.url);
    expect(urls.some((url) => /\/(de|en)\/smartphones$/.test(url))).toBe(false);
  });

  it("lists English collections under their English slug, never the German one", async () => {
    const urls = (await getSitemapEntries()).map((entry) => entry.url);
    expect(urls).toContain("https://apfel-park.de/en/samsung-phones");
    expect(urls).toContain("https://apfel-park.de/en/unlocked-phones");
    expect(urls).not.toContain("https://apfel-park.de/en/samsung-handys");
    expect(urls).not.toContain("https://apfel-park.de/en/handys-ohne-vertrag");
  });

  it("keeps sold-out products out of the sitemap while their page stays live", async () => {
    mocks.products.mockResolvedValue([
      { category: "smartphones", slug: "in-stock-phone", stock: 2, updatedAt: "2026-09-07T10:00:00Z" },
      { category: "smartphones", slug: "sold-out-phone", stock: 0, updatedAt: "2026-09-07T10:00:00Z" },
    ]);
    const urls = (await getSitemapEntries()).map((entry) => entry.url);
    expect(urls).toContain("https://apfel-park.de/de/store/in-stock-phone");
    expect(urls.some((url) => url.endsWith("/store/sold-out-phone"))).toBe(false);
  });
});

describe("sitemap dependency failure handling", () => {
  it("rejects a failed catalog read instead of returning a shortened sitemap", async () => {
    mocks.products.mockImplementation(async (_category, _limit, _locale, options) => {
      if (options?.failOnError) throw new Error("catalog unavailable");
      return [];
    });
    await expect(getSitemapEntries()).rejects.toThrow("catalog unavailable");
  });

  it("does not swallow a rejected catalog promise", async () => {
    mocks.products.mockRejectedValue(new Error("catalog disconnected"));
    await expect(getSitemapEntries()).rejects.toThrow("catalog disconnected");
  });

  it("lets dependency failures propagate through the Next metadata route", async () => {
    mocks.products.mockRejectedValue(new Error("catalog disconnected"));
    await expect(sitemap()).rejects.toThrow("catalog disconnected");
  });

  it("rejects a database-reported SEO settings error", async () => {
    const error = { message: "settings query failed", code: "08006" };
    mocks.settings.mockResolvedValue({ data: null, error });
    await expect(getSitemapEntries()).rejects.toEqual(error);
    expect(mocks.products).not.toHaveBeenCalled();
  });

  it("rejects a thrown SEO settings error", async () => {
    mocks.settings.mockRejectedValue(new Error("settings disconnected"));
    await expect(getSitemapEntries()).rejects.toThrow("settings disconnected");
  });

  it("does not turn a failed category count into a shortened sitemap", async () => {
    mocks.categoryCount.mockImplementation(async (_category, options) => {
      if (options?.failOnError) throw new Error("category count unavailable");
      return 0;
    });
    await expect(getSitemapEntries()).rejects.toThrow("category count unavailable");
  });

  it("does not turn a failed collection count into an empty collection", async () => {
    mocks.count.mockImplementation(async (_subcategory, options) => {
      if (options?.failOnError) throw new Error("collection count unavailable");
      return 0;
    });
    await expect(getSitemapEntries()).rejects.toThrow("collection count unavailable");
  });

  it("still allows a genuinely empty catalog and a missing settings row", async () => {
    const entries = await getSitemapEntries();
    expect(entries.some(entry => entry.url === "https://apfel-park.de/de")).toBe(true);
    expect(entries.some(entry => entry.url.endsWith("/smartphones"))).toBe(false);
    expect(entries.some(entry => entry.url.includes("/accessories/"))).toBe(false);
  });

  it("keeps an explicitly disabled sitemap empty without querying inventory", async () => {
    mocks.settings.mockResolvedValue({ data: { value: { global: { enableSitemap: false } } }, error: null });
    await expect(getSitemapEntries()).resolves.toEqual([]);
    expect(mocks.products).not.toHaveBeenCalled();
    expect(mocks.count).not.toHaveBeenCalled();
  });

  it("preserves the existing soft fallback for ordinary page metadata", async () => {
    mocks.settings.mockRejectedValue(new Error("temporary settings failure"));
    await expect(getSeoSettings()).resolves.toHaveProperty("global.enableSitemap", true);
  });

  it("preserves actual product lastmod and bidirectional language URLs", async () => {
    mocks.products.mockResolvedValue([{ category: "smartphones", slug: "test-phone", stock: 1, updatedAt: "2026-09-07T10:00:00Z" }]);
    const entries = (await getSitemapEntries()).filter(entry => entry.url.endsWith("/store/test-phone"));
    expect(entries).toHaveLength(2);
    for (const entry of entries) {
      expect(entry.lastModified).toEqual(new Date("2026-09-07T10:00:00Z"));
      expect(entry.alternates?.languages).toEqual({ de: "https://apfel-park.de/de/store/test-phone", en: "https://apfel-park.de/en/store/test-phone", "x-default": "https://apfel-park.de/de/store/test-phone" });
    }
  });
});
