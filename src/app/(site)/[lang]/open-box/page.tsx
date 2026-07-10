import type { Metadata } from "next";

import PageIntro from "../../../../components/PageIntro";
import StoreGrid from "../../../../components/store/StoreGrid";
import { type Locale } from "../../../../lib/i18n";
import { createMetadata } from "../../../../lib/metadata";
import { getOpenBoxProducts } from "../../../../lib/products";

export const dynamic = "force-dynamic";

const copy = {
  de: {
    title: "Open-Box",
    description:
      "Geöffnete Vorführ- und Retourengeräte in einwandfreiem Zustand – geprüft, mit Garantie und zum reduzierten Preis.",
    empty: "Aktuell sind keine Open-Box-Artikel verfügbar. Schau bald wieder vorbei.",
  },
  en: {
    title: "Open-Box",
    description:
      "Opened display and return units in flawless condition – tested, with warranty, at a reduced price.",
    empty: "No open-box items are available right now. Check back soon.",
  },
} as const;

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> => {
  const { lang } = await params;
  const locale = (lang === "en" ? "en" : "de") as Locale;
  return createMetadata(locale, copy[locale].title, copy[locale].description, "/open-box");
};

export default async function OpenBoxPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = (lang === "en" ? "en" : "de") as Locale;
  const products = await getOpenBoxProducts(undefined, locale);
  const t = copy[locale];

  return (
    <div className="bg-background">
      <PageIntro title={t.title} subtitle={t.description} eyebrow={t.title} />

      <section className="section-pad">
        <div className="container-page">
          {products.length > 0 ? (
            <StoreGrid products={products} lang={locale} />
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-muted">
              {t.empty}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
