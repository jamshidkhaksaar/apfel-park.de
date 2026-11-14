import { describe, expect, it } from "vitest";

import { buildCollectionPageSchema, buildListingBreadcrumbSchema } from "@/lib/store-schema";

describe("catalog structured data canonical alignment", () => {
  const canonicalUrl = "https://apfel-park.de/de/smartphones?page=2";
  const options = {
    lang: "de" as const,
    name: "Smartphones",
    url: canonicalUrl,
    catalog: { total: 30, page: 2 },
    products: [{
      title: "iPhone Air",
      slug: "iphone-air",
      description: "Test device",
      image: "/images/iphone.png",
      brand: "Apple",
      sku: "IP-AIR",
      price: 899,
      stock: 1,
      condition: "open_box" as const,
    }],
  };

  it("uses the resolved canonical for CollectionPage and breadcrumb URLs", () => {
    const collection = buildCollectionPageSchema(options);
    const breadcrumb = buildListingBreadcrumbSchema(options);

    expect(collection.url).toBe(canonicalUrl);
    expect(breadcrumb.itemListElement.at(-1)?.item).toBe(canonicalUrl);
    const item = collection.mainEntity.itemListElement[0].item;
    expect(item["@id"]).toBe("https://apfel-park.de/de/store/iphone-air");
    expect(item.image).toBe("https://apfel-park.de/images/iphone.png");
    expect(item.brand).toEqual({ "@type": "Brand", name: "Apple" });
    expect(item.offers).toEqual({
      "@type": "Offer",
      url: "https://apfel-park.de/de/store/iphone-air",
      priceCurrency: "EUR",
      price: 899,
      itemCondition: "https://schema.org/NewCondition",
      availability: "https://schema.org/InStock",
      seller: { "@id": "https://apfel-park.de/#store" },
      availableDeliveryMethod: ["https://schema.org/OnSitePickup", "https://schema.org/ParcelService"],
    });
  });
});
