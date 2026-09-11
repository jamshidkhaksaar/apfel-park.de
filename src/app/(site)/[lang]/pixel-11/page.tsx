import type { Metadata } from "next";
import PixelShowcase from "@/components/google-pixel/PixelShowcase";
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
      ? "Google Pixel 11 kaufen – Tensor G5 3nm & Actua OLED | Apfel Park Hamburg"
      : "Buy Google Pixel 11 – Tensor G5 3nm & Actua OLED | Apfel Park Hamburg";

  const description =
    locale === "de"
      ? "Google Pixel 11 mit 3nm Tensor G5 Chip, 6,3 Zoll Actua OLED Display, 50 MP Quad PD Kamera und Gemini AI. Jetzt bei Apfel Park Hamburg unverbindlich anfragen."
      : "Google Pixel 11 featuring 3nm Tensor G5 silicon, 6.3-inch Actua OLED, 50MP Quad PD camera suite and Gemini AI. Inquire at Apfel Park Hamburg.";

  return createMetadata(locale, title, description, "/pixel-11", "/images/google/pixel11/pixel-frost.webp");
}

export default async function Pixel11Page({
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
        name: "Google Pixel 11",
        item: `${siteInfo.url}/${locale}/pixel-11`,
      },
    ],
  };

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Google Pixel 11",
    image: [
      `${siteInfo.url}/images/google/pixel11/pixel-frost.webp`,
      `${siteInfo.url}/images/google/pixel11/pixel-obsidian.webp`,
      `${siteInfo.url}/images/google/pixel11/pixel-pistachio.webp`,
      `${siteInfo.url}/images/google/pixel11/pixel-hibiscus.webp`,
    ],
    description:
      locale === "de"
        ? "Google Pixel 11 Smartphone mit modernstem 3nm Google Tensor G5 Prozessor, 6,3 Zoll Actua OLED 120Hz Display, 50 MP Quad PD Kamera und 7 Jahren garantierten Updates."
        : "Google Pixel 11 smartphone with cutting-edge 3nm Google Tensor G5 silicon, 6.3-inch Actua OLED 120Hz display, 50MP Quad PD camera and 7 years of full OS updates.",
    brand: {
      "@type": "Brand",
      name: "Google",
    },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "EUR",
      lowPrice: "899",
      highPrice: "1199",
      offerCount: "8",
      availability: "https://schema.org/InStock",
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
        name: locale === "de" ? "Wann ist das Google Pixel 11 in Deutschland erhältlich?" : "When is the Google Pixel 11 available in Germany?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            locale === "de"
              ? "Das Google Pixel 11 ist bei Apfel Park Hamburg ab sofort lieferbar und vor Ort im Store Wilhelmsburg testbar."
              : "Google Pixel 11 is available immediately at Apfel Park Hamburg with store pickup or express insured shipping.",
        },
      },
      {
        "@type": "Question",
        name: locale === "de" ? "Welche Vorteile bietet der Google Tensor G5 Chip?" : "What benefits does Google Tensor G5 offer?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            locale === "de"
              ? "Der Tensor G5 wird im modernen 3nm-Verfahren von TSMC gefertigt und bietet gesteigerte Energieeffizienz sowie hardwarebeschleunigte On-Device Gemini KI."
              : "Tensor G5 is fabricated on TSMC's 3nm process, delivering superior battery efficiency and hardware-accelerated on-device Gemini AI.",
        },
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonStringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonStringify(productSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonStringify(faqSchema) }} />

      <PixelShowcase locale={locale} initialModel="pixel11" />
    </>
  );
}
