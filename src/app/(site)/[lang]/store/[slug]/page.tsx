import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { createMetadata } from "@/lib/metadata";
import { getProductBySlug, getRelatedProducts } from "@/lib/products";
import { type Locale } from "@/lib/i18n";
import { safeJsonStringify } from "@/lib/security";
import { siteInfo } from "@/lib/site";
import ProductViewTracker from "@/components/ProductViewTracker";
import ProductDetailExperience from "@/components/ProductDetailExperience";

export const dynamic = "force-dynamic";

const formatMoney = (lang: Locale, value: number) =>
  new Intl.NumberFormat(lang === "de" ? "de-DE" : "en-US", {
    style: "currency",
    currency: "EUR",
  }).format(value);

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> => {
  const { lang, slug } = await params;
  const locale = lang as Locale;
  const product = await getProductBySlug(slug, locale);
  if (!product) {
    return createMetadata(
      lang as Locale,
      lang === "de" ? "Produkt nicht gefunden" : "Product not found",
      lang === "de" ? "Dieses Produkt ist nicht verfügbar." : "This product is not available.",
      `/store/${slug}`,
    );
  }

  return createMetadata(
    lang as Locale,
    product.title,
    product.description || product.subtitle,
    `/store/${slug}`,
    product.image,
  );
};

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  const locale = lang as Locale;
  const product = await getProductBySlug(slug, locale);

  if (!product) {
    notFound();
  }

  const relatedProducts = await getRelatedProducts(product, 4, locale);
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description || product.subtitle,
    image: product.images.map((image) => image.startsWith("http") ? image : `${siteInfo.url}${image}`),
    sku: product.sku,
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: "EUR",
      price: product.price.toFixed(2),
      availability: product.stock && product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/LimitedAvailability",
      url: `${siteInfo.url}/${locale}/store/${product.slug}`,
      itemCondition: "https://schema.org/NewCondition",
    },
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: locale === "de" ? "Shop" : "Store", item: `${siteInfo.url}/${locale}/store` },
      { "@type": "ListItem", position: 2, name: product.category, item: `${siteInfo.url}/${locale}/store?category=${product.category}` },
      { "@type": "ListItem", position: 3, name: product.title, item: `${siteInfo.url}/${locale}/store/${product.slug}` },
    ],
  };
  return (
    <div className="bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonStringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonStringify(breadcrumbJsonLd) }}
      />
      <ProductViewTracker
        productId={product.id}
        title={product.title}
        category={product.category}
        condition={product.condition}
        price={product.price}
        locale={locale}
        slug={product.slug}
      />
      <section className="section-pad">
        <div className="container-page">
          <div className="mb-6 flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted">
            <Link href={`/${locale}/store`} className="transition hover:text-gold">
              {locale === "de" ? "Shop" : "Store"}
            </Link>
            <span>/</span>
            <span>{product.category}</span>
            <span>/</span>
            <span className="text-foreground">{product.title}</span>
          </div>

          <ProductDetailExperience locale={locale} product={product} />
        </div>
      </section>

      {relatedProducts.length > 0 ? (
        <section className="section-pad border-t border-border/60 bg-surface/30">
          <div className="container-page">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
                  {locale === "de" ? "Empfehlungen" : "Recommended"}
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-foreground">
                  {locale === "de" ? "Ähnliche Produkte" : "Related products"}
                </h2>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {relatedProducts.map((related) => (
                <Link key={related.id} href={`/${locale}/store/${related.slug}`} className="group overflow-hidden rounded-3xl border border-border/60 bg-surface/60 transition hover:-translate-y-1 hover:border-gold/30">
                  <div className="relative aspect-[4/3] overflow-hidden bg-[#f5f5f5]">
                    <Image
                      src={related.image}
                      alt={related.title}
                      fill
                      sizes="(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw"
                      className="object-contain p-5 transition duration-500 group-hover:scale-105"
                      unoptimized={related.image.startsWith("/uploads/")}
                    />
                  </div>
                  <div className="p-5">
                    <p className="text-sm font-semibold text-foreground">{related.title}</p>
                    <p className="mt-2 text-sm text-muted">{formatMoney(locale, related.price)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
