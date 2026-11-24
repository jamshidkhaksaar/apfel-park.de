import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import type { CatalogCardModel } from "@/lib/catalog-card";
import BlackFridayDealExplorer, { DEALS_PAGE_SIZE } from "../black-friday/BlackFridayDealExplorer";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("../store/StoreQuickAddDrawer", () => ({ default: () => null }));

const deal = (index: number): CatalogCardModel => ({
  id: `deal-${index}`, title: `Deal Phone ${index}`, slug: `deal-phone-${index}`, image: "/images/ipad.png",
  price: 100 + index, compareAtPrice: 120 + index, campaignPercent: 5, category: "smartphones", condition: "new",
  stock: 1, brand: "Apple", facts: [], colors: [], storages: [], variants: [],
});

describe("Black Week deal explorer", () => {
  it("renders the first page of deals and offers the rest on request", () => {
    const deals = Array.from({ length: DEALS_PAGE_SIZE + 6 }, (_, index) => deal(index));
    const html = renderToStaticMarkup(createElement(BlackFridayDealExplorer, { lang: "de", deals }));
    const cards = html.match(/href="\/de\/store\/deal-phone-\d+"/g) ?? [];
    expect(new Set(cards).size).toBe(DEALS_PAGE_SIZE);
    expect(html).toContain("Weitere 6 Deals anzeigen");
    expect(html).toContain(`${DEALS_PAGE_SIZE} von ${DEALS_PAGE_SIZE + 6} angezeigt`);
    // The result count reflects every deal, not just the rendered page.
    expect(html).toContain(`>${DEALS_PAGE_SIZE + 6}</span> Treffer`);
  });

  it("shows no button when every deal fits on the first page", () => {
    const html = renderToStaticMarkup(createElement(BlackFridayDealExplorer, { lang: "en", deals: [deal(1), deal(2)] }));
    expect(html).not.toContain("more deals");
  });
});
