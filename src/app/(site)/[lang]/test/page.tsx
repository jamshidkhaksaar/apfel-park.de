import type { Metadata } from "next";
import { notFound } from "next/navigation";

import BillboardPreviewLab from "@/components/billboards/BillboardPreviewLab";
import { isLocale, type Locale } from "@/lib/i18n";
import { requireLocale } from "@/lib/route-locale";

export const dynamic = "force-dynamic";

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> => {
  const { lang: rawLang } = await params;
  if (!isLocale(rawLang)) notFound();
  const lang = requireLocale(rawLang);

  return {
    title: lang === "de" ? "Billboard Design Lab & Flagship Studio | Apfel Park" : "Billboard Design Lab & Flagship Studio | Apfel Park",
    description: "Internal design staging lab for flagship billboards and device showcases.",
    robots: {
      index: false,
      follow: false,
    },
  };
};

export default async function StagingTestPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang: rawLang } = await params;
  if (!isLocale(rawLang)) notFound();
  const lang = requireLocale(rawLang);

  return <BillboardPreviewLab lang={lang} />;
}
