import { describe, expect, it } from "vitest";

import { buildCollectionPageSchema, buildListingBreadcrumbSchema } from "@/lib/store-schema";

describe("catalog structured data canonical alignment", () => {
  const canonicalUrl = "https://apfel-park.de/de/smartphones?page=2";
  const options = {
    lang: "de" as const,
    name: "Smartphones",
    url: canonicalUrl,
    catalog: { total: 30, page: 2 },
    products: [{ title: "iPhone Air", slug: "iphone-air" }],
  };

  it("uses the resolved canonical for CollectionPage and breadcrumb URLs", () => {
    const collection = buildCollectionPageSchema(options);
    const breadcrumb = buildListingBreadcrumbSchema(options);

    expect(collection.url).toBe(canonicalUrl);
    expect(breadcrumb.itemListElement.at(-1)?.item).toBe(canonicalUrl);
  });
});
