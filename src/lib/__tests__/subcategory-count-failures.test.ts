import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("@/lib/db", () => ({ query: mocks.query, createDbClient: vi.fn() }));

import { countActiveSubcategoryProducts } from "@/lib/products";

describe("subcategory count strict reads", () => {
  beforeEach(() => { mocks.query.mockReset(); });

  it("propagates query failure in strict sitemap mode", async () => {
    mocks.query.mockRejectedValue(new Error("database offline"));
    await expect(countActiveSubcategoryProducts("cases-hard", { failOnError: true })).rejects.toThrow("database offline");
  });

  it("preserves the ordinary page fallback", async () => {
    mocks.query.mockRejectedValue(new Error("database offline"));
    await expect(countActiveSubcategoryProducts("cases-hard")).resolves.toBe(0);
  });

  it("accepts a real zero count in strict mode", async () => {
    mocks.query.mockResolvedValue({ rows: [{ total: 0 }] });
    await expect(countActiveSubcategoryProducts("cases-hard", { failOnError: true })).resolves.toBe(0);
  });

  it.each([{ rows: [] }, { rows: [{ total: null }] }, { rows: [{ total: -1 }] }, { rows: [{ total: 1.5 }] }])("rejects an invalid count result %j", async ({ rows }) => {
    mocks.query.mockResolvedValue({ rows });
    await expect(countActiveSubcategoryProducts("cases-hard", { failOnError: true })).rejects.toThrow("invalid data");
  });
});
