import { describe, expect, it } from "vitest";

import { getDictionary, isLocale, locales } from "@/lib/i18n";

describe("isLocale", () => {
  it("accepts exactly the supported locales", () => {
    expect(locales).toEqual(["de", "en"]);
    for (const l of locales) expect(isLocale(l)).toBe(true);
  });

  it("rejects everything else", () => {
    for (const v of ["xx", "fr", "", "DE", "de-DE"]) expect(isLocale(v)).toBe(false);
  });
});

describe("getDictionary", () => {
  it("returns a dictionary for supported locales", () => {
    for (const l of locales) expect(getDictionary(l)?.meta?.home?.title).toBeTruthy();
  });

  it("falls back to German rather than returning undefined", () => {
    expect(getDictionary("xx")).toBe(getDictionary("de"));
  });
});
