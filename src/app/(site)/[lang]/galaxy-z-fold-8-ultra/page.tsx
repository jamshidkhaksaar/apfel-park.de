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
      ? "Samsung Galaxy Z Fold8 Ultra kaufen – 8 Zoll 200MP | Apfel Park Hamburg"
      : "Buy Samsung Galaxy Z Fold8 Ultra – 8-Inch 200MP | Apfel Park Hamburg";

  const description =
    locale === "de"
      ? "Samsung Galaxy Z Fold8 Ultra Flaggschiff mit 8,0 Zoll Display, 200 MP ISOCELL Kamera, Titan-Gehäuse und 5.000 mAh Akku. Verfügbarkeit & Angebote in Hamburg."
      : "Samsung Galaxy Z Fold8 Ultra flagship with 8.0 inch screen, 200MP ISOCELL optics, titanium chassis and 5,000 mAh battery. Pre-orders at Apfel Park Hamburg.";

  return createMetadata(locale, title, description, "/galaxy-z-fold-8-ultra", "/images/samsung/zfold8/ultra-violet.webp");
}

export default async function GalaxyZFold8UltraPage({
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
        name: "Samsung Galaxy Z Fold8 Ultra",
        item: `${siteInfo.url}/${locale}/galaxy-z-fold-8-ultra`,
      },
    ],
  };

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Samsung Galaxy Z Fold8 Ultra",
    image: [
      `${siteInfo.url}/images/samsung/zfold8/ultra-violet.webp`,
      `${siteInfo.url}/images/samsung/zfold8/banner-dual-desktop.webp`,
    ],
    description:
      locale === "de"
        ? "Samsung Galaxy Z Fold8 Ultra Flaggschiff mit 8,0 Zoll Dynamic AMOLED 2X, 200 MP ISOCELL Kamera, Grade 5 Titanrahmen und S-Pen Digitizer."
        : "Samsung Galaxy Z Fold8 Ultra powerhouse with 8.0-inch Dynamic AMOLED 2X, 200MP ISOCELL optics, Grade 5 titanium chassis and S-Pen digitizer.",
    brand: {
      "@type": "Brand",
      name: "Samsung",
    },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "EUR",
      lowPrice: "1999",
      highPrice: "2699",
      offerCount: "6",
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
        name: locale === "de" ? "Welche Kamera hat das Galaxy Z Fold8 Ultra?" : "What camera system does the Galaxy Z Fold8 Ultra feature?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            locale === "de"
              ? "Das Fold8 Ultra bietet ein Triple Pro Kamerasystem mit 200 MP Hauptsensor (f/1.7, OIS), 50 MP Ultraweitwinkel und 50 MP Periskop-Teleobjektiv mit 5x optischem und 100x Space Zoom."
              : "The Fold8 Ultra features a Triple Pro optics suite: 200MP main sensor (f/1.7, OIS), 50MP ultra-wide and 50MP periscope telephoto with 5x optical and 100x Space Zoom.",
        },
      },
      {
        "@type": "Question",
        name: locale === "de" ? "Unterstützt das Galaxy Z Fold8 Ultra den S-Pen?" : "Does Galaxy Z Fold8 Ultra support the S-Pen?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            locale === "de"
              ? "Ja, das 8,0-Zoll-Hauptdisplay besitzt einen integrierten Wacom-Digitizer für präzises Zeichnen, Notizen und Gesten mit dem S-Pen."
              : "Yes, the 8.0-inch main display integrates a full Wacom digitizer for precise sketching, note-taking and gestures with the S-Pen.",
        },
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonStringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonStringify(productSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonStringify(faqSchema) }} />

      <GalaxyFoldShowcase locale={locale} initialModel="ultra" />
    </>
  );
}
