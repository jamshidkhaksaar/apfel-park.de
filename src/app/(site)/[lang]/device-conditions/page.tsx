import type { Metadata } from "next";
import Link from "next/link";

import PageIntro from "../../../../components/PageIntro";
import { createMetadata } from "../../../../lib/metadata";
import { requireLocale } from "@/lib/route-locale";
import { deviceConditionSections, deviceConditionsIntro } from "@/lib/page-copy/device-conditions";

export const dynamic = "force-dynamic";

export const generateMetadata = async ({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> => {
  const { lang: rawLang } = await params;
  const lang = requireLocale(rawLang);
  return createMetadata(
    lang,
    lang === "de" ? "Gerätezustände & Ihre Rechte" : "Device conditions & your rights",
    lang === "de"
      ? "Was Versiegelt, Unboxed und Gebraucht bei Apfel Park bedeuten - und welche Rechte Sie beim Kauf haben."
      : "What Sealed, Unboxed and Used mean at Apfel Park - and your legal rights when buying.",
    "/device-conditions",
  );
};

export default async function DeviceConditionsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: rawLang } = await params;
  const lang = requireLocale(rawLang);
  const isGerman = lang === "de";

  const sections = deviceConditionSections(lang);
  const intro = deviceConditionsIntro(lang);

  return (
    <div className="bg-background">
      <PageIntro
        title={intro.title}
        subtitle={intro.subtitle}
        eyebrow={isGerman ? "Online Shop" : "Online Store"}
      />
      <section className="section-pad">
        <div className="container-page max-w-4xl space-y-6">
          {sections.map((section) => (
            <div key={section.title} className="tech-card rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-foreground">{section.title}</h2>
              <ul className="mt-4 space-y-2 text-sm text-muted">
                {section.body.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <p className="text-sm text-muted">
            <Link href={`/${lang}/terms`} className="text-gold underline underline-offset-4">
              {isGerman ? "Details in den AGB" : "Full details in our terms & conditions"}
            </Link>
            {" · "}
            <Link href={`/${lang}/delivery-returns`} className="text-gold underline underline-offset-4">
              {isGerman ? "Lieferung & Widerruf" : "Delivery & withdrawal"}
            </Link>
            {" · "}
            <Link href={`/${lang}/withdrawal`} className="text-gold underline underline-offset-4">
              {isGerman ? "Vertrag widerrufen" : "Withdraw from contract"}
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
