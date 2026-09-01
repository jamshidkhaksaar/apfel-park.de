import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createDbClient: vi.fn(),
  query: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  createDbClient: mocks.createDbClient,
  query: mocks.query,
}));

vi.mock("react", () => ({
  cache: <Args extends unknown[], Result>(loader: (...args: Args) => Result) => {
    const memo = new Map<string, Result>();
    return (...args: Args): Result => {
      const key = JSON.stringify(args);
      if (!memo.has(key)) memo.set(key, loader(...args));
      return memo.get(key) as Result;
    };
  },
}));

import { getProductBySlug } from "@/lib/products";

describe("request-scoped product lookup", () => {
  beforeEach(() => {
    mocks.createDbClient.mockReset();
    mocks.query.mockReset();
  });

  it("deduplicates metadata and page reads while hydrating current ledger stock once", async () => {
    const productRow = {
      id: "11111111-1111-1111-1111-111111111111",
      title: "iPhone Air",
      subtitle: "256 GB",
      description: "Test product",
      price: 999,
      compare_at_price: null,
      category: "smartphones",
      condition: "new",
      brand: "Apple",
      model: "iPhone Air",
      sku: "AIR-256",
      stock: 1,
      slug: "iphone-air",
      images: ["/images/iphone-air.webp"],
      feature_bullets: [],
      specs: [],
      variants: [],
    };
    const single = vi.fn(async () => ({ data: productRow, error: null }));
    const activeEq = vi.fn(() => ({ single }));
    const slugEq = vi.fn(() => ({ eq: activeEq }));
    const select = vi.fn(() => ({ eq: slugEq }));
    const from = vi.fn(() => ({ select }));
    mocks.createDbClient.mockReturnValue({ from });
    mocks.query.mockResolvedValue({
      rows: [{ product_id: productRow.id, sku: productRow.sku, available: 7 }],
    });

    const [metadataProduct, pageProduct] = await Promise.all([
      getProductBySlug("iphone-air", "de"),
      getProductBySlug("iphone-air", "de"),
    ]);

    expect(metadataProduct?.stock).toBe(7);
    expect(pageProduct).toBe(metadataProduct);
    expect(from).toHaveBeenCalledTimes(1);
    expect(single).toHaveBeenCalledTimes(1);
    expect(mocks.query).toHaveBeenCalledTimes(1);
  });

  it("returns null for Supabase's genuine no-row response", async () => {
    const single = vi.fn(async () => ({
      data: null,
      error: { code: "PGRST116", message: "JSON object requested, multiple (or no) rows returned" },
    }));
    const activeEq = vi.fn(() => ({ single }));
    const slugEq = vi.fn(() => ({ eq: activeEq }));
    const select = vi.fn(() => ({ eq: slugEq }));
    mocks.createDbClient.mockReturnValue({ from: vi.fn(() => ({ select })) });

    await expect(getProductBySlug("missing-product", "de")).resolves.toBeNull();
    expect(single).toHaveBeenCalledTimes(1);
    expect(mocks.query).not.toHaveBeenCalled();
  });

  it("throws transient database errors instead of memoizing a false not-found", async () => {
    const databaseError = { code: "08006", message: "connection failure" };
    const single = vi.fn(async () => ({ data: null, error: databaseError }));
    const activeEq = vi.fn(() => ({ single }));
    const slugEq = vi.fn(() => ({ eq: activeEq }));
    const select = vi.fn(() => ({ eq: slugEq }));
    mocks.createDbClient.mockReturnValue({ from: vi.fn(() => ({ select })) });

    await expect(getProductBySlug("temporarily-unavailable", "de")).rejects.toBe(databaseError);
    expect(single).toHaveBeenCalledTimes(1);
    expect(mocks.query).not.toHaveBeenCalled();
  });
});
