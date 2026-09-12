import { describe, expect, it } from "vitest";
import { accessoryCollectionLinks } from "@/lib/accessory-collection-links";

describe("accessory collection navigation", () => {
  it("includes transparent cases when the active catalog contains them", () => {
    const links = accessoryCollectionLinks([{ category: "accessories", subcategory: "cases-clear" }], "de");
    expect(links).toHaveLength(1);
    expect(links[0]).toMatchObject({ slug: "transparente-huellen", href: "/de/accessories/transparente-huellen", count: 1 });
  });

  it("counts listings and uses localized labels and URLs", () => {
    const catalog = [
      { category: "accessories" as const, subcategory: "cases-clear" },
      { category: "accessories" as const, subcategory: "cases-clear" },
    ];
    const de = accessoryCollectionLinks(catalog, "de")[0];
    const en = accessoryCollectionLinks(catalog, "en")[0];
    expect(de.count).toBe(2);
    expect(en.count).toBe(2);
    expect(de.title).not.toBe(en.title);
    expect(en.href).toBe("/en/accessories/transparente-huellen");
  });

  it("omits empty, unknown and non-accessory subcategories", () => {
    expect(accessoryCollectionLinks([
      { category: "smartphones", subcategory: "cases-clear" },
      { category: "accessories", subcategory: "other" },
      { category: "accessories", subcategory: "unrecognized" },
    ], "de")).toEqual([]);
  });

  it("does not link the current category back to itself", () => {
    expect(accessoryCollectionLinks([{ category: "accessories", subcategory: "cases-clear" }], "de", "transparente-huellen")).toEqual([]);
  });

  it("does not change source records and has no query/filter URLs", () => {
    const product = Object.freeze({ category: "accessories" as const, subcategory: "cases-hard" });
    const links = accessoryCollectionLinks(Object.freeze([product]), "de");
    expect(links[0].href).toBe("/de/accessories/hardcases");
    expect(product.subcategory).toBe("cases-hard");
  });
});
