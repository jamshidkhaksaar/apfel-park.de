import type { Metadata } from "next";
import IPhone18Showcase from "@/components/iphone-18/IPhone18Showcase";
import { createMetadata } from "@/lib/metadata";
import { requireLocale } from "@/lib/route-locale";
import { safeJsonStringify } from "@/lib/security";
import { siteInfo } from "@/lib/site";
import type { Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang: rawLang } = await params;
  const lang = requireLocale(rawLang);
  const locale = (lang === "en" ? "en" : "de") as Locale;

  const title =
    locale === "de"
      ? "iPhone Duo kaufen – Apples erstes Foldable | Apfel Park Hamburg"
      : "Buy iPhone Duo – Apple's First Foldable | Apfel Park Hamburg";

  const description =
    locale === "de"
      ? "Apple iPhone Duo (Foldable) mit 7.6 Zoll Innen-Display & 5.4 Zoll Cover. A20 Pro 2nm Chip, Titan-Scharnier & 5.400 mAh Akku. Jetzt bei Apfel Park Hamburg reservieren."
      : "Apple iPhone Duo foldable with 7.6 inch inner screen & 5.4 inch cover. 2nm A20 Pro silicon, Grade 5 titanium zero-gap hinge. Reserve at Apfel Park Hamburg.";

  return createMetadata(locale, title, description, "/iphone-duo", "/images/apple/duo-night.webp");
}

export default async function IphoneDuoPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang: rawLang } = await params;
  const lang = requireLocale(rawLang);
  const locale = (lang === "en" ? "en" : "de") as Locale;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: locale === "de" ? "Startseite" : "Home",
        item: `${siteInfo.url}/${locale}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: locale === "de" ? "Store" : "Store",
        item: `${siteInfo.url}/${locale}/store`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Apple iPhone Duo (Foldable)",
        item: `${siteInfo.url}/${locale}/iphone-duo`,
      },
    ],
  };

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Apple iPhone Duo (Foldable)",
    image: [
      `${siteInfo.url}/images/apple/duo-night.webp`,
      `${siteInfo.url}/images/apple/duo-white.webp`,
    ],
    description:
      locale === "de"
        ? "Apples erstes faltbares Smartphone. 7.6 Zoll LTPO OLED Innendisplay, 5.4 Zoll Cover Display, A20 Pro 2nm Chip und Grade 5 Titan Zero-Gap Scharnier."
        : "Apple's first foldable smartphone. 7.6-inch LTPO OLED inner display, 5.4-inch cover screen, 2nm A20 Pro silicon and Grade 5 titanium zero-gap hinge.",
    brand: {
      "@type": "Brand",
      name: "Apple",
    },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "EUR",
      lowPrice: "1799",
      highPrice: "2499",
      offerCount: "6",
      availability: "https://schema.org/PreOrder",
      seller: {
        "@type": "LocalBusiness",
        name: siteInfo.name,
        telephone: siteInfo.phoneE164,
        address: {
          "@type": "PostalAddress",
          streetAddress: siteInfo.address.street,
          addressLocality: siteInfo.address.city,
          postalCode: siteInfo.address.postalCode,
          addressCountry: "DE",
        },
      },
    },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: locale === "de" ? "Wann erscheint das iPhone Duo (Foldable) in Deutschland?" : "When will iPhone Duo release in Germany?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            locale === "de"
              ? "Das iPhone Duo wurde im September 2026 vorgestellt und ist ab Ende Oktober 2026 in Deutschland erhältlich. Vorbestellungen sind bei Apfel Park ab sofort möglich."
              : "iPhone Duo was unveiled in September 2026 and releases in Germany starting late October 2026. Priority reservations are open now at Apfel Park.",
        },
      },
      {
        "@type": "Question",
        name: locale === "de" ? "Hat das iPhone Duo einen sichtbaren Knick im Display?" : "Does iPhone Duo have a visible screen crease?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            locale === "de"
              ? "Apple nutzt ein neuartiges Grade 5 Titan Scharnier mit Zero-Gap Mechanismus und flexibler Nano-Texture Glasbeschichtung, wodurch der Übergang nahezu unsichtbar und nahtlos plan ist."
              : "Apple employs a Grade 5 titanium zero-gap hinge with flexible nano-texture glass coating, creating a virtually seamless, crease-free flat surface.",
        },
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonStringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonStringify(productSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonStringify(faqSchema) }} />

      <IPhone18Showcase locale={locale} initialModel="duo" />
    </>
  );
}
