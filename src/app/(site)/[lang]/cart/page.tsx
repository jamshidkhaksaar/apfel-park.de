import type { Metadata } from "next";

import CartClient from "@/components/checkout/CartClient";
import { createMetadata } from "@/lib/metadata";
import type { Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> => {
  const { lang } = await params;
  return createMetadata(
    lang as Locale,
    lang === "de" ? "Warenkorb" : "Cart",
    lang === "de" ? "Prüfe deine Auswahl und starte den sicheren Checkout." : "Review your items and start secure checkout.",
    "/cart",
  );
};

export default async function CartPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale = lang === "en" ? "en" : "de";

  return (
    <section className="section-pad bg-background">
      <div className="container-page">
        <CartClient locale={locale} />
      </div>
    </section>
  );
}

