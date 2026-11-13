import { describe, expect, it, vi } from "vitest";

import { seoRouteDefinitions } from "@/lib/seo-shared";

vi.mock("@/lib/seo", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/seo")>();
  return {
    ...actual,
    getSeoSettings: vi.fn(async () => ({
      global: { defaultKeywords: { de: "", en: "" }, defaultOgImage: "" },
      pages: {},
    })),
  };
});

const { createMetadata } = await import("@/lib/metadata");

/**
 * The English storefront must never be canonicalised onto a German slug. These
 * are the collection pages that used to expose `/en/samsung-handys` and friends.
 */
const localizedCollections = [
  { de: "/samsung-handys", en: "/samsung-phones" },
  { de: "/xiaomi-redmi-handys", en: "/xiaomi-redmi-phones" },
  { de: "/handys-ohne-vertrag", en: "/unlocked-phones" },
  { de: "/gebrauchte-handys", en: "/used-phones" },
  { de: "/gebrauchte-iphones", en: "/used-iphones" },
  { de: "/firmenkunden", en: "/business" },
] as const;

describe("localized /en/ collection slugs", () => {
  it("registers an English path for every catalogued German collection", () => {
    for (const collection of localizedCollections) {
      const route = seoRouteDefinitions.find((entry) => entry.path === collection.de);
      expect(route, collection.de).toBeDefined();
      expect(route?.paths).toEqual({ de: collection.de, en: collection.en });
    }
  });

  it("canonicalises each locale on its own slug and emits bidirectional hreflang", async () => {
    for (const collection of localizedCollections) {
      const alternatePaths = { de: collection.de, en: collection.en };
      const de = await createMetadata("de", "Titel", "Beschreibung", collection.de, undefined, { alternatePaths });
      const en = await createMetadata("en", "Title", "Description", collection.de, undefined, { alternatePaths });

      expect(de.alternates?.canonical).toMatch(new RegExp(`/de${collection.de}$`));
      expect(en.alternates?.canonical).toMatch(new RegExp(`/en${collection.en}$`));
      expect(en.alternates?.languages).toMatchObject({
        de: expect.stringContaining(`/de${collection.de}`),
        en: expect.stringContaining(`/en${collection.en}`),
        "x-default": expect.stringContaining(`/de${collection.de}`),
      });
    }
  });
});
