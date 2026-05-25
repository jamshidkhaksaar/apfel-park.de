import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import { cookies } from "next/headers";

import { createAdminDbClient } from "@/lib/admin-db";
import { BrandingProvider, type BrandingAssets } from "@/components/BrandingProvider";
import { getPromoProducts, getPromoPopupSettings } from "@/lib/products";
import { safeJsonStringify } from "@/lib/security";
import { getSeoSettings, splitKeywords } from "@/lib/seo";
import { siteInfo } from "@/lib/site";
import { getMarketingIntegrations, getWhatsAppWidgetSettings } from "@/lib/site-settings-server";

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

  return {
    metadataBase: new URL("https://apfel-park.de"),
    title: {
      default: "Apfel Park | Smartphone Repair & Tech Store",
      template: "%s | Apfel Park",
    },
    description: "Express Smartphone Repairs. Premium Accessories. Expert Service.",
    keywords: splitKeywords(seo.global.defaultKeywords.de),
    verification: {
      google: seo.global.googleVerification || undefined,
      other: {
        ...(seo.global.bingVerification ? { "msvalidate.01": seo.global.bingVerification } : {}),
        "facebook-domain-verification": "0t4jnlg1dykib884mbuxgkzymjxkyi",
      },
    },
    openGraph: {
      title: "Apfel Park | Smartphone Repair & Tech Store",
      description: "Express Smartphone Repairs. Premium Accessories. Expert Service.",
      type: "website",
      url: "https://apfel-park.de",
      siteName: "Apfel Park",
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: "Apfel Park | Smartphone Repair & Tech Store",
      description: "Express Smartphone Repairs. Premium Accessories. Expert Service.",
      images: ogImage ? [ogImage] : undefined,
    },
  };
};

const getFaviconHref = async (): Promise<string> => {
  try {
    const admin = createAdminDbClient();
    const { data } = await admin
      .from("store_settings")
      .select("value, updated_at")
      .eq("key", "branding_assets")
      .maybeSingle();

    const value = (data?.value as { favicon?: string } | null) ?? null;
    const favicon = value?.favicon;
    if (!favicon) return "/favicon.ico";

    const updatedAtValue = typeof data?.updated_at === "string" ? data.updated_at : null;
    const updatedAt = updatedAtValue ? new Date(updatedAtValue).getTime() : null;
    if (!updatedAt) return favicon;

    const separator = favicon.includes("?") ? "&" : "?";
    return `${favicon}${separator}v=${updatedAt}`;
  } catch {
    return "/favicon.ico";
  }
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
  const cookieStore = await cookies();
  const langCookie = cookieStore.get("apfel-lang");
  const lang = langCookie?.value ?? "de";
  const themeCookie = cookieStore.get("apfel-theme");
  const theme = themeCookie?.value === "dark" || themeCookie?.value === "mono"
    ? themeCookie.value
    : "mono";
  const promo = await getPromoPopupSettings();
  const [branding, faviconHref, promoProducts, marketing, whatsapp] = await Promise.all([
    getBrandingAssets(),
    getFaviconHref(),
    getPromoProducts(promo.pinnedProductIds),
    getMarketingIntegrations(),
    getWhatsAppWidgetSettings(),
  ]);
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: siteInfo.name,
    url: siteInfo.url,
    telephone: siteInfo.phone,
    email: siteInfo.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: siteInfo.address.street,
      addressLocality: siteInfo.address.city,
      postalCode: siteInfo.address.postalCode,
      addressCountry: "DE",
    },
  };
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteInfo.name,
    url: siteInfo.url,
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
        <link rel="icon" href={faviconHref} sizes="any" />
        <link rel="shortcut icon" href={faviconHref} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonStringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonStringify(websiteJsonLd) }}
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
