import type { Metadata } from "next";

import StoreCollectionLanding from "@/components/store/StoreCollectionLanding";
import type { Locale } from "@/lib/i18n";
import { createMetadata } from "@/lib/metadata";
import { getStoreCollectionCopy } from "@/lib/store-collections";
import { requireLocale } from "@/lib/route-locale";
import { resolveStoreIndexing } from "@/lib/store-indexing";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }): Promise<Metadata> {
  const [{ lang: rawLang }, query] = await Promise.all([params, searchParams]);
  const lang = requireLocale(rawLang);
  const locale = (lang === "en" ? "en" : "de") as Locale;
  const copy = getStoreCollectionCopy("used-phones", locale);
  const indexing = resolveStoreIndexing(query);
  return createMetadata(locale, copy.metaTitle, copy.description, copy.path, undefined, {
    noindex: indexing.noindex,
    canonicalQuery: indexing.canonicalQuery,
  });
}

export default async function UsedPhonesPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { lang: rawLang } = await params;
  const lang = requireLocale(rawLang);
  return <StoreCollectionLanding collection="used-phones" locale={lang === "en" ? "en" : "de"} query={await searchParams} />;
}
