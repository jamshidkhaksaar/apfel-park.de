import { describe, expect, it, vi } from "vitest";

// requireLocale calls notFound(), which throws in the real App Router. Mock it
// with a tagged throw so tests can assert it fired without pulling in Next.
class NotFoundError extends Error {}
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new NotFoundError("NEXT_NOT_FOUND");
  },
}));

const { requireLocale } = await import("@/lib/route-locale");

describe("requireLocale", () => {
  it("returns supported locales unchanged", () => {
    expect(requireLocale("de")).toBe("de");
    expect(requireLocale("en")).toBe("en");
  });

  // This is the regression that shipped: unknown locales reached code indexing
  // Record<Locale, T> and threw a TypeError (500) instead of 404ing.
  it.each(["xx", "fr", "wp-admin", "", "DE", "de-DE", "../etc/passwd"])(
    "calls notFound() for %o",
    (value) => {
      expect(() => requireLocale(value)).toThrow(NotFoundError);
    },
  );

  it("is case-sensitive: 'DE' is not a locale", () => {
    expect(() => requireLocale("DE")).toThrow(NotFoundError);
  });
});
