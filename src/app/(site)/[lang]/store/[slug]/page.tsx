import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";

import { createMetadata } from "@/lib/metadata";
import { getProductBySlug, getCurrentSlugForOldSlug, getRelatedProducts } from "@/lib/products";
import { subcategoryLabel } from "@/lib/product-subcategory";
import ProductReviews from "@/components/ProductReviews";
import { getApprovedReviews, getRatingSummary } from "@/lib/product-reviews";
import { type Locale } from "@/lib/i18n";
import {
  merchantReturnPolicy,
  offerPriceValidUntil,
  offerShippingDetails,
  offerValidFrom,
  productCategoryLabel,
  productConditionLabel,
  schemaItemCondition,
} from "@/lib/schema";
import { safeJsonStringify } from "@/lib/security";
import { siteInfo } from "@/lib/site";
import ProductViewTracker from "@/components/ProductViewTracker";
import ProductDetailExperience from "@/components/ProductDetailExperience";
import { requireLocale } from "@/lib/route-locale";
import { shouldBypassImageOptimization } from "@/lib/image";
import { validatedGtin } from "@/lib/product-identifiers";

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

const gtinProperties = (value: string | undefined) => {
  const digits = validatedGtin(value);
  if (digits?.length === 8) return { gtin8: digits };
  if (digits?.length === 12) return { gtin12: digits };
  if (digits?.length === 13) return { gtin13: digits };
  if (digits?.length === 14) return { gtin14: digits };
  return {};
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
  // The SKU fragment (" · 7PM256") wasted title budget and meant nothing to searchers.
  const titleSuffix = "";
  const seoProductName = product.title.replace(/^Apple (?=iPhone\b)/i, "");
  const descriptiveName = [product.title, variantLabel].filter(Boolean).join(" ");
  const descriptiveTitle = [seoProductName, variantLabel].filter(Boolean).join(" ");
  // The root layout adds " | Apfel Park"; keep the rendered title near 60 characters.
  const compactName = compactText(descriptiveTitle, Math.max(24, 46 - titlePrefix.length - titleSuffix.length));
  const seoTitle = `${titlePrefix}${compactName}${titleSuffix}`;
  const seoDescription = compactText(
    (product.stock ?? 0) <= 0
      ? locale === "de"
        ? `${descriptiveName}: derzeit ausverkauft. ${conditionLabel}, geprüft, mit Garantie. Artikeldetails und Verfügbarkeit bei Apfel Park Hamburg.`
        : `${descriptiveName}: currently out of stock. ${conditionLabel}, tested, with warranty. Product details and availability from Apfel Park Hamburg.`
      : locale === "de"
        ? `${descriptiveName} für ${price}: ${conditionLabel}, geprüft, mit Garantie. Artikel ${reference}. Abholung in Hamburg oder Versand in Deutschland.`
        : `${descriptiveName} for ${price}: ${conditionLabel}, tested, with warranty. Item ${reference}. Hamburg pickup or shipping in Germany.`,
    155,
  );

  // No og:type=product here: Next's `other` emits name= attributes, but the
  // OpenGraph product namespace needs property=, so the tags were inert and
  // og:type ended up declared twice with conflicting values. Price, condition
  // and availability already reach Google through the Product JSON-LD below.
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
  searchParams,
}: {
  params: Promise<{ lang: string; slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { lang: rawLang, slug } = await params;
  // A post-purchase invitation arrives as ?order=<id>&rt=<token>.
  const invitation = (await searchParams) ?? {};
  const lang = requireLocale(rawLang);
  const locale = lang;
  const product = await getProductBySlug(slug, locale);

  if (!product) {
    const currentSlug = await getCurrentSlugForOldSlug(slug);
    if (currentSlug) {
      // 308, not 307: redirect() is a TEMPORARY redirect, which leaves the old
      // URL indexed and does not consolidate link equity onto the new slug --
      // the whole point of keeping slug history. Same trap as src/app/page.tsx.
      permanentRedirect(`/${locale}/store/${currentSlug}`);
    }
    notFound();
  }

  const [relatedProducts, reviews, ratingSummary] = await Promise.all([
    getRelatedProducts(product, 4, locale),
    getApprovedReviews(product.id),
    getRatingSummary(product.id),
  ]);
  const categoryPath = product.category === "consoles" ? "gaming" : product.category;
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": product.variants.length > 0 ? "ProductGroup" : "Product",
    name: product.title,
    description: product.description || product.subtitle,
    url: `${siteInfo.url}/${locale}/store/${product.slug}`,
    image: product.images.map((image) => image.startsWith("http") ? image : `${siteInfo.url}${image}`),
    sku: product.variants.length > 0 ? undefined : product.sku,
    mpn: product.variants.length > 0 ? undefined : product.mpn,
    ...(product.variants.length > 0 ? {} : gtinProperties(product.gtin)),
    ...(product.variants.length > 0 ? { productGroupID: product.id } : {}),
    category: productCategoryLabel(locale, product.category),
    ...(product.model ? { model: product.model } : {}),
    ...(product.specs.length > 0
      ? {
          additionalProperty: product.specs.map((spec) => ({
            "@type": "PropertyValue",
            name: spec.label,
            value: spec.value,
          })),
        }
      : {}),
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    aggregateRating: ratingSummary
      ? {
          "@type": "AggregateRating",
          ratingValue: ratingSummary.average,
          reviewCount: ratingSummary.count,
          bestRating: 5,
          worstRating: 1,
        }
      : undefined,
    manufacturer: product.gpsr?.manufacturer
      ? { "@type": "Organization", name: product.gpsr.manufacturer.name }
      : undefined,
    hasCertification: product.eprelId
      ? {
          "@type": "Certification",
          issuedBy: { "@type": "Organization", name: "European_Commission" },
          name: "EPREL",
          certificationIdentification: product.eprelId,
        }
      : undefined,
    hasEnergyConsumptionDetails:
      product.energyLabel?.efficiencyClass && /^[A-G]$/.test(product.energyLabel.efficiencyClass)
        ? {
            "@type": "EnergyConsumptionDetails",
            hasEnergyEfficiencyCategory: `https://schema.org/EUEnergyEfficiencyCategory${product.energyLabel.efficiencyClass}`,
          }
        : undefined,
    ...(product.variants.length > 0
      ? {
          variesBy: product.variants.some((variant) => Boolean(variant.color))
            ? ["https://schema.org/color"]
            : undefined,
          hasVariant: product.variants.map((variant, index) => {
            const variantToken = variant.sku || `${variant.color} ${variant.storage}`.trim();
            const price = variant.price ?? product.price;
            const stock = variant.stock ?? product.stock;
            const image = variant.images?.[0] ||
              (variant.imageIndex !== undefined ? product.images[variant.imageIndex] : undefined) ||
              product.image;
            return {
              "@type": "Product",
              "@id": `${siteInfo.url}/${locale}/store/${product.slug}#variant-${index + 1}`,
              name: [product.title, variant.color, variant.storage].filter(Boolean).join(" "),
              description: [product.description || product.subtitle, variant.color, variant.storage].filter(Boolean).join(" · "),
              sku: variant.sku,
              mpn: variant.mpn,
              ...gtinProperties(variant.gtin),
              color: variant.color,
              additionalProperty: variant.storage
                ? [{ "@type": "PropertyValue", name: "storage", value: variant.storage }]
                : undefined,
              image: image.startsWith("http") ? image : `${siteInfo.url}${image}`,
              offers: {
                "@type": "Offer",
                priceCurrency: "EUR",
                price,
                validFrom: offerValidFrom(product.createdAt),
                priceValidUntil: offerPriceValidUntil(),
                availability: stock && stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                url: `${siteInfo.url}/${locale}/store/${product.slug}?variant=${encodeURIComponent(variantToken)}`,
                itemCondition: schemaItemCondition(product.condition),
                seller: { "@type": "Organization", "@id": `${siteInfo.url}/#store` },
                hasMerchantReturnPolicy: merchantReturnPolicy(),
                shippingDetails: offerShippingDetails(),
              },
            };
          }),
        }
      : {
          offers: {
            "@type": "Offer",
            priceCurrency: "EUR",
            price: product.price,
            validFrom: offerValidFrom(product.createdAt),
            priceValidUntil: offerPriceValidUntil(),
            availability: product.stock && product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            url: `${siteInfo.url}/${locale}/store/${product.slug}`,
            itemCondition: schemaItemCondition(product.condition),
            seller: { "@type": "Organization", "@id": `${siteInfo.url}/#store` },
            hasMerchantReturnPolicy: merchantReturnPolicy(),
            shippingDetails: offerShippingDetails(),
          },
        }),
  };
  const faqJsonLd =
    product.faq.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: product.faq.map((entry) => ({
            "@type": "Question",
            name: entry.question,
            acceptedAnswer: { "@type": "Answer", text: entry.answer },
          })),
        }
      : null;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: locale === "de" ? "Shop" : "Store", item: `${siteInfo.url}/${locale}/store` },
      { "@type": "ListItem", position: 2, name: productCategoryLabel(locale, product.category), item: `${siteInfo.url}/${locale}/${categoryPath}` },
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
      {faqJsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonStringify(faqJsonLd) }}
        />
      ) : null}
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
            <Link href={`/${locale}/${categoryPath}`} className="transition hover:text-gold">
              {productCategoryLabel(locale, product.category)}
            </Link>
            <span>/</span>
            <span className="text-foreground">{product.title}</span>
          </div>

          <ProductDetailExperience
            locale={locale}
            product={product}
            ratingSummary={ratingSummary}
            initialVariantToken={typeof invitation.variant === "string" ? invitation.variant : undefined}
          />

      <section className="container-page pb-4">
        <ProductReviews
          locale={locale}
          productId={product.id}
          reviews={reviews}
          summary={ratingSummary}
          orderId={typeof invitation.order === "string" ? invitation.order : null}
          token={typeof invitation.rt === "string" ? invitation.rt : null}
        />
      </section>
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
                    {(() => {
                      const tags = [
                        related.subcategory && related.subcategory !== related.category
                          ? subcategoryLabel(related.subcategory, locale)
                          : null,
                        related.condition !== "new"
                          ? related.condition === "used"
                            ? locale === "de" ? "Gebraucht A+" : "Used A+"
                            : "Open-Box"
                          : null,
                      ].filter(Boolean);
                      return tags.length > 0 ? <p className="mt-1 text-xs text-muted">{tags.join(" · ")}</p> : null;
                    })()}
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
