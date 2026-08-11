import { NextResponse } from "next/server";

import { getProducts, type Product } from "@/lib/products";
import { siteInfo } from "@/lib/site";

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
  "gtin",
  "mpn",
  "google_product_category",
  "inventory",
  "address",
  "availability_circle_radius",
  "availability_circle_origin",
] as const;

const categoryMap: Record<Product["category"], string> = {
  smartphones: "Electronics > Communications > Telephony > Mobile Phones",
  tablets: "Electronics > Computers > Tablet Computers",
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
const getAvailabilityAddress = () =>
  `${siteInfo.address.street}, ${siteInfo.address.postalCode} ${siteInfo.address.city}, Germany`;

const productToRow = (product: Product): string[] => {
  const inventory = getInventory(product);

  return [
    product.id,
    product.title,
    getDescription(product),
    inventory > 0 ? "in stock" : "out of stock",
    product.condition,
    `${product.price.toFixed(2)} EUR`,
    `${siteInfo.url}/de/store/${product.slug}`,
    absoluteUrl(product.image),
    product.brand || siteInfo.name,
    product.gtin || "",
    product.mpn || "",
    categoryMap[product.category],
    inventory,
    getAvailabilityAddress(),
    "25 km",
    "53.5000,10.0000",
  ].map(csvEscape);
};

export const buildMetaCatalogCsv = async () => {
  const products = await getProducts();
  return [
    META_CATALOG_HEADERS.join(","),
    ...products.map((product) => productToRow(product).join(",")),
  ].join("\n");
};

export const createMetaCatalogResponse = async () =>
  new NextResponse(await buildMetaCatalogCsv(), {
    headers: {
      "Cache-Control": "public, max-age=900, s-maxage=900",
      "Content-Disposition": 'inline; filename="apfel-park-meta-catalog.csv"',
      "Content-Type": "text/csv; charset=utf-8",
    },
  });
