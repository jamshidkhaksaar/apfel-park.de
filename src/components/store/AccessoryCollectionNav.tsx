import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { accessoryCollectionLinks } from "@/lib/accessory-collection-links";
import { getProducts } from "@/lib/products";

export default async function AccessoryCollectionNav({ lang, currentSlug }: { lang: Locale; currentSlug?: string }) {
  // Same request-memoized catalog read as StoreGrid; no per-category query or
  // client-side catalog payload is needed for these links.
  const links = accessoryCollectionLinks(await getProducts(undefined, undefined, lang), lang, currentSlug);
  if (links.length === 0) return null;

  return (
    <nav className="container-page min-w-0 py-4" aria-label={lang === "de" ? "Zubehör-Kategorien" : "Accessory categories"}>
      <p className="mb-2 text-xs font-semibold text-muted">{lang === "de" ? "Nach Kategorie stöbern" : "Browse by category"}</p>
      <ul className="flex max-w-full gap-2 overflow-x-auto px-1 py-1 sm:flex-wrap">
        {links.map(link => (
          <li key={link.slug} className="shrink-0">
            <Link href={link.href} data-accessory-collection-link={link.slug}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold">
              <span>{link.title}</span>
              <span className="shrink-0 rounded-full bg-surface px-2 py-0.5 text-xs text-muted">
                {link.count} {lang === "de" ? "Artikel" : link.count === 1 ? "item" : "items"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
