import { NextResponse } from "next/server";

import { getProducts, type Product } from "@/lib/products";
import { siteInfo } from "@/lib/site";

export const dynamic = "force-dynamic";

const META_CATALOG_HEADERS = [
  "id",
  "title",
  "description",
  "availability",
  "condition",
  "price",
  "link",
  "image_link",
  "brand",
  "mpn",
  "google_product_category",
  "inventory",
] as const;

const categoryMap: Record<Product["category"], string> = {
  smartphones: "Electronics > Communications > Telephony > Mobile Phones",
  accessories: "Electronics > Electronics Accessories",
  consoles: "Electronics > Video Game Consoles",
  laptops: "Electronics > Computers > Laptops",
};

const csvEscape = (value: string | number): string => {
  const text = String(value).replace(/\r?\n|\r/g, " ").trim();
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

const absoluteUrl = (value: string): string => {
  if (/^https?:\/\//i.test(value)) return value;
  return new URL(value.startsWith("/") ? value : `/${value}`, siteInfo.url).toString();
};

const getDescription = (product: Product): string =>
  product.description ||
  product.subtitle ||
  product.featureBullets.join(" ") ||
  `${product.title} bei ${siteInfo.name} in Hamburg.`;

const getInventory = (product: Product): number => Math.max(0, Math.floor(product.stock ?? 1));

const productToRow = (product: Product): string[] => {
  const inventory = getInventory(product);
  const sku = product.sku || product.id;

  return [
    sku,
    product.title,
    getDescription(product),
    inventory > 0 ? "in stock" : "out of stock",
    "new",
    `${product.price.toFixed(2)} EUR`,
    `${siteInfo.url}/de/store/${product.slug}`,
    absoluteUrl(product.image),
    product.brand || siteInfo.name,
    product.model || sku,
    categoryMap[product.category],
    inventory,
  ].map(csvEscape);
};

export async function GET() {
  const products = await getProducts();
  const rows = [
    META_CATALOG_HEADERS.join(","),
    ...products.map((product) => productToRow(product).join(",")),
  ];

  return new NextResponse(rows.join("\n"), {
    headers: {
      "Cache-Control": "public, max-age=900, s-maxage=900",
      "Content-Disposition": 'inline; filename="apfel-park-meta-catalog.csv"',
      "Content-Type": "text/csv; charset=utf-8",
    },
  });
}
