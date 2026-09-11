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
      ? "Google Pixel 11 Pro Fold kaufen – 8 Zoll Super Actua Flex | Apfel Park Hamburg"
      : "Buy Google Pixel 11 Pro Fold – 8-Inch Super Actua Flex | Apfel Park Hamburg";

  const description =
    locale === "de"
      ? "Google Pixel 11 Pro Fold mit 8,0 Zoll Super Actua Flex Display, 5,1 mm Slim-Design, 5x Periskop-Telezoom und Tensor G5. Jetzt bei Apfel Park anfragen."
      : "Google Pixel 11 Pro Fold featuring 8.0-inch Super Actua Flex display, 5.1mm slim profile, 5x periscope telephoto and Tensor G5. Inquire at Apfel Park.";

  return createMetadata(locale, title, description, "/pixel-11-pro-fold", "/images/google/pixel11/fold-olive.webp");
}

export default async function Pixel11ProFoldPage({
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
        name: "Google Pixel 11 Pro Fold",
        item: `${siteInfo.url}/${locale}/pixel-11-pro-fold`,
      },
    ],
  };

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Google Pixel 11 Pro Fold",
    image: [
      `${siteInfo.url}/images/google/pixel11/fold-olive.webp`,
      `${siteInfo.url}/images/google/pixel11/fold-obsidian.webp`,
    ],
    description:
      locale === "de"
        ? "Google Pixel 11 Pro Fold Foldable mit riesigem 8,0 Zoll Super Actua Flex OLED, reibungslosem Zahnradscharnier, 3nm Google Tensor G5 und 5x optischem Periskop-Telezoom."
        : "Google Pixel 11 Pro Fold foldable with expansive 8.0-inch Super Actua Flex OLED, fluid gear hinge, 3nm Google Tensor G5 and 5x optical periscope telephoto.",
    brand: {
      "@type": "Brand",
      name: "Google",
    },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "EUR",
      lowPrice: "1899",
      highPrice: "2299",
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
        name: locale === "de" ? "Wie dünn ist das Google Pixel 11 Pro Fold?" : "How thin is Google Pixel 11 Pro Fold?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            locale === "de"
              ? "Das Pixel 11 Pro Fold misst entfaltet nur 5,1 mm und gefaltet 10,5 mm — eines der dünnsten Foldables weltweit."
              : "Pixel 11 Pro Fold measures just 5.1mm unfolded and 10.5mm folded — making it one of the thinnest foldables in the world.",
        },
      },
      {
        "@type": "Question",
        name: locale === "de" ? "Welche Kameras hat das Pixel 11 Pro Fold?" : "What cameras are on Pixel 11 Pro Fold?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            locale === "de"
              ? "Ein Pro Triple-System: 48 MP Weitwinkel (f/1.7, OIS), 10,5 MP Ultraweitwinkel und 10,8 MP 5x Periskop-Telezoom mit bis zu 20x Super Res Zoom."
              : "A Pro Triple suite: 48MP wide (f/1.7, OIS), 10.5MP ultra-wide and 10.8MP 5x periscope telephoto with up to 20x Super Res Zoom.",
        },
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonStringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonStringify(productSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonStringify(faqSchema) }} />

      <PixelShowcase locale={locale} initialModel="proFold" />
    </>
  );
}
