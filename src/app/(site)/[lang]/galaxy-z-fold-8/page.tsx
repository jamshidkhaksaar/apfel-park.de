import type { Metadata } from "next";
import GalaxyFoldShowcase from "@/components/samsung-fold/GalaxyFoldShowcase";
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
      ? "Samsung Galaxy Z Fold8 kaufen – 4,5 mm Ultra-Slim | Apfel Park Hamburg"
      : "Buy Samsung Galaxy Z Fold8 – 4.5mm Ultra-Slim | Apfel Park Hamburg";

  const description =
    locale === "de"
      ? "Samsung Galaxy Z Fold8 mit 7,6 Zoll Dynamic AMOLED 2X, Snapdragon 8 Elite Gen 5 und neuem 4,5 mm Slim-Design. Jetzt bei Apfel Park Hamburg anfragen."
      : "Samsung Galaxy Z Fold8 featuring 7.6 inch Dynamic AMOLED 2X, Snapdragon 8 Elite Gen 5 and record 4.5mm slim build. Inquire at Apfel Park Hamburg.";

  return createMetadata(locale, title, description, "/galaxy-z-fold-8", "/images/samsung/zfold8/banner-dual-desktop.webp");
}

export default async function GalaxyZFold8Page({
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
        name: "Samsung Galaxy Z Fold8",
        item: `${siteInfo.url}/${locale}/galaxy-z-fold-8`,
      },
    ],
  };

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Samsung Galaxy Z Fold8",
    image: [
      `${siteInfo.url}/images/samsung/zfold8/phone-pistachio.webp`,
      `${siteInfo.url}/images/samsung/zfold8/banner-dual-desktop.webp`,
    ],
    description:
      locale === "de"
        ? "Samsung Galaxy Z Fold8 Foldable mit 7,6 Zoll LTPO Dynamic AMOLED 2X, Qualcomm Snapdragon 8 Elite Gen 5 und neuem 4,5 mm Ultra-Slim Gehäuse."
        : "Samsung Galaxy Z Fold8 foldable with 7.6-inch LTPO Dynamic AMOLED 2X, Qualcomm Snapdragon 8 Elite Gen 5 and 4.5mm ultra-slim chassis.",
    brand: {
      "@type": "Brand",
      name: "Samsung",
    },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "EUR",
      lowPrice: "1699",
      highPrice: "2299",
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
        name: locale === "de" ? "Wann ist das Samsung Galaxy Z Fold8 in Deutschland erhältlich?" : "When is the Samsung Galaxy Z Fold8 available in Germany?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            locale === "de"
              ? "Das Samsung Galaxy Z Fold8 ist bei Apfel Park Hamburg ab sofort lieferbar und im Store Wilhelmsburg testbar."
              : "Samsung Galaxy Z Fold8 is available immediately at Apfel Park Hamburg with in-store pickup or insured express shipping.",
        },
      },
      {
        "@type": "Question",
        name: locale === "de" ? "Wie dünn ist das Samsung Galaxy Z Fold8?" : "How thin is the Samsung Galaxy Z Fold8?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            locale === "de"
              ? "Das Galaxy Z Fold8 misst entfaltet nur 4,5 mm und gefaltet 10,4 mm bei einem Gewicht von 201 Gramm — Samsungs dünnstes Foldable aller Zeiten."
              : "The Galaxy Z Fold8 measures just 4.5 mm unfolded and 10.4 mm folded at 201 grams — Samsung's thinnest foldable yet.",
        },
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonStringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonStringify(productSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonStringify(faqSchema) }} />

      <GalaxyFoldShowcase locale={locale} initialModel="fold8" />
    </>
  );
}
