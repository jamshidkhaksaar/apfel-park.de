import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import ProductGpsrContacts from "@/components/ProductGpsrContacts";

describe("GPSR email rendering", () => {
  it("keeps both contacts readable to people without exposing email links in SSR", () => {
    const html = renderToStaticMarkup(createElement(ProductGpsrContacts, {
      locale: "de",
      gpsr: {
        manufacturer: {
          name: "Apple Distribution International",
          email: "manufacturer@example.com",
        },
        euResponsible: {
          name: "Apple EU",
          email: "responsible@example.eu",
        },
        safetyWarnings: [],
        safetyDocuments: [],
      },
    }));

    expect(html).toContain("manufacturer [at] example [dot] com");
    expect(html).toContain("responsible [at] example [dot] eu");
    expect(html).not.toContain("mailto:");
    expect(html).not.toContain("/cdn-cgi/");
    expect(html).not.toContain("manufacturer@example.com");
    expect(html).not.toContain("responsible@example.eu");
  });

  it("omits a missing email while preserving the required party details", () => {
    const html = renderToStaticMarkup(createElement(ProductGpsrContacts, {
      locale: "en",
      gpsr: {
        manufacturer: { name: "Example Manufacturer", address: "Example Street 1" },
        safetyWarnings: [],
        safetyDocuments: [],
      },
    }));

    expect(html).toContain("Example Manufacturer");
    expect(html).toContain("Example Street 1");
    expect(html).not.toContain("mailto:");
  });

  it("trims valid emails and obfuscates invalid addresses as readable text", () => {
    const html = renderToStaticMarkup(createElement(ProductGpsrContacts, {
      locale: "en",
      gpsr: {
        manufacturer: {
          name: "Example Manufacturer",
          email: "  valid@example.com  ",
        },
        euResponsible: {
          name: "Example EU Contact",
          email: "  broken@example.com extra  ",
        },
        safetyWarnings: [],
        safetyDocuments: [],
      },
    }));

    expect(html).toContain("valid [at] example [dot] com");
    expect(html).toContain("broken [at] example [dot] com extra");
    expect(html).not.toContain("broken@example.com");
    expect(html).not.toContain("mailto:");
  });
});
