import type { Metadata } from "next";

import CheckoutClient from "@/components/checkout/CheckoutClient";
import { normalizeShippingMethod } from "@/lib/checkout";
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
    "Checkout",
    lang === "de" ? "Sicher mit Stripe oder PayPal bezahlen." : "Pay securely with Stripe or PayPal.",
    "/checkout",
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

