import type { Metadata } from "next";

import StoreCollectionLanding from "@/components/store/StoreCollectionLanding";
import type { Locale } from "@/lib/i18n";
import { createMetadata } from "@/lib/metadata";
import { getStoreCollectionCopy } from "@/lib/store-collections";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const locale = (lang === "en" ? "en" : "de") as Locale;
  const copy = getStoreCollectionCopy("iphone-17", locale);
  return createMetadata(locale, copy.metaTitle, copy.description, copy.path);
}

export default async function Iphone17Page({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { lang } = await params;
  return <StoreCollectionLanding collection="iphone-17" locale={lang === "en" ? "en" : "de"} query={await searchParams} />;
}
