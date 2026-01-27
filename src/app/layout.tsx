import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import AppWrapper from "../components/AppWrapper";
import LanguageTransitionProvider from "../components/LanguageTransition";
import ThemeProvider, { ThemeScript } from "../components/ThemeProvider";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
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
    icon: "/branding/favicon.jpg",
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const langCookie = cookieStore.get("apfel-lang");
  const lang = langCookie?.value ?? "de";

  return (
    <html lang={lang} data-theme="ocean" translate="no" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} bg-background font-sans text-foreground antialiased`}
      >
        <ThemeProvider>
          <LanguageTransitionProvider>
            <AppWrapper lang={lang as "de" | "en"}>{children}</AppWrapper>
          </LanguageTransitionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
