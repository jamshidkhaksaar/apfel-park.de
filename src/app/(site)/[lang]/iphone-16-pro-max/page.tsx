import type { Metadata } from "next";

import StoreCollectionLanding from "@/components/store/StoreCollectionLanding";
import type { Locale } from "@/lib/i18n";
import { createMetadata } from "@/lib/metadata";
import { hasCatalogSearchQuery } from "@/lib/products";
import { requireLocale } from "@/lib/route-locale";
import { getStoreCollectionCopy } from "@/lib/store-collections";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }): Promise<Metadata> {
  const [{ lang: rawLang }, query] = await Promise.all([params, searchParams]);
  const lang = requireLocale(rawLang);
  const locale = (lang === "en" ? "en" : "de") as Locale;
  const copy = getStoreCollectionCopy("iphone-16-pro-max", locale);
  return createMetadata(locale, copy.metaTitle, copy.description, copy.path, undefined, { noindex: hasCatalogSearchQuery(query) });
}

export default async function Iphone16ProMaxPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { lang: rawLang } = await params;
  const lang = requireLocale(rawLang);
  return (
    <StoreCollectionLanding
      collection="iphone-16-pro-max"
      locale={lang === "en" ? "en" : "de"}
      query={await searchParams}
    />
  );
}
