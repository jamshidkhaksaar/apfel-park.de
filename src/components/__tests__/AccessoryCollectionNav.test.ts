import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getProducts: vi.fn() }));
vi.mock("@/lib/products", () => ({ getProducts: mocks.getProducts }));
vi.mock("next/link", () => ({ default: ({ children, ...props }: React.ComponentProps<"a">) => React.createElement("a", props, children) }));

import AccessoryCollectionNav from "@/components/store/AccessoryCollectionNav";

describe("server-rendered accessory category navigation", () => {
  beforeEach(() => { mocks.getProducts.mockReset().mockResolvedValue([{ category: "accessories", subcategory: "cases-clear" }]); });

  it("renders a named navigation landmark and real German link", async () => {
    const html = renderToStaticMarkup(await AccessoryCollectionNav({ lang: "de" }));
    expect(html).toContain('aria-label="Zubehör-Kategorien"');
    expect(html).toContain('href="/de/accessories/transparente-huellen"');
    expect(html).toContain("1 Artikel");
    expect(html).toContain("min-h-11");
    expect(html).toContain("overflow-x-auto");
    expect(html).toContain("focus-visible:outline-2");
    expect(mocks.getProducts).toHaveBeenCalledWith(undefined, undefined, "de");
  });

  it("renders the English destination and singular count", async () => {
    const html = renderToStaticMarkup(await AccessoryCollectionNav({ lang: "en" }));
    expect(html).toContain('aria-label="Accessory categories"');
    expect(html).toContain('href="/en/accessories/transparente-huellen"');
    expect(html).toContain(">1 item</span>");
    expect(html).not.toContain(">1 items</span>");
  });

  it("omits an empty landmark when there are no other active collections", async () => {
    expect(await AccessoryCollectionNav({ lang: "de", currentSlug: "transparente-huellen" })).toBeNull();
    mocks.getProducts.mockResolvedValue([]);
    expect(await AccessoryCollectionNav({ lang: "de" })).toBeNull();
  });
});
