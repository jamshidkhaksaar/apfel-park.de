import type { Locale } from "./i18n";
import { getStoreCatalog, parseStoreCatalogFilters, type StoreCatalogCollection } from "./products";

/** Lowest price a customer can buy right now in a model collection, or null. */
export async function collectionFromPrice(collection: StoreCatalogCollection, locale: Locale): Promise<number | null> {
  try {
    const catalog = await getStoreCatalog({
      category: "smartphones",
      collection,
      sort: "price-asc",
      page: 1,
      pageSize: 1,
      locale,
      filters: parseStoreCatalogFilters({ stock: "available" }),
    });
    const price = catalog.products[0]?.price;
    return typeof price === "number" && price > 0 ? price : null;
  } catch (error) {
    // Metadata must never fail on a catalogue read; the static title remains.
    console.warn("[metadata] collection price read failed", { collection, error });
    return null;
  }
}
