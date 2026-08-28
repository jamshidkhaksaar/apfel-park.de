import { describe, expect, it } from "vitest";

import { getGooglePreferredSourceBadge } from "../google-preferred-source";

describe("Google Preferred Sources footer badge", () => {
  it("uses Google's documented domain deeplink and localized official assets", () => {
    expect(getGooglePreferredSourceBadge("de")).toEqual({
      href: "https://www.google.com/preferences/source?q=apfel-park.de",
      imageSrc: "/branding/google-preferred-source/de.png",
      alt: "Als bevorzugte Quelle auf Google hinzufügen",
    });

    expect(getGooglePreferredSourceBadge("en")).toEqual({
      href: "https://www.google.com/preferences/source?q=apfel-park.de",
      imageSrc: "/branding/google-preferred-source/en.png",
      alt: "Add as a preferred source on Google",
    });
  });
});
