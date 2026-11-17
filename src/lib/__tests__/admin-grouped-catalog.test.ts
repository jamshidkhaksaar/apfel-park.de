import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({ query: vi.fn() }));

import { buildQuickEditGroup, GROUP_KEY_SQL } from "../admin-grouped-catalog";

const row = (over: Record<string, unknown>) => ({
  id: "p1", title: "Apple iPhone 11", brand: "Apple", model: "iPhone 11", sku: null, category: "smartphones",
  condition: "used", price: "199.00", stock: 0, is_active: true, images: ["/a.webp"], variants: [],
  family_id: null, family_name: null, option_values: null, group_key: "m:apple|iphone 11", ...over,
});

describe("grouped admin catalog", () => {
  it("passes a real regex whitespace class to SQL", () => {
    // One real backslash: Postgres must receive the regex class \s.
    expect(GROUP_KEY_SQL).toContain("huawei)" + String.fromCharCode(92) + "s+");
  });

  it("makes one row per variant with ledger stock and the variant price", () => {
    const group = buildQuickEditGroup("k", [
      row({ id: "p1", variants: [{ sku: "A-1", color: "Schwarz", storage: "64GB", price: 199 }, { sku: "A-2", color: "Weiß", storage: "128GB", price: "229" }] }),
      row({ id: "p2", sku: "B-1", price: "239.00", stock: 4, option_values: { color: "Rot", storage: "128" } }),
    ] as never, new Map([["A-1", 2], ["A-2", 0]]));

    expect(group.rows).toHaveLength(3);
    expect(group.rows[0]).toMatchObject({ sku: "A-1", stock: 2, ledger: true, price: 199, firstOfProduct: true, variantCount: 2 });
    expect(group.rows[1]).toMatchObject({ sku: "A-2", stock: 0, ledger: true, price: 229, firstOfProduct: false });
    // No ledger row: stock falls back to products.stock and cannot be adjusted here.
    expect(group.rows[2]).toMatchObject({ sku: "B-1", stock: 4, ledger: false, color: "Rot", storage: "128 GB" });
    expect(group.totalStock).toBe(6);
    expect([group.minPrice, group.maxPrice]).toEqual([199, 239]);
  });
});
