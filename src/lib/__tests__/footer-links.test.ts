import { describe, expect, it } from "vitest";

import { getDictionary } from "@/lib/i18n";

describe("footer catalog link", () => {
  it("localizes the A–Z catalog entry in both dictionaries", () => {
    expect(getDictionary("de").footer.catalogLink).toEqual({
      label: "Alle Produkte A–Z",
      path: "/store/catalog",
    });
    expect(getDictionary("en").footer.catalogLink).toEqual({
      label: "All Products A–Z",
      path: "/store/catalog",
    });
  });
});
