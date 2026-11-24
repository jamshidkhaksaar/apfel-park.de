import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({ query: vi.fn() }));
vi.mock("@/lib/black-friday-selection", () => ({ getBlackFridaySelection: vi.fn() }));
vi.mock("@/lib/seasonal-theme-server", () => ({ getEffectiveCampaign: vi.fn() }));

const {
  buildStockReportRows,
  formatStorage,
  groupStockReport,
  parseStockReportFilters,
  stockReportQueryString,
} = await import("@/lib/admin-stock-report");

const product = (overrides: Record<string, unknown>) => ({
  id: "aaaaaaaa-0000-4000-8000-000000000000",
  title: "Apple iPhone 15",
  brand: "Apple",
  model: "iPhone 15",
  category: "smartphones",
  condition: "used",
  price: 600,
  stock: 2,
  is_active: true,
  image: "/uploads/main.webp",
  variants: [],
  ...overrides,
});

describe("stock report filters", () => {
  it("defaults to active products with photos and a tick-off column", () => {
    expect(parseStockReportFilters({})).toEqual({
      status: "active", category: "", brands: [], condition: "", stock: "all", search: "", images: true, checkColumn: true,
    });
  });

  it("reads the form, ignoring unknown values", () => {
    const filters = parseStockReportFilters({
      status: "draft", category: "smartphones", brand: ["Apple", "Samsung", "Apple"], condition: "open_box",
      stock: "sold_out", q: "  iPhone 15 ", images: "0", check: ["0", "1"],
    });
    expect(filters).toMatchObject({
      status: "draft", category: "smartphones", brands: ["Apple", "Samsung"], condition: "open_box",
      stock: "sold_out", search: "iPhone 15", images: false, checkColumn: true,
    });
    expect(parseStockReportFilters({ status: "x", category: "cars", stock: "?" })).toMatchObject({ status: "active", category: "", stock: "all" });
  });

  it("round-trips through the query string", () => {
    const filters = parseStockReportFilters({ category: "tablets", brand: ["Apple"], stock: "in_stock", images: "0" });
    const params = Object.fromEntries(new URLSearchParams(stockReportQueryString(filters)));
    expect(parseStockReportFilters(params)).toEqual(filters);
  });
});

describe("stock report rows", () => {
  it("prints one row per colour/storage variant with its own stock, price and photo", () => {
    const rows = buildStockReportRows([product({
      variants: [
        { color: "schwarz", storage: "128GB", price: 599, stock: 1, images: ["/uploads/black.webp"] },
        { color: "Blau", storage: "256", stock: 0 },
      ],
    })] as never, {}, false);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ color: "Schwarz", storage: "128 GB", price: 599, stock: 1, image: "/uploads/black.webp", ref: "AAAAAA" });
    expect(rows[1]).toMatchObject({ color: "Blau", storage: "256 GB", price: 600, stock: 0, image: "/uploads/main.webp" });
  });

  it("shows the Black Week price only while the sale is live", () => {
    const discounts = { "aaaaaaaa-0000-4000-8000-000000000000": { type: "percent" as const, value: 10 } };
    expect(buildStockReportRows([product({})] as never, discounts, true)[0].salePrice).toBe(540);
    expect(buildStockReportRows([product({})] as never, discounts, false)[0].salePrice).toBeNull();
  });

  it("normalises storage labels", () => {
    expect(formatStorage("64")).toBe("64 GB");
    expect(formatStorage("1TB")).toBe("1 TB");
    expect(formatStorage("1")).toBe("1 TB");
    expect(formatStorage("")).toBe("");
  });
});

describe("stock report groups", () => {
  const rows = buildStockReportRows([
    product({ id: "b0000000-0000-4000-8000-000000000000", brand: "Xiaomi", model: "Redmi 13", stock: 3 }),
    product({ id: "c0000000-0000-4000-8000-000000000000", brand: "Celly", model: "Case", category: "accessories", stock: 0 }),
    product({ id: "d0000000-0000-4000-8000-000000000000", brand: "Samsung", model: "Galaxy A15", stock: 1 }),
    product({ id: "e0000000-0000-4000-8000-000000000000", model: "iPhone 12", stock: 4 }),
    product({ id: "f0000000-0000-4000-8000-000000000000", model: "iPhone 11", stock: 0 }),
  ] as never, {}, false);

  it("lists phone brands first, then the rest alphabetically, with counts", () => {
    const groups = groupStockReport(rows);
    expect(groups.map((group) => group.brand)).toEqual(["Apple", "Samsung", "Xiaomi", "Celly"]);
    expect(groups[0]).toMatchObject({ products: 2, units: 4, soldOut: 1 });
    expect(groups[0].rows.map((row) => row.model)).toEqual(["iPhone 11", "iPhone 12"]);
  });

  it("filters on stock", () => {
    expect(groupStockReport(rows, "in_stock").flatMap((group) => group.rows).every((row) => row.stock > 0)).toBe(true);
    expect(groupStockReport(rows, "sold_out").map((group) => group.brand)).toEqual(["Apple", "Celly"]);
  });
});
