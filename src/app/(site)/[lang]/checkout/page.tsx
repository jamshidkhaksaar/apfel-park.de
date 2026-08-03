import type { Metadata } from "next";

import CheckoutClient from "@/components/checkout/CheckoutClient";
import { normalizeShippingMethod } from "@/lib/checkout";
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
    lang === "de" ? "Sicherer Checkout" : "Secure Checkout",
    lang === "de"
      ? "Schließe deine Bestellung bei Apfel Park sicher ab und bezahle bequem mit Stripe oder PayPal."
      : "Complete your Apfel Park order securely and choose convenient payment with Stripe or PayPal.",
    "/checkout",
    undefined,
    { noindex: true },
  );
};

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ shipping?: string }>;
}) {
  const [{ lang }, query] = await Promise.all([params, searchParams]);
  const locale = lang === "en" ? "en" : "de";

  return (
    <section className="section-pad bg-background">
      <div className="container-page">
        <CheckoutClient locale={locale} initialShippingMethod={normalizeShippingMethod(query.shipping)} />
      </div>
    </section>
  );
}
