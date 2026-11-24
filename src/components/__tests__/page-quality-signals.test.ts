import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import BlackFridayHero from "../black-friday/BlackFridayHero";
import SmartphoneLongevityGuidePage from "@/app/(site)/[lang]/ratgeber/smartphone-laenger-nutzen/page";

const heroProps = {
  lang: "de" as const,
  targetAt: "2026-11-30T23:59:59+01:00",
  initialSeconds: 3600,
  deals: [],
  total: 0,
  maxDiscount: 10,
  phase: "live" as const,
};

describe("page quality signals", () => {
  it("keeps exactly one H1 in the campaign hero on the home page and the landing page", () => {
    // During Black Week the hero replaces the home slider, which normally owns the H1.
    for (const variant of ["home", "landing"] as const) {
      const html = renderToStaticMarkup(createElement(BlackFridayHero, { ...heroProps, variant }));
      expect(html.match(/<h1\b/g)).toHaveLength(1);
    }
    const home = renderToStaticMarkup(createElement(BlackFridayHero, { ...heroProps, variant: "home" }));
    expect(home).toContain("iPhone &amp; Smartphone online kaufen bei Apfel Park – Versand in ganz Deutschland");
  });

  it("shows the guide's author and update date, matching its Article schema", async () => {
    const html = renderToStaticMarkup(await SmartphoneLongevityGuidePage({ params: Promise.resolve({ lang: "de" }) }));
    expect(html).toContain("Bismaillah Safi");
    expect(html).toContain('<time dateTime="2026-11-13">Aktualisiert am 13. November 2026</time>');
    const schema = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)![1]);
    expect(schema).toMatchObject({
      "@type": "Article",
      datePublished: "2026-11-09",
      dateModified: "2026-11-13",
      author: { "@type": "Person", name: "Bismaillah Safi" },
    });
  });
});
