import type { Metadata } from "next";
import Link from "next/link";

import SafeEmailLink from "../../../../components/SafeEmailLink";
import { createMetadata } from "../../../../lib/metadata";
import { siteInfo } from "../../../../lib/site";
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
    lang === "de" ? "Impressum" : "Legal Notice",
    lang === "de"
      ? "Pflichtangaben gemäß § 5 DDG – Apfel Park, Hamburg."
      : "Legal notice pursuant to § 5 DDG – Apfel Park, Hamburg.",
    "/impressum",
  );
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="tech-card rounded-2xl p-6">
      <h2 className="mb-4 text-base font-semibold text-foreground">{title}</h2>
      <div className="space-y-1.5 text-sm text-muted">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-wrap gap-x-3">
      <span className="w-44 shrink-0 font-medium text-foreground/70">{label}</span>
      <span>{value}</span>
    </div>
  );
}

export default async function ImpressumPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang: rawLang } = await params;
  const lang = requireLocale(rawLang);
  const isGerman = lang === "de";

  return (
    <div className="bg-background">
      {/* Page header */}
      <section className="relative overflow-hidden border-b border-white/5 ocean-surface">
        <div className="absolute inset-0 circuit-pattern opacity-20" />
        <div className="absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/10 blur-[100px]" />
        <div className="container-page relative py-10 md:py-14">
          <div className="max-w-3xl space-y-3">
            <span className="badge-gold inline-flex text-xs">
              <span className="h-1.5 w-1.5 animate-gold-pulse rounded-full bg-gold" />
              {isGerman ? "Rechtliches" : "Legal"}
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              {isGerman ? "Impressum" : "Legal Notice"}
            </h1>
            <p className="text-base text-muted md:text-lg">
              {isGerman
                ? "Pflichtangaben gemäß § 5 DDG (Digitale-Dienste-Gesetz)"
                : "Mandatory information pursuant to § 5 DDG (Digital Services Act – Germany)"}
            </p>
          </div>
        </div>
      </section>

      <section className="section-pad">
        <div className="container-page max-w-4xl space-y-6">

          {/* Provider */}
          <Section title={isGerman ? "Angaben zum Unternehmen" : "Business Information"}>
            <Row label={isGerman ? "Unternehmensname" : "Company name"} value={siteInfo.legalName} />
            <Row
              label={isGerman ? "Inhaber" : "Owner"}
              value={siteInfo.owner.name}
            />
            <Row
              label={isGerman ? "Anschrift" : "Address"}
              value={
                <>
                  {siteInfo.address.street}
                  <br />
                  {siteInfo.address.postalCode} {siteInfo.address.city}
                  <br />
                  {isGerman ? "Deutschland" : "Germany"}
                </>
              }
            />
          </Section>

          {/* Contact */}
          <Section title={isGerman ? "Kontakt" : "Contact"}>
            <Row
              label={isGerman ? "Telefon / WhatsApp" : "Phone / WhatsApp"}
              value={
                <a href={`tel:${siteInfo.phone.replace(/\s/g, "")}`} className="transition hover:text-gold">
                  {siteInfo.phone}
                </a>
              }
            />
            <Row
              label={isGerman ? "Telefon Ladengeschäft" : "Store landline"}
              value={
                <a href={`tel:${siteInfo.landline.replace(/\s/g, "")}`} className="transition hover:text-gold">
                  {siteInfo.landline}
                </a>
              }
            />
            <Row
              label={isGerman ? "E-Mail" : "Email"}
              value={
                <SafeEmailLink email={siteInfo.email} className="transition hover:text-gold" />
              }
            />
            <Row
              label={isGerman ? "Website" : "Website"}
              value={
                <a href={siteInfo.url} className="transition hover:text-gold">
                  {siteInfo.url}
                </a>
              }
            />
          </Section>

          {/* Tax / VAT */}
          <Section title={isGerman ? "Steuerliche Angaben" : "Tax Information"}>
            <Row
              label={isGerman ? "USt-IdNr." : "VAT ID No."}
              value={
                <span className="font-mono font-semibold text-foreground tracking-wide">
                  {siteInfo.vatId}
                </span>
              }
            />
            <p className="mt-3 text-xs text-muted/60">
              {isGerman
                ? "Umsatzsteuer-Identifikationsnummer gemäß § 27a Umsatzsteuergesetz."
                : "VAT identification number in accordance with § 27a of the German Value Added Tax Act."}
            </p>
          </Section>

          {/* Responsible for content */}
          <Section
            title={
              isGerman
                ? "Verantwortlich für den Inhalt (§ 18 Abs. 2 MStV)"
                : "Responsible for Content (§ 18 para. 2 MStV)"
            }
          >
            <p>
              Apfel Park
              <br />
              {siteInfo.owner.name}
              <br />
              {siteInfo.address.street}, {siteInfo.address.postalCode} {siteInfo.address.city}
            </p>
          </Section>

          {/* Dispute resolution */}
          <Section
            title={
              isGerman ? "Streitschlichtung" : "Dispute Resolution"
            }
          >
            <p>
              {isGerman
                ? "Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:"
                : "The European Commission provides a platform for online dispute resolution (ODR):"}
            </p>
            <a
              href="https://ec.europa.eu/consumers/odr"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-gold transition hover:text-gold-soft"
            >
              https://ec.europa.eu/consumers/odr
            </a>
            <p className="mt-3">
              {isGerman
                ? "Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen."
                : "We are not willing or obliged to participate in dispute resolution proceedings before a consumer arbitration board."}
            </p>
          </Section>

          {/* Links to legal pages */}
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href={`/${lang}/privacy`}
              className="btn-secondary text-sm"
            >
              {isGerman ? "Datenschutzerklärung" : "Privacy Policy"}
            </Link>
            <Link
              href={`/${lang}/terms`}
              className="btn-secondary text-sm"
            >
              {isGerman ? "AGB" : "Terms & Conditions"}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
