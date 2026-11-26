import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

import OwnerDashboard from "../admin/OwnerDashboard";
import type { DashboardOverview } from "@/lib/admin-dashboard-overview";

const day = (date: string, online: number) => ({ date, online });
const overview: DashboardOverview = {
  generatedAt: "2026-11-18T10:00:00Z",
  today: { unitsOnline: 3, revenueOnline: 1099, ordersToday: 1 },
  week: { units: 5, previousUnits: 4, revenueOnline: 1099 },
  days: Array.from({ length: 14 }, (_, index) => day(`2026-11-${String(5 + index).padStart(2, "0")}`, index % 3)),
  stock: {
    value: 169052, units: 1475, inStockSkus: 246, soldOutProducts: 8,
    lowStock: [{ productId: "a", title: "Apple iPhone 18 Pro Max", image: "/uploads/a.webp", units: 1 }], lowStockCount: 12,
    slowMovers: [{ productId: "b", title: "Samsung Galaxy S23 FE", image: null, units: 18, value: 5742 }], slowMoverCount: 30,
    byCategory: [{ category: "smartphones", value: 150000, units: 300 }, { category: "accessories", value: 19052, units: 1100 }],
  },
  topSellers: [{ productId: "c", title: "Apple iPhone 11", image: null, units: 4 }],
  todo: { ordersToHandle: 2, repairsOpen: 0, unreadChats: 1, failedSyncs: 0 },
  activity: [{ id: "sale_online:1", kind: "sale_online", title: "Apple iPhone 11", amount: "1", at: "2026-11-18T09:58:00Z", href: "/admin/products/c" }],
};

describe("owner dashboard", () => {
  it("renders the live overview for the owner", () => {
    const html = renderToStaticMarkup(createElement(OwnerDashboard, {
      initial: { overview, visitors: 3 }, name: "Safi", blackFridayTools: true,
      campaign: { active: true, phase: "before", startsAt: "2026-11-23T00:00:00+01:00", endsAt: "2026-11-30T23:59:59+01:00", deals: 8 },
    }));
    expect(html).toContain("Safi");
    expect(html).toContain("3 Stück");
    expect(html).toContain("169.052");
    expect(html).toContain("Lagerbestand");
    expect(html).toContain("Barcode scannen");
    expect(html).not.toMatch(/verkaufen|im Laden/);
    expect(html).toContain("Bestellungen warten");
    expect(html).toContain("Black Friday startet in");
    expect(html).toContain("Ladenhüter");
    expect(html).toContain("1× online verkauft");
  });

  it("speaks English when the admin language is English", () => {
    const html = renderToStaticMarkup(createElement(OwnerDashboard, {
      initial: { overview, visitors: 3 }, name: "Safi", blackFridayTools: true, locale: "en",
      campaign: { active: true, phase: "before", startsAt: "2026-11-23T00:00:00+01:00", endsAt: "2026-11-30T23:59:59+01:00", deals: 8 },
    }));
    expect(html).toContain("3 units");
    expect(html).toContain("169,052");
    expect(html).toContain("Inventory");
    expect(html).not.toMatch(/Scan &amp; sell|in store/);
    expect(html).toContain("Orders waiting for shipping/pickup");
    expect(html).toContain("Black Friday starts in");
    expect(html).toContain("Slow sellers");
    expect(html).toContain("1× sold online");
    expect(html).not.toMatch(/Stück|Bestellungen|Ladenhüter|Lagerwert/);
  });
});
