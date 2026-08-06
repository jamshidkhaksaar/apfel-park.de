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
import { siteInfo } from "@/lib/site";

export type CatalogSchemaProduct = {
  title: string;
  slug: string;
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
 * Builds the CollectionPage + ItemList object. Positions are absolute across
 * pagination, so an item on page 2 at index 0 is position 25.
 */
export const buildCollectionPageSchema = ({
  lang,
  name,
  description,
  url,
  catalog,
  products,
}: CatalogSchemaOptions) => ({
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name,
  ...(description ? { description } : {}),
  url,
  mainEntity: {
    "@type": "ItemList",
    numberOfItems: catalog.total,
    itemListElement: products.map((product, index) => ({
      "@type": "ListItem",
      position: (catalog.page - 1) * 24 + index + 1,
      name: product.title,
      url: `${siteInfo.url}/${lang}/store/${product.slug}`,
    })),
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
