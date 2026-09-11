import type { Metadata } from "next";
import IPhone18Showcase from "@/components/iphone-18/IPhone18Showcase";
import { createMetadata } from "@/lib/metadata";
import { requireLocale } from "@/lib/route-locale";
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
      ? "Apple iPhone 18 Pro Max mit 6.9 Zoll Super Retina XDR OLED, A20 Pro 2nm Chip, variabler 48MP Kamera & Riesen-Akku. Vorbestellung & Angebote bei Apfel Park Hamburg."
      : "Apple iPhone 18 Pro Max featuring 6.9 inch Super Retina XDR OLED, 2nm A20 Pro, variable 48MP optics & massive battery. Pre-orders in Hamburg.";

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

  return <IPhone18Showcase locale={locale} initialModel="promax" />;
}
