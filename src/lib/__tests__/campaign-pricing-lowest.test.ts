import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("react", () => ({ cache: <T,>(fn: T) => fn }));
vi.mock("@/lib/db", () => ({ query: mocks.query, createDbClient: vi.fn() }));
vi.mock("@/lib/seasonal-theme-server", () => ({
  getEffectiveCampaign: async () => ({ mode: "auto", source: "calendar", phase: "live", theme: { id: "black-friday" } }),
}));
vi.mock("../seasonal-theme-server", () => ({
  getEffectiveCampaign: async () => ({ mode: "auto", source: "calendar", phase: "live", theme: { id: "black-friday" } }),
}));
vi.mock("../black-friday-selection", () => ({
  getBlackFridaySelection: async () => ({ pageIds: [], heroIds: [], discounts: { p1: { type: "percent", value: 10 } } }),
}));

import { applyCampaignPricing, type Product } from "../products";

describe("Black Friday 30-day reference price", () => {
  it("queries the price history with a valid UNION and measures against the 30-day low", async () => {
    mocks.query.mockResolvedValue({ rows: [{ product_id: "p1", variant_key: "", lowest: "900.00" }] });
    const [priced] = await applyCampaignPricing([{ id: "p1", price: 1000, variants: [] } as unknown as Product]);
    const sql = String(mocks.query.mock.calls[0][0]);
    // The DISTINCT ON arm must be parenthesised, or Postgres rejects the ORDER BY.
    expect(sql).toMatch(/UNION ALL[\s\S]*\(SELECT DISTINCT ON[\s\S]*ORDER BY[^)]*\)/);
    expect(priced.price).toBe(900);
    // Sale 900 vs 30-day low 900: no advertised reduction.
    expect(priced.campaignDeal).toBeUndefined();
  });
});
