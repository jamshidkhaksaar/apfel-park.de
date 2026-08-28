import { describe, expect, it } from "vitest";

import { PRODUCT_DETAIL_GRID_CLASS, PRODUCT_PAGE_CONTAINER_CLASS } from "../product-page-layout";

describe("desktop product-page layout", () => {
  it("uses a wide bounded product shell and a 56/44 desktop split", () => {
    expect(PRODUCT_PAGE_CONTAINER_CLASS).toContain("max-w-[108rem]");
    expect(PRODUCT_PAGE_CONTAINER_CLASS).toContain("px-4");
    expect(PRODUCT_PAGE_CONTAINER_CLASS).toContain("sm:px-6");
    expect(PRODUCT_PAGE_CONTAINER_CLASS).toContain("2xl:px-8");
    expect(PRODUCT_DETAIL_GRID_CLASS).toContain("minmax(480px,1fr)");
    expect(PRODUCT_DETAIL_GRID_CLASS).toContain("minmax(0,1.27fr)");
    expect(PRODUCT_DETAIL_GRID_CLASS).toContain("2xl:gap-12");
  });
});
