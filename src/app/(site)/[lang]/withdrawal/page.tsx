import type { Metadata } from "next";
import Link from "next/link";

import PageIntro from "../../../../components/PageIntro";
import WithdrawalForm from "../../../../components/WithdrawalForm";
import { type Locale } from "../../../../lib/i18n";
import { createMetadata } from "../../../../lib/metadata";

export const dynamic = "force-dynamic";

export const generateMetadata = async ({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> => {
  const { lang } = await params;
  const isGerman = lang !== "en";
  return createMetadata(
    lang as Locale,
    isGerman ? "Vertrag widerrufen" : "Withdraw from contract",
    isGerman
      ? "Widerrufen Sie Ihren Online-Kauf bei Apfel Park in zwei Schritten - ohne Angabe von Gründen."
      : "Withdraw from your Apfel Park online purchase in two steps - no reason required.",
    "/withdrawal",
  );
};

export default async function WithdrawalPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale = (lang === "en" ? "en" : "de") as Locale;
  const isGerman = locale === "de";

  return (
    <div className="bg-background">
      <PageIntro
        title={isGerman ? "Vertrag widerrufen" : "Withdraw from contract"}
        subtitle={
          isGerman
            ? "14 Tage Widerrufsrecht bei Online-Käufen - einfach, ohne Begründung."
            : "14-day withdrawal right for online purchases - simple, no reason needed."
        }
        eyebrow={isGerman ? "Online Shop" : "Online Store"}
      />
      <section className="section-pad">
        <div className="container-page max-w-3xl space-y-6">
          <WithdrawalForm lang={locale} />
          <p className="text-sm text-muted">
            {isGerman
              ? "Alle Informationen zu Widerruf, Rücksendung und Erstattung finden Sie unter "
              : "Full information about withdrawal, returns, and refunds: "}
            <Link href={`/${locale}/delivery-returns`} className="text-gold underline underline-offset-4">
              {isGerman ? "Lieferung & Rückgabe" : "Delivery & Returns"}
            </Link>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
