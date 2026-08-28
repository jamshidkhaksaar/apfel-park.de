import { NextResponse } from "next/server";

import type { Locale } from "@/lib/i18n";
import { getProducts, searchCatalogProducts } from "@/lib/products";

const isLocale = (value: string): value is Locale => value === "de" || value === "en";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const localeParam = params.get("lang") ?? "de";
  const query = (params.get("q") ?? "").trim();
  const requestedLimit = Number.parseInt(params.get("limit") ?? "8", 10);
  const limit = Math.min(8, Math.max(1, Number.isFinite(requestedLimit) ? requestedLimit : 8));

  if (!isLocale(localeParam)) {
    return NextResponse.json({ error: "Unsupported locale", code: "invalid_locale" }, { status: 400 });
  }
  if (query.length < 2 || query.length > 80) {
    return NextResponse.json({ error: "Query must contain 2 to 80 characters", code: "invalid_query" }, { status: 400 });
  }

  const matches = searchCatalogProducts(await getProducts(undefined, undefined, localeParam), query);
  const response = NextResponse.json({
    items: matches.slice(0, limit).map((product) => ({
      id: product.id,
      title: product.title,
      slug: product.slug,
      image: product.image,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      category: product.category,
      condition: product.condition,
      brand: product.brand,
      stock: Math.max(0, product.stock ?? 0),
    })),
    total: matches.length,
  });
  response.headers.set("Cache-Control", "public, max-age=30, stale-while-revalidate=60");
  return response;
}
