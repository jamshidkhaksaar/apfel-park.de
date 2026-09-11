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
      ? "iPhone 18 Pro, Pro Max & iPhone Duo kaufen | Apfel Park Hamburg"
      : "Buy iPhone 18 Pro, Pro Max & iPhone Duo | Apfel Park Hamburg";

  const description =
    locale === "de"
      ? "Apple iPhone 18 Pro, 18 Pro Max und iPhone Duo (Foldable) bei Apfel Park. 2nm A20 Pro Chip, 48MP Pro Fusion Kamera, technische Daten, Vorbestellung & Angebote in Hamburg."
      : "Apple iPhone 18 Pro, 18 Pro Max and iPhone Duo (Foldable) at Apfel Park. 2nm A20 Pro silicon, 48MP variable camera, full specs, pre-orders & quotes in Hamburg.";

  return createMetadata(locale, title, description, "/iphone-18-pro", "/images/apple/pro-lineup.webp");
}

export default async function Iphone18ProPage({
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
        name: locale === "de" ? "Shop" : "Store",
        item: `${siteInfo.url}/${locale}/store`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Apple iPhone 18 Pro & iPhone Duo",
        item: `${siteInfo.url}/${locale}/iphone-18-pro`,
      },
    ],
  };

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Apple iPhone 18 Pro & iPhone Duo Lineup",
    image: [
      `${siteInfo.url}/images/apple/pro-lineup.webp`,
      `${siteInfo.url}/images/apple/pro-front-back.webp`,
      `${siteInfo.url}/images/apple/duo-night.webp`,
    ],
    description:
      locale === "de"
        ? "Apple iPhone 18 Pro, Pro Max und iPhone Duo mit A20 Pro 2nm Chip, 48MP variabler Kamera und Titan-Gehäuse."
        : "Apple iPhone 18 Pro, Pro Max and iPhone Duo with A20 Pro 2nm silicon, 48MP variable camera and titanium build.",
    brand: {
      "@type": "Brand",
      name: "Apple",
    },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "EUR",
      lowPrice: "1199",
      highPrice: "2499",
      offerCount: "12",
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
        name: locale === "de" ? "Wann sind iPhone 18 Pro und iPhone Duo erhältlich?" : "When are iPhone 18 Pro and iPhone Duo available?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            locale === "de"
              ? "Das iPhone 18 Pro und Pro Max wurden am 9. September 2026 vorgestellt. Vorbestellungen bei Apfel Park sind ab sofort möglich. Das iPhone Duo erscheint ab Ende Oktober 2026."
              : "iPhone 18 Pro and Pro Max were announced on September 9, 2026. Pre-orders are open now at Apfel Park. The iPhone Duo launches in late October 2026.",
        },
      },
      {
        "@type": "Question",
        name: locale === "de" ? "Sind die Geräte vertragsfrei (ohne SIM-Lock)?" : "Are the devices unlocked without contract?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            locale === "de"
              ? "Ja, alle bei Apfel Park angebotenen iPhones sind zu 100% vertragsfrei und ohne SIM-Lock."
              : "Yes, all iPhones sold by Apfel Park are 100% contract-free and factory unlocked.",
        },
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonStringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonStringify(productSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonStringify(faqSchema) }} />

      <IPhone18Showcase locale={locale} initialModel="pro" />
    </>
  );
}
