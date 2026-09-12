import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import type { CatalogCardModel } from "@/lib/catalog-card";
import StoreProductCard from "../store/StoreProductCard";
import StoreProductRow from "../store/StoreProductRow";

const drawerRender = vi.hoisted(() => vi.fn(() => null));
vi.mock("../store/StoreQuickAddDrawer", () => ({ default: drawerRender }));
const product: CatalogCardModel = {
  id: "fixture", title: "Fixture Phone", slug: "fixture-phone", image: "/images/ipad.png",
  price: 199, compareAtPrice: 249, category: "smartphones", condition: "used", stock: 3,
  facts: ["128 GB"], colors: ["Black", "White"], storages: ["128 GB"],
  variants: [{ color: "Black", storage: "128 GB", stock: 2 }, { color: "White", storage: "128 GB", stock: 1 }],
};

describe("catalog initial render budget", () => {
  for (const Component of [StoreProductCard, StoreProductRow]) {
    for (const locale of ["de", "en"] as const) {
      it(`${Component.name}/${locale}: does not initialize a closed variant drawer`, () => {
        drawerRender.mockClear();
        const html = renderToStaticMarkup(createElement(Component, { product, locale, listName: "Fixture", position: 1 }));
        expect(html).toContain("Fixture Phone");
        expect(html).toContain(`/${locale}/store/fixture-phone`);
        expect(html).toContain(locale === "de" ? "Gebraucht" : "Used");
        expect(html).toContain(locale === "de" ? "in den Warenkorb" : "Add Fixture Phone to cart");
        expect(drawerRender).not.toHaveBeenCalled();
      });
    }
  }
});
