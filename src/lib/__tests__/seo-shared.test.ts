import { describe, expect, it } from "vitest";

import { splitKeywords } from "@/lib/seo-shared";

describe("splitKeywords", () => {
  it("splits, trims and drops empties", () => {
    expect(splitKeywords("a, b ,  c ")).toEqual(["a", "b", "c"]);
    expect(splitKeywords("a,,b,")).toEqual(["a", "b"]);
  });

  it("returns [] for empty input", () => {
    expect(splitKeywords("")).toEqual([]);
    expect(splitKeywords("  ")).toEqual([]);
  });

  // The original 500: defaultKeywords[locale] was undefined for an unknown
  // locale and splitKeywords called .split() straight on it.
  it("tolerates undefined and null instead of throwing", () => {
    expect(splitKeywords(undefined)).toEqual([]);
    expect(splitKeywords(null)).toEqual([]);
  });
});
