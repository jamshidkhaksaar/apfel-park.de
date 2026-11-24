import EmailObfuscationBoundary from '@/components/EmailObfuscationBoundary';
import type { Metadata } from "next";
import Link from "next/link";

import PageIntro from "../../../../components/PageIntro";
import { createMetadata } from "../../../../lib/metadata";
import { requireLocale } from "@/lib/route-locale";
import { deliveryReturnsIntro, deliveryReturnsSections } from '@/lib/page-copy/delivery-returns';

export const dynamic = "force-dynamic";

export const generateMetadata = async ({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> => {
  const { lang: rawLang } = await params;
  const lang = requireLocale(rawLang);
  return createMetadata(lang, lang === "de" ? "Lieferung & Rückgabe" : "Delivery & Returns", lang === "de" ? "Informationen zu Versand, Widerruf und Rückgabe." : "Shipping, withdrawal, and return information.", "/delivery-returns");
};

export default async function DeliveryReturnsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: rawLang } = await params;
  const lang = requireLocale(rawLang);
  const isGerman = lang === "de";
  const sections = deliveryReturnsSections(lang);
  const intro = deliveryReturnsIntro(lang);

  return (
    <div className="bg-background">
      <PageIntro title={intro.title} subtitle={intro.subtitle} eyebrow={isGerman ? "Online Shop" : "Online Store"} />
      <section className="section-pad">
        <div className="container-page max-w-4xl space-y-6">
          <div className="tech-card flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gold/30 p-6">
            <p className="text-sm text-foreground">
              {isGerman
                ? "Sie möchten eine Bestellung widerrufen? Nutzen Sie unsere Online-Widerrufsfunktion:"
                : "Want to withdraw from an order? Use our online withdrawal function:"}
            </p>
            <Link href={`/${lang}/withdrawal`} className="btn-primary shrink-0">
              {isGerman ? "Vertrag widerrufen" : "Withdraw from contract"}
            </Link>
          </div>
          {sections.map((section) => (
            <div key={section.title} className="tech-card rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-foreground">{section.title}</h2>
              <ul className="mt-4 space-y-2 text-sm text-muted">
                {section.body.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                    {item.includes('@') ? <EmailObfuscationBoundary>{item}</EmailObfuscationBoundary> : item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <p className="text-sm text-muted">
            <Link href={`/${lang}/terms`} className="text-gold underline underline-offset-4">
              {isGerman ? "Zu den AGB" : "View terms & conditions"}
            </Link>
            {" · "}
            <Link href={`/${lang}/device-conditions`} className="text-gold underline underline-offset-4">
              {isGerman ? "Gerätezustände & Ihre Rechte" : "Device conditions & your rights"}
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
