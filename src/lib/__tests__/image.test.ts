import { describe, expect, it } from "vitest";

import { shouldBypassImageOptimization } from "@/lib/image";

describe("image optimization policy", () => {
  it("optimizes local uploaded branding and product images", () => {
    expect(shouldBypassImageOptimization("/uploads/branding/logo-white.png")).toBe(false);
    expect(shouldBypassImageOptimization("/uploads/products/phone.webp")).toBe(false);
  });

  it("bypasses non-optimizable inline sources", () => {
    expect(shouldBypassImageOptimization("data:image/png;base64,abc")).toBe(true);
    expect(shouldBypassImageOptimization("blob:https://apfel-park.de/id")).toBe(true);
    expect(shouldBypassImageOptimization("")).toBe(true);
  });
});
