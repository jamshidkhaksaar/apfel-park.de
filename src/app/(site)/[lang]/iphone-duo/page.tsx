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
      ? "iPhone Duo kaufen – Apples erstes Foldable | Apfel Park Hamburg"
      : "Buy iPhone Duo – Apple's First Foldable | Apfel Park Hamburg";

  const description =
    locale === "de"
      ? "Apple iPhone Duo (Foldable) mit 7.6 Zoll Innen-Display & 5.4 Zoll Cover. A20 Pro 2nm Chip, Titan-Scharnier & 5.400 mAh Akku. Jetzt bei Apfel Park Hamburg reservieren."
      : "Apple iPhone Duo foldable with 7.6 inch inner screen & 5.4 inch cover. 2nm A20 Pro silicon, Grade 5 titanium zero-gap hinge. Reserve at Apfel Park Hamburg.";

  return createMetadata(locale, title, description, "/iphone-duo", "/images/apple/duo-night.webp");
}

export default async function IphoneDuoPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang: rawLang } = await params;
  const lang = requireLocale(rawLang);
  const locale = (lang === "en" ? "en" : "de") as Locale;

  return <IPhone18Showcase locale={locale} initialModel="duo" />;
}
