import { describe, expect, it } from "vitest";

import { mapConsentAllowsEmbed } from "@/lib/map-consent";

describe("map-specific consent", () => {
  it("loads a map for global external consent or explicit map-only consent", () => {
    expect(mapConsentAllowsEmbed("external", null)).toBe(true);
    expect(mapConsentAllowsEmbed("necessary", "allowed")).toBe(true);
  });

  it("does not load a map from necessary or unset consent alone", () => {
    expect(mapConsentAllowsEmbed("necessary", null)).toBe(false);
    expect(mapConsentAllowsEmbed("unset", null)).toBe(false);
  });
});
