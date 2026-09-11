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
      ? "iPhone 18 Pro Max kaufen – 6.9 Zoll Flaggschiff | Apfel Park Hamburg"
      : "Buy iPhone 18 Pro Max – 6.9 Inch Flagship | Apfel Park Hamburg";

  const description =
    locale === "de"
      ? "iPhone 18 Pro Max mit 6,9 Zoll Super Retina XDR OLED, A20 Pro 2nm Chip und variabler 48MP Kamera. Vorbestellung bei Apfel Park Hamburg."
      : "iPhone 18 Pro Max with 6.9-inch Super Retina XDR OLED, 2nm A20 Pro chip and variable 48MP camera. Pre-order at Apfel Park Hamburg.";

  return createMetadata(locale, title, description, "/iphone-18-pro-max", "/images/apple/pro-front-back.webp");
}

export default async function Iphone18ProMaxPage({
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
        name: "Apple iPhone 18 Pro Max",
        item: `${siteInfo.url}/${locale}/iphone-18-pro-max`,
      },
    ],
  };

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Apple iPhone 18 Pro Max",
    image: [
      `${siteInfo.url}/images/apple/pro-front-back.webp`,
      `${siteInfo.url}/images/apple/pro-lineup.webp`,
    ],
    description:
      locale === "de"
        ? "Apple iPhone 18 Pro Max mit 6.9 Zoll Super Retina XDR OLED Display, A20 Pro 2nm Chip, 48MP Pro Fusion Kamera mit variabler Blende und 5.567 mAh Akku."
        : "Apple iPhone 18 Pro Max with 6.9-inch Super Retina XDR OLED, 2nm A20 Pro silicon, 48MP Pro Fusion optics with variable aperture and 5,567 mAh battery.",
    brand: {
      "@type": "Brand",
      name: "Apple",
    },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "EUR",
      lowPrice: "1449",
      highPrice: "2299",
      offerCount: "8",
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
        name: locale === "de" ? "Was unterscheidet das iPhone 18 Pro Max vom iPhone 18 Pro?" : "What are the differences between iPhone 18 Pro Max and 18 Pro?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            locale === "de"
              ? "Das iPhone 18 Pro Max bietet ein größeres 6,9-Zoll-Display (vs. 6,3 Zoll), einen deutlich größeren 5.567 mAh Akku für bis zu 35 Stunden Videowiedergabe und erweiterte 10x verlustfreie Tele-Zoom-Möglichkeiten."
              : "iPhone 18 Pro Max features a larger 6.9-inch display (vs 6.3-inch), a substantially larger 5,567 mAh battery for up to 35 hours video playback, and enhanced 10x lossless telephoto capabilities.",
        },
      },
      {
        "@type": "Question",
        name: locale === "de" ? "Wie lange hält der Akku des iPhone 18 Pro Max?" : "How long does the iPhone 18 Pro Max battery last?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            locale === "de"
              ? "Dank der 2nm-Effizienz des A20 Pro Prozessors und 5.567 mAh Kapazität ermöglicht das iPhone 18 Pro Max bis zu 35 Stunden kontinuierliche Videowiedergabe und über 2 Tage normale Nutzung."
              : "With 2nm silicon efficiency and 5,567 mAh capacity, iPhone 18 Pro Max provides up to 35 hours continuous video playback and over two days of typical use.",
        },
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonStringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonStringify(productSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonStringify(faqSchema) }} />

      <IPhone18Showcase locale={locale} initialModel="promax" />
    </>
  );
}
