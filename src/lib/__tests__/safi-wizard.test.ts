import { describe, expect, it } from "vitest";
import { extraGalleryImages, mergeCoverAndGallery, findCatalogTemplate } from "../product-intake/safi-wizard";

describe("safi-wizard helpers", () => {
  it("merges cover first and keeps gallery extras", () => {
    const images = mergeCoverAndGallery("/uploads/cover.webp", ["/uploads/a.webp", "/uploads/b.webp"]);
    expect(images[0]).toBe("/uploads/cover.webp");
    expect(images).toHaveLength(3);
  });

  it("drops the cover from the extra list", () => {
    expect(extraGalleryImages(["/uploads/a.webp", "/uploads/cover.webp"], "/uploads/cover.webp")).toEqual(["/uploads/a.webp"]);
  });

  it("finds a catalog template by brand and model", () => {
    const template = findCatalogTemplate([
      { id: "a", brand: "Apple", model: "iPhone 17" },
      { id: "b", brand: "Samsung", model: "Galaxy A57" },
    ], "apple", "iphone 17");
    expect(template?.id).toBe("a");
    expect(findCatalogTemplate([{ id: "a", brand: "Apple", model: "iPhone 17" }], "apple", "iphone 17", "a")).toBeNull();
  });
});
