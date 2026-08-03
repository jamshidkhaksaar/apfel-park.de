import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { createMetadata } from "@/lib/metadata";
import { getProductBySlug, getRelatedProducts } from "@/lib/products";
import { type Locale } from "@/lib/i18n";
import {
  merchantReturnPolicy,
  offerPriceValidUntil,
  offerShippingDetails,
  offerValidFrom,
  productConditionLabel,
  schemaItemCondition,
} from "@/lib/schema";
import { safeJsonStringify } from "@/lib/security";
import { siteInfo } from "@/lib/site";
import ProductViewTracker from "@/components/ProductViewTracker";
import ProductDetailExperience from "@/components/ProductDetailExperience";
import { requireLocale } from "@/lib/route-locale";
import { shouldBypassImageOptimization } from "@/lib/image";

export const dynamic = "force-dynamic";

const formatMoney = (lang: Locale, value: number) =>
  new Intl.NumberFormat(lang === "de" ? "de-DE" : "en-US", {
    style: "currency",
    currency: "EUR",
  }).format(value);

const compactText = (value: string, maxLength: number): string => {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) return normalized;
  const candidate = normalized.slice(0, maxLength + 1);
  const lastSpace = candidate.lastIndexOf(' ');
  const clipped = lastSpace >= Math.floor(maxLength * 0.65)
    ? candidate.slice(0, lastSpace)
    : normalized.slice(0, maxLength);
  return `${clipped.replace(/[\s,;:.-]+$/, '')}…`;
};

const productVariantLabel = (title: string, subtitle: string): string => {
  const parts = subtitle
    .split(/[·|]/)
    .map((part) => part.trim())
    .filter(Boolean);
  const titleKey = title.toLocaleLowerCase();
  return parts.find((part) => !titleKey.includes(part.toLocaleLowerCase())) || "";
};

const productReference = (sku: string | undefined, slug: string): string => {
  const compactSku = (sku || slug).replace(/[^a-z0-9]/gi, "").toUpperCase();
  return compactSku.slice(-6);
};

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> => {
  const { lang: rawLang, slug } = await params;
  const lang = requireLocale(rawLang);
  const locale = lang;
  const product = await getProductBySlug(slug, locale);
  if (!product) {
    return createMetadata(
      lang,
      lang === "de" ? "Produkt nicht gefunden" : "Product not found",
      lang === "de" ? "Dieses Produkt ist nicht verfügbar." : "This product is not available.",
      `/store/${slug}`,
    );
  }

  const conditionLabel = productConditionLabel(locale, product.condition);
  const price = formatMoney(locale, product.price);
  const variantLabel = productVariantLabel(product.title, product.subtitle);
  const reference = productReference(product.sku, product.slug);
  const titlePrefix = locale === "en" ? "Buy " : "";
  const titleSuffix = ` · ${reference}`;
  const seoProductName = product.title.replace(/^Apple (?=iPhone\b)/i, "");
  const descriptiveName = [product.title, variantLabel].filter(Boolean).join(" ");
  const descriptiveTitle = [seoProductName, variantLabel].filter(Boolean).join(" ");
  // The root layout adds " | Apfel Park"; keep the rendered title near 60 characters.
  const compactName = compactText(descriptiveTitle, Math.max(24, 46 - titlePrefix.length - titleSuffix.length));
  const seoTitle = `${titlePrefix}${compactName}${titleSuffix}`;
  const seoDescription = compactText(
    locale === "de"
      ? `${descriptiveName} für ${price}: ${conditionLabel}, geprüft, mit Garantie. Artikel ${reference}. Abholung in Hamburg oder Versand in Deutschland.`
      : `${descriptiveName} for ${price}: ${conditionLabel}, tested, with warranty. Item ${reference}. Hamburg pickup or shipping in Germany.`,
    155,
  );

  return createMetadata(
    lang,
    seoTitle,
    seoDescription,
    `/store/${slug}`,
    product.image,
  );
};

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang: rawLang, slug } = await params;
  const lang = requireLocale(rawLang);
  const locale = lang;
  const product = await getProductBySlug(slug, locale);

  if (!product) {
    notFound();
  }

  const relatedProducts = await getRelatedProducts(product, 4, locale);
  const gtinDigits = product.gtin?.replace(/\D/g, "");
  const categoryPath = product.category === "consoles" ? "gaming" : product.category;
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description || product.subtitle,
    image: product.images.map((image) => image.startsWith("http") ? image : `${siteInfo.url}${image}`),
    sku: product.sku,
    mpn: product.sku || product.model,
    ...(gtinDigits?.length === 8 ? { gtin8: gtinDigits } : {}),
    ...(gtinDigits?.length === 12 ? { gtin12: gtinDigits } : {}),
    ...(gtinDigits?.length === 13 ? { gtin13: gtinDigits } : {}),
    ...(gtinDigits?.length === 14 ? { gtin14: gtinDigits } : {}),
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: "EUR",
      price: product.price.toFixed(2),
      validFrom: offerValidFrom(product.createdAt),
      priceValidUntil: offerPriceValidUntil(),
      availability: product.stock && product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${siteInfo.url}/${locale}/store/${product.slug}`,
      itemCondition: schemaItemCondition(product.condition),
      seller: { "@type": "Organization", "@id": `${siteInfo.url}/#store` },
      hasMerchantReturnPolicy: merchantReturnPolicy(),
      shippingDetails: offerShippingDetails(),
    },
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: locale === "de" ? "Shop" : "Store", item: `${siteInfo.url}/${locale}/store` },
      { "@type": "ListItem", position: 2, name: product.category, item: `${siteInfo.url}/${locale}/${categoryPath}` },
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
                      unoptimized={shouldBypassImageOptimization(related.image)}
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
