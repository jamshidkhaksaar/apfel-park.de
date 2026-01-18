import type { Metadata } from "next";

import PageIntro from "../../../../components/PageIntro";
import StoreGrid from "../../../../components/store/StoreGrid";
import { getDictionary, type Locale } from "../../../../lib/i18n";
import { createMetadata } from "../../../../lib/metadata";
import { getProducts } from "../../../../lib/products";

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> => {
  const { lang } = await params;
  const dict = getDictionary(lang as Locale);
  return createMetadata(
    lang as Locale,
    lang === "de" ? "Online Shop" : "Online Store",
    lang === "de" ? "Kaufen Sie geprüfte Smartphones, Laptops und Zubehör." : "Buy certified smartphones, laptops and accessories.",
    "/store",
  );
};

export default async function StorePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const dict = getDictionary(lang as Locale);
  const products = await getProducts();

  return (
    <div className="bg-background">
      <PageIntro
        title={lang === "de" ? "Online Shop" : "Online Store"}
        subtitle={lang === "de" 
          ? "Geprüfte Geräte, Premium Zubehör und mehr. Alles mit Garantie." 
          : "Certified devices, premium accessories and more. All with warranty."}
        eyebrow={lang === "de" ? "Marktplatz" : "Marketplace"}
      />

      <section className="section-pad">
        <div className="container-page">
          <StoreGrid products={products} lang={lang as Locale} />
        </div>
      </section>
    </div>
  );
}
