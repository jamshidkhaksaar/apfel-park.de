import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import type { StoreCatalogCategory, StoreCatalogFacets, StoreCatalogFilters } from "@/lib/products";
import StoreQuickFilters from "../store/StoreQuickFilters";

const facets: StoreCatalogFacets = {
  brands: [{ value: "Apple", count: 53 }, { value: "Samsung", count: 45 }, { value: "Xiaomi", count: 14 }],
  storages: [],
  conditions: [{ value: "new", count: 40 }, { value: "open_box", count: 20 }, { value: "used", count: 57 }],
  accessoryTypes: [{ value: "cases", count: 30 }, { value: "chargers", count: 52 }, { value: "power-banks", count: 14 }],
  inStock: 100,
  priceMin: 5,
  priceMax: 1999,
};
const noFilters: StoreCatalogFilters = { query: "", brands: [], storages: [], conditions: [], accessoryTypes: [], inStockOnly: false };
const counts = { all: 469, smartphones: 117, tablets: 9, "open-box-smartphones-tablets": 30, accessories: 340, parts: 58, laptops: 1, consoles: 0 } as Record<StoreCatalogCategory, number>;

const render = (props: Partial<Parameters<typeof StoreQuickFilters>[0]> = {}) => renderToStaticMarkup(createElement(StoreQuickFilters, {
  lang: "de", facets, activeFilters: noFilters, activeCategory: "all", counts,
  categoryHref: (category) => `/de/store?category=${category}`, onChange: vi.fn(), ...props,
}));

describe("store quick filters", () => {
  it("offers category pills and condition chips with counts on the main shop", () => {
    const html = render();
    expect(html).toContain('href="/de/store?category=smartphones"');
    expect(html).not.toContain("category=consoles");
    expect(html).toContain("Gebraucht A+");
    expect(html).toMatch(/Open Box<span[^>]*>20</);
    // Brand and type rows belong to their categories.
    expect(html).not.toContain("Alle Marken");
    expect(html).not.toContain("Alles Zubehör");
  });

  it("shows brand chips on the smartphone page, without the category row", () => {
    const html = render({ activeCategory: "smartphones", lockedCategory: "smartphones", activeFilters: { ...noFilters, brands: ["apple"] } });
    expect(html).toContain("Alle Marken");
    expect(html).toMatch(/aria-pressed="true"[^>]*>Apple<span[^>]*>53</);
    expect(html).toMatch(/Samsung<span[^>]*>45</);
    expect(html).not.toContain("category=tablets");
  });

  it("shows accessory types on the accessories page", () => {
    const html = render({ activeCategory: "accessories", lockedCategory: "accessories" });
    expect(html).toContain("Alles Zubehör");
    expect(html).toMatch(/Ladegeräte<span[^>]*>52</);
    expect(html).toMatch(/Powerbanks<span[^>]*>14</);
    expect(html).not.toContain("Alle Marken");
  });

  it("speaks English", () => {
    const html = render({ lang: "en", activeCategory: "smartphones", lockedCategory: "smartphones" });
    expect(html).toContain("All brands");
    expect(html).toContain("Used A+");
  });
});

describe("quick filter selection", () => {
  // Drives the chip handler the component passes to onChange.
  const apply = (current: string[], param: "condition" | "brand", value: string | null) => {
    let captured: ((params: URLSearchParams) => void) | undefined;
    const onChange = vi.fn((mutate) => { captured = mutate; });
    const filters = { ...noFilters, [param === "brand" ? "brands" : "conditions"]: current } as StoreCatalogFilters;
    const element = StoreQuickFilters({
      lang: "de", facets, activeFilters: filters, activeCategory: "smartphones", lockedCategory: "smartphones", counts,
      categoryHref: () => "", onChange,
    });
    // Find the chip's onClick in the rendered tree.
    const buttons: Array<{ props: { onClick?: () => void; children?: unknown } }> = [];
    const walk = (node: unknown) => {
      if (!node || typeof node !== "object") return;
      if (Array.isArray(node)) return node.forEach(walk);
      const element = node as { type?: unknown; props?: { children?: unknown; onClick?: () => void } };
      if (element.type === "button") buttons.push(element as never);
      if (typeof element.type === "function") return walk((element.type as (p: unknown) => unknown)(element.props));
      walk(element.props?.children);
    };
    walk(element);
    const label = value === null ? (param === "brand" ? "Alle Marken" : "Alle") : value === "new" ? "Neu" : value;
    const button = buttons.find((candidate) => JSON.stringify(candidate.props.children).includes(`"${label}"`));
    button?.props.onClick?.();
    const params = new URLSearchParams(param === "brand" && current.length ? `brand=${current.join(",")}` : current.length ? `condition=${current.join(",")}` : "");
    captured?.(params);
    return params.toString();
  };

  it("selects one chip, and clears it when tapped again", () => {
    expect(apply([], "condition", "new")).toBe("condition=new");
    expect(apply(["new"], "condition", "new")).toBe("");
    expect(apply(["new", "used"], "condition", "new")).toBe("condition=new");
    expect(apply([], "brand", "Samsung")).toBe("brand=samsung");
    expect(apply(["samsung"], "brand", null)).toBe("");
  });
});
