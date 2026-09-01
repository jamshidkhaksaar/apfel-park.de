import { describe, expect, it } from "vitest";

import { createMetadata, normalizeMetadataTitle } from "../metadata";
import { resolveStoreIndexing } from "../store-indexing";

describe("metadata title ownership", () => {
  it("lets the root template add the Apfel Park brand exactly once", () => {
    expect(normalizeMetadataTitle("Gerät verkaufen | Apfel Park")).toBe("Gerät verkaufen");
    expect(normalizeMetadataTitle("Kontakt & Anfahrt – Apfel Park Hamburg")).toBe("Kontakt & Anfahrt – Hamburg");
    expect(normalizeMetadataTitle("Online Shop")).toBe("Online Shop");
  });
});

describe("catalog metadata query policy", () => {
  it("noindexes presentation parameters while following links and canonicalizing to the collection", async () => {
    const indexing = resolveStoreIndexing({ view: "list" });
    const metadata = await createMetadata(
      "de",
      "Online Shop",
      "Catalog",
      "/store",
      undefined,
      { noindex: indexing.noindex, canonicalQuery: indexing.canonicalQuery },
    );

    expect(metadata.robots).toEqual({ index: false, follow: true });
    expect(metadata.alternates?.canonical).toBe("https://apfel-park.de/de/store");
  });

  it("keeps clean pagination indexable and self-canonical", async () => {
    const indexing = resolveStoreIndexing({ page: "2" });
    const metadata = await createMetadata(
      "en",
      "Online Store",
      "Catalog",
      "/store",
      undefined,
      { noindex: indexing.noindex, canonicalQuery: indexing.canonicalQuery },
    );

    expect(metadata.robots).toEqual({ index: true, follow: true });
    expect(metadata.alternates?.canonical).toBe("https://apfel-park.de/en/store?page=2");
  });

  it("keeps pagination in the canonical for noindexed presentation views", async () => {
    const indexing = resolveStoreIndexing({ page: "2", view: "list" });
    const metadata = await createMetadata(
      "de",
      "Online Shop",
      "Catalog",
      "/store",
      undefined,
      { noindex: indexing.noindex, canonicalQuery: indexing.canonicalQuery },
    );

    expect(metadata.robots).toEqual({ index: false, follow: true });
    expect(metadata.alternates?.canonical).toBe("https://apfel-park.de/de/store?page=2");
  });
});
