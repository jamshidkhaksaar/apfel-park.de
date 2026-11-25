import type { Metadata } from "next";

import StoreCollectionLanding from "@/components/store/StoreCollectionLanding";
import type { Locale } from "@/lib/i18n";
import { createMetadata } from "@/lib/metadata";
import { collectionFromPrice } from "@/lib/collection-price";
import { modelPriceDescription, modelPriceTitle } from "@/lib/price-title";
import { getStoreCollectionCopy } from "@/lib/store-collections";
import { requireLocale } from "@/lib/route-locale";
import { resolveStoreIndexing } from "@/lib/store-indexing";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }): Promise<Metadata> {
  const [{ lang: rawLang }, query] = await Promise.all([params, searchParams]);
  const lang = requireLocale(rawLang);
  const locale = (lang === "en" ? "en" : "de") as Locale;
  const copy = getStoreCollectionCopy("iphone-17", locale);
  const indexing = resolveStoreIndexing(query);
  // English searches from Germany ask for the price; answer it in the title.
  const fromPrice = locale === "en" ? await collectionFromPrice("iphone-17", locale) : null;
  const priceTitle = fromPrice ? modelPriceTitle("iPhone 17", fromPrice) : null;
  return createMetadata(
    locale,
    priceTitle ?? copy.metaTitle,
    priceTitle && fromPrice ? modelPriceDescription("iPhone 17", fromPrice) : copy.description,
    copy.path,
    undefined,
    {
      noindex: indexing.noindex,
      canonicalQuery: indexing.canonicalQuery,
      preferPageCopy: Boolean(priceTitle),
    },
  );
}

export default async function Iphone17Page({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { lang: rawLang } = await params;
  const lang = requireLocale(rawLang);
  return <StoreCollectionLanding collection="iphone-17" locale={lang === "en" ? "en" : "de"} query={await searchParams} />;
}
