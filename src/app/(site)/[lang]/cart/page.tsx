import type { Metadata } from "next";

import CartClient from "@/components/checkout/CartClient";
import { createMetadata } from "@/lib/metadata";
import { requireLocale } from "@/lib/route-locale";

export const dynamic = "force-dynamic";

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> => {
  const { lang: rawLang } = await params;
  const lang = requireLocale(rawLang);
  return createMetadata(
    lang,
    lang === "de" ? "Warenkorb" : "Cart",
    lang === "de"
      ? "Prüfe deine ausgewählten Geräte und Zubehörartikel und starte anschließend den sicheren Checkout bei Apfel Park."
      : "Review your selected phones, devices and accessories, then continue to Apfel Park's secure checkout.",
    "/cart",
    undefined,
    { noindex: true },
  );
};

export default async function CartPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: rawLang } = await params;
  const lang = requireLocale(rawLang);
  const locale = lang === "en" ? "en" : "de";

  return (
    <section className="section-pad bg-background">
      <div className="container-page">
        <CartClient locale={locale} />
      </div>
    </section>
  );
}
