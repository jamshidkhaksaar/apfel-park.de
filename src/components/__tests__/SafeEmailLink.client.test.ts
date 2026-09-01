import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useSyncExternalStore: (
      _subscribe: (onStoreChange: () => void) => () => void,
      getSnapshot: () => unknown,
    ) => getSnapshot(),
  };
});

import ProductGpsrContacts from "@/components/ProductGpsrContacts";
import SafeEmailLink from "@/components/SafeEmailLink";

describe("SafeEmailLink client branch", () => {
  it("creates the mailto link after hydration without jsdom", () => {
    const html = renderToStaticMarkup(createElement(SafeEmailLink, {
      email: "sales@example.com",
    }));

    expect(html).toContain('href="mailto:sales@example.com"');
    expect(html).toContain("sales@example.com");
  });

  it("lets GPSR contacts link only trimmed, valid addresses", () => {
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

    expect(html).toContain('href="mailto:valid@example.com"');
    expect(html).not.toContain("mailto:broken");
    expect(html).toContain("broken [at] example [dot] com extra");
    expect(html).not.toContain("broken@example.com");
  });
});
