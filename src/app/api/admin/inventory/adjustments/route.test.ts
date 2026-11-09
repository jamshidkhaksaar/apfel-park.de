import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ adjust: vi.fn(), query: vi.fn(), session: vi.fn() }));
vi.mock("@/lib/marketplaces/inventory", () => ({ adjustInventory: mocks.adjust }));
vi.mock("@/lib/db", () => ({ query: mocks.query }));
vi.mock("@/lib/session", () => ({ readSessionUserFromRequest: mocks.session }));
vi.mock("@/lib/admin-csrf", () => ({ rejectCrossSiteAdminMutation: () => null }));

import { POST } from "./route";

const user = (role: string) => ({
  id: `${role}@example.com`,
  email: `${role}@example.com`,
  app_metadata: { role },
  user_metadata: { role },
});
const post = (body: Record<string, unknown>) =>
  POST(new NextRequest("https://apfel-park.de/api/admin/inventory/adjustments", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  }));

beforeEach(() => {
  vi.resetAllMocks();
  mocks.session.mockResolvedValue(user("cashier"));
  mocks.adjust.mockResolvedValue({ sku: "SKU-1", onHand: 4, reserved: 0, available: 4, version: 2 });
  mocks.query.mockResolvedValue({ rows: [] });
});

it("refuses a cashier shop sale while the workspace is under construction", async () => {
  const response = await post({ sku: "SKU-1", type: "shop_sale", quantity: 1, idempotencyKey: "cashier-sale-1" });
  expect(response.status).toBe(409);
  expect((await response.json()).error).toBe("shop_sale_disabled");
  expect(mocks.adjust).not.toHaveBeenCalled();
});

it("refuses a manager shop sale as well", async () => {
  mocks.session.mockResolvedValue(user("manager"));
  const response = await post({ sku: "SKU-1", type: "shop_sale", quantity: 1, idempotencyKey: "manager-sale-1" });
  expect(response.status).toBe(409);
  expect(mocks.adjust).not.toHaveBeenCalled();
});

it("denies a cashier every other stock movement", async () => {
  const response = await post({ sku: "SKU-1", type: "restock", quantity: 1, idempotencyKey: "cashier-restock-1" });
  expect(response.status).toBe(401);
  expect(mocks.adjust).not.toHaveBeenCalled();
});
