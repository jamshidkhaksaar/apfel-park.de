import { describe, expect, it } from "vitest";

import { canAccessAdminPath } from "../admin-auth";
import type { User } from "../auth-types";

const user = (role: string): User => ({
  id: `${role}@example.com`,
  email: `${role}@example.com`,
  app_metadata: { role },
  user_metadata: { role },
});

describe("admin page path authorization", () => {
  it("limits product editors to product and inventory pages", () => {
    const editor = user("product_editor");
    expect(canAccessAdminPath(editor, "/admin/products/abc")).toBe(true);
    expect(canAccessAdminPath(editor, "/admin/inventory")).toBe(true);
    expect(canAccessAdminPath(editor, "/admin/orders")).toBe(false);
    expect(canAccessAdminPath(editor, "/admin/health")).toBe(false);
  });

  it("allows managers only their configured operational areas", () => {
    const manager = user("manager");
    expect(canAccessAdminPath(manager, "/admin/orders/abc")).toBe(true);
    expect(canAccessAdminPath(manager, "/admin/chat")).toBe(true);
    expect(canAccessAdminPath(manager, "/admin/settings")).toBe(false);
    expect(canAccessAdminPath(manager, "/admin/health")).toBe(false);
  });

  it("allows administrators and rejects unknown roles", () => {
    expect(canAccessAdminPath(user("admin"), "/admin/settings")).toBe(true);
    expect(canAccessAdminPath(user("unknown"), "/admin")).toBe(false);
  });
});
