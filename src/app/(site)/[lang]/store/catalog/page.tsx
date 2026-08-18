import type { Metadata } from "next";
import Link from "next/link";

import { formatPrice } from "@/lib/format";
import { type Locale } from "@/lib/i18n";
import { createMetadata } from "@/lib/metadata";
import { getProducts, type ProductCategory } from "@/lib/products";
import { productConditionLabel } from "@/lib/schema";
import { requireLocale } from "@/lib/route-locale";

export const dynamic = "force-dynamic";

const categoryOrder: ProductCategory[] = ["smartphones", "tablets", "laptops", "accessories", "consoles"];

const categoryName = (category: ProductCategory, locale: Locale) => {
  const labels: Record<ProductCategory, { de: string; en: string }> = {
    smartphones: { de: "Smartphones", en: "Smartphones" },
    tablets: { de: "Tablets", en: "Tablets" },
    laptops: { de: "Laptops", en: "Laptops" },
    accessories: { de: "Zubehör", en: "Accessories" },
    consoles: { de: "Konsolen", en: "Consoles" },
  };
  return labels[category][locale];
};

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang: rawLang } = await params;
  const lang = requireLocale(rawLang);
  const locale = lang;
  return createMetadata(
    locale,
    locale === "de" ? "Alle Produkte A–Z" : "All Products A–Z",
    locale === "de"
      ? "Der vollständige Apfel Park Produktkatalog mit Smartphones, iPhones, Tablets und Zubehör."
      : "The complete Apfel Park catalog of smartphones, iPhones, tablets and accessories.",
    "/store/catalog",
  );
}

export default async function ProductCatalogPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: rawLang } = await params;
  const lang = requireLocale(rawLang);
  const locale = lang;
  const products = (await getProducts(undefined, undefined, locale)).sort((a, b) =>
    a.title.localeCompare(b.title, locale === "de" ? "de-DE" : "en-US"),
  );

  return (
    <main className="section-pad bg-background">
      <div className="container-page">
        <nav className="mb-6 text-sm text-muted" aria-label={locale === "de" ? "Brotkrumen" : "Breadcrumb"}>
          <Link href={`/${locale}/store`} className="transition hover:text-gold">
            {locale === "de" ? "Online Shop" : "Online Store"}
          </Link>
          <span aria-hidden="true"> / </span>
          <span className="text-foreground">{locale === "de" ? "Alle Produkte A–Z" : "All Products A–Z"}</span>
        </nav>

        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
            {locale === "de" ? "Vollständiger Katalog" : "Complete catalog"}
          </p>
          <h1 className="mt-3 text-3xl font-bold text-foreground md:text-5xl">
            {locale === "de" ? "Alle Produkte A–Z" : "All Products A–Z"}
          </h1>
          <p className="mt-4 leading-relaxed text-muted">
            {locale === "de"
              ? `${products.length} Produkte mit direktem Link zu Preis, Zustand und Verfügbarkeit.`
              : `${products.length} products with direct links to price, condition and availability.`}
          </p>
        </div>

        <div className="mt-10 space-y-10">
          {categoryOrder.map((category) => {
            const categoryProducts = products.filter((product) => product.category === category);
            if (categoryProducts.length === 0) return null;
            return (
              <section key={category} aria-labelledby={`catalog-${category}`}>
                <div className="mb-4 flex items-baseline justify-between gap-4 border-b border-border/60 pb-3">
                  <h2 id={`catalog-${category}`} className="text-2xl font-bold text-foreground">
                    {categoryName(category, locale)}
                  </h2>
                  <span className="text-sm text-muted">{categoryProducts.length}</span>
                </div>
                <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {categoryProducts.map((product) => (
                    <li key={product.id}>
                      <Link
                        href={`/${locale}/store/${product.slug}`}
                        className="flex h-full items-start justify-between gap-4 rounded-2xl border border-border/60 bg-surface/40 p-4 transition hover:border-gold/40 hover:bg-gold/5"
                      >
                        <span>
                          <span className="block font-semibold text-foreground">{product.title}</span>
                          <span className="mt-1 block text-xs text-muted">
                            {[product.subtitle, productConditionLabel(locale, product.condition)].filter(Boolean).join(" · ")}
                          </span>
                        </span>
                        <span className="shrink-0 text-sm font-semibold text-gold">{formatPrice(locale, product.price)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}
