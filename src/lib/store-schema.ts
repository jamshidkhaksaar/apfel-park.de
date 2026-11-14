/**
 * Structured data for catalog listing pages (`/store` and the category pages).
 *
 * The accessory landing pages (`[subcategory]`) already emit CollectionPage +
 * ItemList + BreadcrumbList; the much larger `/store` and category pages
 * emitted nothing, so Google saw only a bare page with no idea how many items
 * it held or how they relate to the rest of the site.
 *
 * Only the Product pages are bigger drivers of traffic than these listings, so
 * they should not be the one kind of page without schema.
 */

import type { Locale } from "@/lib/i18n";
import type { ProductCondition } from "@/lib/products";
import {
  offerDeliveryMethods,
  schemaAvailability,
  schemaItemCondition,
} from "@/lib/schema";
import { siteInfo } from "@/lib/site";

export type CatalogSchemaProduct = {
  title: string;
  slug: string;
  description?: string;
  subtitle?: string;
  image?: string;
  images?: string[];
  brand?: string;
  sku?: string;
  price?: number | string;
  stock?: number | null;
  condition?: ProductCondition;
};

export type CatalogSchemaOptions = {
  lang: Locale;
  /** Human-readable name for the collection (e.g. "Smartphones"). */
  name: string;
  /** Optional short description, mirrored from the page intro. */
  description?: string;
  /** Absolute URL of the listing page. */
  url: string;
  /** The catalog row that drove the page (total + current page). */
  catalog: { total: number; page: number };
  /** The products on the current page, in render order. */
  products: CatalogSchemaProduct[];
  /** Label + absolute URL of the parent section, for the breadcrumb tail. */
  parent?: { name: string; url: string };
};

/**
 * Builds the CollectionPage + ItemList object. The list describes exactly the
 * products rendered on this page, so numberOfItems and positions restart at 1
 * on every paginated view; `catalog.total` only drives the page's own copy.
 */
export const buildCollectionPageSchema = ({
  lang,
  name,
  description,
  url,
  products,
}: CatalogSchemaOptions) => ({
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name,
  ...(description ? { description } : {}),
  url,
      mainEntity: {
    "@type": "ItemList",
    numberOfItems: products.length,
    itemListElement: products.map((product, index) => {
      const productUrl = `${siteInfo.url}/${lang}/store/${product.slug}`;
      const productImage = product.image ?? product.images?.[0];
      const price = typeof product.price === 'string' ? Number(product.price) : product.price;
      return {
        "@type": "ListItem",
        position: index + 1,
        url: productUrl,
        item: {
          "@type": "Product",
          "@id": productUrl,
          name: product.title,
          ...(product.description || product.subtitle ? { description: product.description || product.subtitle } : {}),
          url: productUrl,
          ...(productImage ? { image: productImage.startsWith('http') ? productImage : `${siteInfo.url}${productImage.startsWith('/') ? productImage : `/${productImage}`}` } : {}),
          ...(product.sku ? { sku: product.sku } : {}),
          ...(product.brand ? { brand: { "@type": "Brand", name: product.brand } } : {}),
          offers: {
            "@type": "Offer",
            url: productUrl,
            priceCurrency: "EUR",
            price: Number.isFinite(price) ? price : 0,
            itemCondition: schemaItemCondition(product.condition ?? "new"),
            availability: schemaAvailability(product.stock ?? 0),
            seller: { "@id": `${siteInfo.url}/#store` },
            availableDeliveryMethod: offerDeliveryMethods,
          },
        },
      };
    }),
  },
});

/**
 * Builds the Home → section → page breadcrumb. `parent` is the intermediate
 * section (e.g. Zubehör → Hüllen); when omitted the breadcrumb is just
 * Home → page.
 */
export const buildListingBreadcrumbSchema = ({
  lang,
  url,
  name,
  parent,
}: CatalogSchemaOptions) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: lang === "de" ? "Startseite" : "Home",
      item: `${siteInfo.url}/${lang}`,
    },
    ...(parent
      ? [{ "@type": "ListItem", position: 2, name: parent.name, item: parent.url }]
      : []),
    {
      "@type": "ListItem",
      position: parent ? 3 : 2,
      name,
      item: url,
    },
  ],
});
