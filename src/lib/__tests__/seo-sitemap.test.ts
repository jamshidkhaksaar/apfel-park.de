import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/admin-db", () => ({
  createAdminDbClient: () => {
    throw new Error("No admin database in sitemap unit tests");
  },
}));

vi.mock("@/lib/products", () => ({
  countActiveSubcategoryProducts: vi.fn(async () => 0),
  getProducts: vi.fn(async () => []),
}));

import { getSitemapEntries } from "@/lib/seo";

const comparisonPath = "/repairs/preisvergleich-hamburg";

describe("repair comparison sitemap publication gate", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
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
