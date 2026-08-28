import { toCatalogCardModel } from "@/lib/catalog-card";
import type { Locale } from "@/lib/i18n";
import { getRatingSummaries } from "@/lib/product-reviews";
import type {
  Product,
  StoreCatalogCategory,
  StoreCatalogFacets,
  StoreCatalogFilters,
  StoreCatalogSort,
} from "@/lib/products";
import StoreCatalogClient from "./StoreCatalogClient";

type StoreGridProps = {
  products: Product[];
  trendingProducts?: Product[];
  lang: Locale;
  activeCategory?: StoreCatalogCategory;
  sortBy?: StoreCatalogSort;
  total?: number;
  page?: number;
  pages?: number;
  counts?: Record<StoreCatalogCategory, number>;
  lockedCategory?: StoreCatalogCategory;
  facets?: StoreCatalogFacets;
  activeFilters?: StoreCatalogFilters;
  showSearch?: boolean;
};

const emptyFilters: StoreCatalogFilters = {
  query: "",
  brands: [],
  storages: [],
  conditions: [],
  accessoryTypes: [],
  inStockOnly: false,
};

const emptyFacets: StoreCatalogFacets = {
  brands: [],
  storages: [],
  conditions: [],
  accessoryTypes: [],
  inStock: 0,
  priceMin: 0,
  priceMax: 0,
};

export default async function StoreGrid({
  products,
  trendingProducts = [],
  lang,
  activeCategory = "all",
  sortBy = "featured",
  total = products.length,
  page = 1,
  pages = 1,
  counts,
  lockedCategory,
  facets = emptyFacets,
  activeFilters = emptyFilters,
  showSearch = true,
}: StoreGridProps) {
  const uniqueProducts = new Map([...products, ...trendingProducts].map((product) => [product.id, product] as const));
  const ratings = await getRatingSummaries(Array.from(uniqueProducts.keys()));
  const cardsById = new Map(Array.from(uniqueProducts.values()).map((product) => [
    product.id,
    toCatalogCardModel(product, lang, ratings[product.id]),
  ] as const));
  const localCounts: Record<StoreCatalogCategory, number> = counts ?? {
    all: products.length,
    smartphones: products.filter((product) => product.category === "smartphones").length,
    tablets: products.filter((product) => product.category === "tablets").length,
    accessories: products.filter((product) => product.category === "accessories").length,
    consoles: products.filter((product) => product.category === "consoles").length,
    laptops: products.filter((product) => product.category === "laptops").length,
    "open-box-smartphones-tablets": products.filter((product) =>
      (product.category === "smartphones" || product.category === "tablets") && product.condition !== "new",
    ).length,
  };

  return (
    <StoreCatalogClient
      products={products.map((product) => cardsById.get(product.id)!)}
      trendingProducts={trendingProducts.map((product) => cardsById.get(product.id)!).filter(Boolean)}
      lang={lang}
      activeCategory={activeCategory}
      sortBy={sortBy}
      total={total}
      page={page}
      pages={pages}
      counts={localCounts}
      lockedCategory={lockedCategory}
      facets={facets}
      activeFilters={activeFilters}
      showSearch={showSearch}
    />
  );
}
