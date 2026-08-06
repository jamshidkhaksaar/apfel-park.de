import { describe, expect, it } from "vitest";

import { buildBaseSlug, extractStorage, slugify, uniquifySlug } from "../product-slug";

describe("slugify", () => {
  it("lowercases and strips punctuation", () => {
    expect(slugify("Apple iPhone 17 Pro Max!")).toBe("apple-iphone-17-pro-max");
  });

  it("collapses repeated hyphens and whitespace", () => {
    expect(slugify("  Apple   iPhone--15  ")).toBe("apple-iphone-15");
  });

  // German text is half the catalog; deleting the umlaut produced "kopfhrer".
  it.each([
    ["Kopfhörer", "kopfhoerer"],
    ["Schutzhülle für iPhone", "schutzhuelle-fuer-iphone"],
    ["Titan weiß", "titan-weiss"],
    ["Größe", "groesse"],
    ["Zubehör", "zubehoer"],
  ])("transliterates %s", (input, expected) => {
    expect(slugify(input)).toBe(expected);
  });

  it("keeps separated words apart when punctuation is removed", () => {
    // "Over-Ear/USB-C" must not fuse into one token.
    expect(slugify("Over-Ear/USB-C")).toBe("over-ear-usb-c");
  });

  it("never leaves a leading or trailing hyphen", () => {
    expect(slugify("– Wireless –")).toBe("wireless");
  });
});

describe("extractStorage", () => {
  it("finds storage sizes in GB and TB", () => {
    expect(extractStorage(["128GB"])).toBe("128gb");
    expect(extractStorage(["iPhone 15 Pro 256GB"])).toBe("256gb");
    expect(extractStorage(["1TB SSD"])).toBe("1tb");
  });

  it("returns null when no size is present", () => {
    expect(extractStorage(["iPhone 15 Pro Max"])).toBeNull();
  });
});

describe("buildBaseSlug", () => {
  it("keeps the title, which is what actually distinguishes products", () => {
    // brand+model+condition alone collided 1,785 times across the catalog:
    // 70 Guess cases all reduced to guess-iphone-15-pro-neu.
    expect(
      buildBaseSlug({
        brand: "Guess",
        model: "iPhone 15 Pro",
        title: "GUESS 4G Triangle Strass MagSafe Schutzhülle Schwarz",
        condition: "new",
      }),
    ).toBe("guess-4g-triangle-strass-magsafe-schutzhuelle-schwarz-neu");
  });

  it("prefixes the brand only when the title omits it", () => {
    expect(buildBaseSlug({ brand: "Apple", title: "iPhone 16 128GB Schwarz", condition: "new" })).toBe(
      "apple-iphone-16-128gb-schwarz-neu",
    );
    expect(buildBaseSlug({ brand: "Guess", title: "Guess Hardcase Pink", condition: "new" })).toBe(
      "guess-hardcase-pink-neu",
    );
  });

  it("distinguishes colour variants of the same model", () => {
    const white = buildBaseSlug({ brand: "Apple", title: "iPhone 15 Pro Max- Titan weiß", condition: "new" });
    const blue = buildBaseSlug({ brand: "Apple", title: "iPhone 15 Pro Max 256GB Titan blau", condition: "new" });
    expect(white).not.toBe(blue);
    expect(white).toBe("apple-iphone-15-pro-max-titan-weiss-neu");
  });

  it.each([
    ["new", "neu"],
    ["open_box", "openbox"],
    ["used", "gebraucht"],
  ])("appends the %s condition as %s", (condition, label) => {
    expect(buildBaseSlug({ brand: "Apple", title: "iPhone 15", condition })).toBe(`apple-iphone-15-${label}`);
  });

  it("separates the same device sold new and used", () => {
    expect(buildBaseSlug({ brand: "Apple", title: "iPhone 15", condition: "new" })).not.toBe(
      buildBaseSlug({ brand: "Apple", title: "iPhone 15", condition: "used" }),
    );
  });

  it("adds variant storage only when the title lacks it", () => {
    expect(
      buildBaseSlug({ brand: "Apple", title: "iPhone 15 Pro", variants: [{ storage: "256GB" }], condition: "new" }),
    ).toBe("apple-iphone-15-pro-256gb-neu");
    // Already in the title: do not repeat it.
    expect(
      buildBaseSlug({ brand: "Apple", title: "iPhone 15 Pro 256GB", variants: [{ storage: "256GB" }], condition: "new" }),
    ).toBe("apple-iphone-15-pro-256gb-neu");
  });

  it("truncates long titles on a word boundary", () => {
    const slug = buildBaseSlug({
      brand: "XByte",
      title: "XBYTE Exclusive Genius Mini Powerbank 10000mAh 22.5W Super Fast Charge mit integrierten Kabeln",
      condition: "new",
    });
    expect(slug.length).toBeLessThanOrEqual(80);
    expect(slug.endsWith("-neu")).toBe(true);
    expect(slug).not.toMatch(/--/);
  });

  it("does not repeat a condition the title already ends with", () => {
    // Real title from the catalog: "Apple iphone 17 pro max 256GB-Neu".
    expect(buildBaseSlug({ brand: "Apple", title: "Apple iphone 17 pro max 256GB-Neu", condition: "new" })).toBe(
      "apple-iphone-17-pro-max-256gb-neu",
    );
    expect(buildBaseSlug({ brand: "Apple", title: "iPhone 14 gebraucht", condition: "used" })).toBe(
      "apple-iphone-14-gebraucht",
    );
  });

  it("falls back to brand and model, then to a generic slug", () => {
    expect(buildBaseSlug({ brand: "Apple", model: "iPhone 15", condition: "new" })).toBe("apple-iphone-15-neu");
    expect(buildBaseSlug({})).toBe("produkt");
  });
});

describe("uniquifySlug", () => {
  it("returns the base when it is free", () => {
    expect(uniquifySlug("apple-iphone-15-neu", new Set(["samsung-galaxy-s24-neu"]))).toBe("apple-iphone-15-neu");
  });

  it("appends -2, -3 on collisions", () => {
    const taken = new Set(["apple-iphone-15-neu", "apple-iphone-15-neu-2"]);
    expect(uniquifySlug("apple-iphone-15-neu", taken)).toBe("apple-iphone-15-neu-3");
  });
});
