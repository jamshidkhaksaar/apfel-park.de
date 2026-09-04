import type { Metadata } from "next";
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
import RelatedProductsCarousel from "@/components/RelatedProductsCarousel";
import ProductProfessionalExperience from "@/components/ProductProfessionalExperience";
import { requireLocale } from "@/lib/route-locale";
import { validatedGtin } from "@/lib/product-identifiers";
import { PRODUCT_PAGE_CONTAINER_CLASS } from "@/lib/product-page-layout";
import { getProductExperienceView } from "@/lib/product-experience-repository";

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
  return parts.find((part) => {
    const normalized = part.replace(/\s+/g, " ").trim();
    return normalized.length <= 36
      && normalized.split(" ").length <= 6
      && !/[.!?]/.test(normalized)
      && !titleKey.includes(normalized.toLocaleLowerCase());
  }) || "";
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
    const currentSlug = await getCurrentSlugForOldSlug(slug);
    if (currentSlug) {
      permanentRedirect(`/${locale}/store/${currentSlug}`);
    }
    // Throw during metadata resolution so Next can send a genuine 404 before
    // the dynamic page starts streaming. Next also adds robots noindex here.
    notFound();
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
  const titleCondition = product.condition === "used"
    ? locale === "de" ? "Gebraucht" : "Used"
    : product.condition === "open_box"
      ? "Open Box"
      : "";
  const descriptiveTitle = [seoProductName, titleCondition].filter(Boolean).join(" ");
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

  const [relatedProducts, reviews, ratingSummary, experience] = await Promise.all([
    getRelatedProducts(product, 4, locale),
    getApprovedReviews(product.id),
    getRatingSummary(product.id),
    getProductExperienceView(product.id, locale),
  ]);
  const isOutOfStock = (product.stock ?? 0) <= 0;
  const fulfillmentFaqPattern = /abhol|versand|liefer|pickup|shipping|deliver/i;
  const displayFaq = isOutOfStock
    ? product.faq.map((entry) =>
        fulfillmentFaqPattern.test(`${entry.question} ${entry.answer}`)
          ? {
              ...entry,
              answer: locale === "de"
                ? "Dieses Produkt ist derzeit ausverkauft. Abholung und Versand sind erst wieder möglich, wenn es im Shop als verfügbar angezeigt wird."
                : "This product is currently out of stock. Pickup and shipping resume only after the store shows it as available.",
            }
          : entry,
      )
    : product.faq;
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
                shippingDetails: stock && stock > 0 ? offerShippingDetails() : undefined,
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
            shippingDetails: isOutOfStock ? undefined : offerShippingDetails(),
          },
        }),
  };

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
    <div className="bg-store-ground pb-[calc(9rem+env(safe-area-inset-bottom))] md:pb-0">
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
      <section className="py-5 md:py-10">
        <div className={PRODUCT_PAGE_CONTAINER_CLASS}>
          <div className="mb-4 flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted md:mb-6">
            <Link href={`/${locale}/store`} className="transition hover:text-gold">
              {locale === "de" ? "Shop" : "Store"}
            </Link>
            <span>/</span>
            <Link href={`/${locale}/${categoryPath}`} className="transition hover:text-gold">
              {productCategoryLabel(locale, product.category)}
            </Link>
            <span className="hidden md:inline">/</span>
            <span className="hidden text-foreground md:inline">{product.title}</span>
          </div>

          <ProductDetailExperience
            locale={locale}
            product={{ ...product, faq: displayFaq }}
            ratingSummary={ratingSummary}
            initialVariantToken={typeof invitation.variant === "string" ? invitation.variant : undefined}
            experience={experience}
          />

      <section className="pb-4">
        <ProductReviews
          locale={locale}
          productId={product.id}
          reviews={reviews}
          summary={ratingSummary}
          orderId={typeof invitation.order === "string" ? invitation.order : null}
          token={typeof invitation.rt === "string" ? invitation.rt : null}
        />
      </section>
      <ProductProfessionalExperience
        locale={locale}
        profile={experience.profile}
        comparisons={experience.comparisons}
        bundles={experience.bundles}
        current={{
          id: product.id,
          slug: product.slug,
          title: product.title,
          image: product.image,
          price: product.price,
          stock: product.stock ?? 0,
          condition: product.condition,
          dimensions: experience.profile.dimensions,
        }}
      />
        </div>
      </section>

      {relatedProducts.length > 0 ? (
        <section className="border-t border-border py-10 md:py-14">
          <div className="container-page">
            <RelatedProductsCarousel
              locale={locale}
              products={relatedProducts.map((related) => ({
                id: related.id,
                slug: related.slug,
                title: related.title,
                image: related.image,
                price: related.price,
                metaLabel: [
                  related.subcategory && related.subcategory !== related.category
                    ? subcategoryLabel(related.subcategory, locale)
                    : null,
                  related.condition !== "new"
                    ? related.condition === "used"
                      ? locale === "de" ? "Gebraucht A+" : "Used A+"
                      : "Open-Box"
                    : null,
                ].filter(Boolean).join(" · "),
              }))}
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}
