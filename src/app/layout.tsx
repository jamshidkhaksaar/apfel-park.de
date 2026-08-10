import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import { cookies, headers } from "next/headers";

import { createAdminDbClient } from "@/lib/admin-db";
import { BrandingProvider, type BrandingAssets } from "@/components/BrandingProvider";
import { getPromoProducts, getPromoPopupSettings } from "@/lib/products";
import { safeJsonStringify } from "@/lib/security";
import { merchantReturnPolicy, organizationShippingService } from "@/lib/schema";
import { getSeoSettings, splitKeywords } from "@/lib/seo";
import { siteInfo } from "@/lib/site";
import { getMarketingIntegrations, getSiteSocialLinks, getWhatsAppWidgetSettings } from "@/lib/site-settings-server";

import "./globals.css";
import AppWrapper from "../components/AppWrapper";
import LanguageTransitionProvider from "../components/LanguageTransition";
import ThemeProvider, { ThemeScript } from "../components/ThemeProvider";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const soraDisplay = Sora({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const normalizeImageUrl = (value: string) => {
  if (!value) return undefined;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return `https://apfel-park.de${value.startsWith("/") ? value : `/${value}`}`;
};

export const generateMetadata = async (): Promise<Metadata> => {
  const seo = await getSeoSettings();
  const ogImage = normalizeImageUrl(seo.global.defaultOgImage);

  const defaultTitle = "Apfel Park – iPhone & Smartphones kaufen in Hamburg";
  const defaultDescription =
    "Smartphones und iPhones in Hamburg-Wilhelmsburg: neu, Open Box und gebraucht – geprüft und mit Garantie. Ankauf und Reparatur vor Ort.";

  return {
    metadataBase: new URL("https://apfel-park.de"),
    title: {
      default: defaultTitle,
      template: "%s | Apfel Park",
    },
    description: defaultDescription,
    keywords: splitKeywords(seo.global.defaultKeywords.de),
    verification: {
      google: seo.global.googleVerification || undefined,
      other: {
        ...(seo.global.bingVerification ? { "msvalidate.01": seo.global.bingVerification } : {}),
        "facebook-domain-verification": "0t4jnlg1dykib884mbuxgkzymjxkyi",
      },
    },
    openGraph: {
      title: defaultTitle,
      description: defaultDescription,
      type: "website",
      url: "https://apfel-park.de",
      siteName: "Apfel Park",
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: defaultTitle,
      description: defaultDescription,
      images: ogImage ? [ogImage] : undefined,
    },
  };
};

const getBrandingAssets = async (): Promise<BrandingAssets | null> => {
  try {
    const admin = createAdminDbClient();
    const { data } = await admin
      .from("store_settings")
      .select("value")
      .eq("key", "branding_assets")
      .maybeSingle();

    return (data?.value as BrandingAssets | null) ?? null;
  } catch {
    return null;
  }
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [cookieStore, requestHeaders] = await Promise.all([cookies(), headers()]);
  const langCookie = cookieStore.get("apfel-lang");
  const pathLocale = requestHeaders.get("x-apfel-pathname")?.match(/^\/(de|en)(?:\/|$)/)?.[1];
  const lang = pathLocale === "en" || pathLocale === "de"
    ? pathLocale
    : langCookie?.value === "en"
      ? "en"
      : "de";
  const themeCookie = cookieStore.get("apfel-theme");
  const theme = themeCookie?.value === "dark" || themeCookie?.value === "mono"
    ? themeCookie.value
    : "mono";
  const promo = await getPromoPopupSettings();
  const [branding, promoProducts, marketing, whatsapp, socialLinks] = await Promise.all([
    getBrandingAssets(),
    getPromoProducts(promo.pinnedProductIds),
    getMarketingIntegrations(),
    getWhatsAppWidgetSettings(),
    getSiteSocialLinks(),
  ]);
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["Store", "LocalBusiness"],
        "@id": `${siteInfo.url}/#store`,
        name: siteInfo.name,
        legalName: siteInfo.legalName,
        url: siteInfo.url,
        // E.164 so Google can match this against the Business Profile
        // without guessing the country code.
        telephone: siteInfo.phoneE164,
        email: siteInfo.email,
        contactPoint: [
          {
            "@type": "ContactPoint",
            telephone: siteInfo.phoneE164,
            contactType: "customer service",
            areaServed: "DE",
            availableLanguage: ["de", "en"],
          },
          {
            "@type": "ContactPoint",
            telephone: siteInfo.landlineE164,
            contactType: "customer service",
            areaServed: "DE",
            availableLanguage: ["de", "en"],
          },
        ],
        image: normalizeImageUrl(branding?.ogImage ?? ""),
        logo: normalizeImageUrl(branding?.logo ?? ""),
        vatID: siteInfo.vatId,
        priceRange: "€€",
        currenciesAccepted: "EUR",
        paymentAccepted: "Cash, Credit Card, Debit Card, PayPal",
        hasMerchantReturnPolicy: merchantReturnPolicy(),
        hasShippingService: organizationShippingService(),
        address: {
          "@type": "PostalAddress",
          streetAddress: siteInfo.address.street,
          addressLocality: siteInfo.address.city,
          postalCode: siteInfo.address.postalCode,
          addressCountry: "DE",
        },
        openingHoursSpecification: [{
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
          opens: "09:30",
          closes: "20:00",
        }],
        geo: {
          "@type": "GeoCoordinates",
          latitude: 53.498491,
          longitude: 10.009589,
        },
        areaServed: {
          "@type": "City",
          name: "Hamburg",
        },
        hasMap: siteInfo.map.linkUrl,
        sameAs: Object.values(socialLinks),
      },
      {
        "@type": "WebSite",
        "@id": `${siteInfo.url}/#website`,
        name: siteInfo.name,
        url: siteInfo.url,
        publisher: { "@id": `${siteInfo.url}/#store` },
        inLanguage: ["de-DE", "en-DE"],
      },
    ],
  };

  return (
    <html
      lang={lang}
      data-theme={theme}
      data-scroll-behavior="smooth"
      translate="no"
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
        <meta name="theme-color" content="#09090b" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonStringify(organizationJsonLd) }}
        />
      </head>
      <body
        className={`${inter.variable} ${soraDisplay.variable} bg-background font-sans text-foreground antialiased`}
      >
        <BrandingProvider branding={branding}>
          <ThemeProvider initialTheme={theme}>
            <LanguageTransitionProvider>
              <AppWrapper
                lang={lang as "de" | "en"}
                promo={promo}
                discountedProducts={promoProducts.map((product) => ({
                  id: product.id,
                  title: product.title,
                  slug: product.slug,
                  price: product.price,
                  compareAtPrice: product.compareAtPrice,
                }))}
                marketing={marketing}
                whatsapp={whatsapp}
              >
                {children}
              </AppWrapper>
            </LanguageTransitionProvider>
          </ThemeProvider>
        </BrandingProvider>
      </body>
    </html>
  );
}
