import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cookies } from "next/headers";

import { createAdminClient } from "@/lib/supabase/admin";

import "./globals.css";
import AppWrapper from "../components/AppWrapper";
import LanguageTransitionProvider from "../components/LanguageTransition";
import ThemeProvider, { ThemeScript } from "../components/ThemeProvider";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const interDisplay = Inter({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://apfel-park.de"),
  title: {
    default: "Apfel Park | Smartphone Repair & Tech Store",
    template: "%s | Apfel Park",
  },
  description: "Express Smartphone Repairs. Premium Accessories. Expert Service.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Apfel Park | Smartphone Repair & Tech Store",
    description: "Express Smartphone Repairs. Premium Accessories. Expert Service.",
    type: "website",
    url: "https://apfel-park.de",
    siteName: "Apfel Park",
  },
  twitter: {
    card: "summary_large_image",
    title: "Apfel Park | Smartphone Repair & Tech Store",
    description: "Express Smartphone Repairs. Premium Accessories. Expert Service.",
  },
};

const getFaviconHref = async (): Promise<string> => {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("store_settings")
      .select("value, updated_at")
      .eq("key", "branding_assets")
      .maybeSingle();

    const value = (data?.value as { favicon?: string } | null) ?? null;
    const favicon = value?.favicon;
    if (!favicon) return "/favicon.ico";

    const updatedAt = data?.updated_at ? new Date(data.updated_at).getTime() : null;
    if (!updatedAt) return favicon;

    const separator = favicon.includes("?") ? "&" : "?";
    return `${favicon}${separator}v=${updatedAt}`;
  } catch {
    return "/favicon.ico";
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
  const faviconHref = await getFaviconHref();

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
      </head>
      <body
        className={`${inter.variable} ${interDisplay.variable} bg-background font-sans text-foreground antialiased`}
      >
        <ThemeProvider initialTheme={theme}>
          <LanguageTransitionProvider>
            <AppWrapper lang={lang as "de" | "en"}>{children}</AppWrapper>
          </LanguageTransitionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
