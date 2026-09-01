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
      ? "Anbieterkennzeichnung gemäß § 5 DDG: Bismaillah Safi, handelnd unter Apfel Park, Hamburg."
      : "Legal notice pursuant to § 5 DDG: Bismaillah Safi, trading as Apfel Park, Hamburg.",
    "/impressum",
  );
};

function formatLegalDate(value: string, lang: "de" | "en") {
  return new Intl.DateTimeFormat(lang === "de" ? "de-DE" : "en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

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

          <div className="rounded-2xl border border-gold/25 bg-gold/5 p-6">
            <p className="font-semibold text-foreground">
              {isGerman
                ? "Apfel Park ist die Geschäftsbezeichnung des Einzelunternehmens von Bismaillah Safi."
                : "Apfel Park is the trading name of the sole proprietorship owned by Bismaillah Safi."}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {isGerman
                ? "Der Online-Shop und das Ladengeschäft in Hamburg werden von demselben Anbieter betrieben."
                : "The online store and the retail shop in Hamburg are operated by the same provider."}
            </p>
          </div>

          {/* Provider */}
          <Section title={isGerman ? "Angaben zum Unternehmen" : "Business Information"}>
            <Row
              label={isGerman ? "Geschäftsbezeichnung" : "Trading name"}
              value={siteInfo.name}
            />
            <Row
              label={isGerman ? "Rechtsform" : "Legal form"}
              value={isGerman ? siteInfo.legalFormDe : siteInfo.legalFormEn}
            />
            <Row
              label={isGerman ? "Diensteanbieter / Inhaber" : "Service provider / Owner"}
              value={siteInfo.legalName}
            />
            <Row
              label={isGerman ? "Anschrift" : "Address"}
              value={
                <address className="not-italic">
                  {siteInfo.address.street}
                  <br />
                  {siteInfo.address.postalCode} {siteInfo.address.city}
                  <br />
                  {isGerman ? "Deutschland" : "Germany"}
                </address>
              }
            />
          </Section>

          {/* Contact */}
          <Section title={isGerman ? "Kontakt" : "Contact"}>
            <Row
              label={isGerman ? "Kundenservice / WhatsApp" : "Customer service / WhatsApp"}
              value={
                <a href={`tel:${siteInfo.phone.replace(/\s/g, "")}`} className="transition hover:text-gold">
                  {siteInfo.phone}
                </a>
              }
            />
            <Row
              label={isGerman ? "Geschäftlicher Kontakt des Inhabers" : "Owner's business contact"}
              value={
                <a href={`tel:${siteInfo.owner.phoneE164}`} className="transition hover:text-gold">
                  {siteInfo.owner.phone}
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
                <a href={`/${lang}`} className="transition hover:text-gold">
                  {siteInfo.url}
                </a>
              }
            />
          </Section>

          {/* Business registration */}
          <Section title={isGerman ? "Gewerbeanmeldung" : "Business Registration"}>
            <Row
              label={isGerman ? "Art der Anzeige" : "Registration basis"}
              value={
                isGerman
                  ? siteInfo.businessRegistration.legalBasisDe
                  : siteInfo.businessRegistration.legalBasisEn
              }
            />
            <Row
              label={isGerman ? "Anmeldestelle" : "Registration authority"}
              value={siteInfo.businessRegistration.authority}
            />
            <Row
              label={isGerman ? "Betriebsbeginn" : "Business commenced"}
              value={
                <time dateTime={siteInfo.businessRegistration.businessStartDate}>
                  {formatLegalDate(siteInfo.businessRegistration.businessStartDate, lang)}
                </time>
              }
            />
            <Row
              label={isGerman ? "Bescheinigt am" : "Certificate issued"}
              value={
                <time dateTime={siteInfo.businessRegistration.certificateDate}>
                  {formatLegalDate(siteInfo.businessRegistration.certificateDate, lang)}
                </time>
              }
            />
            <Row
              label={isGerman ? "Handelsregister" : "Commercial register"}
              value={
                isGerman
                  ? siteInfo.businessRegistration.commercialRegisterDe
                  : siteInfo.businessRegistration.commercialRegisterEn
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
                ? "Verantwortlich für journalistisch-redaktionelle Inhalte (§ 18 Abs. 2 MStV)"
                : "Responsible for Journalistic-Editorial Content (§ 18 para. 2 MStV)"
            }
          >
            <address className="not-italic">
              {siteInfo.legalName}
              <br />
              {siteInfo.address.street}, {siteInfo.address.postalCode} {siteInfo.address.city}
            </address>
          </Section>

          {/* Dispute resolution */}
          <Section
            title={
              isGerman
                ? "Verbraucherstreitbeilegung (§ 36 VSBG)"
                : "Consumer Dispute Resolution (§ 36 VSBG)"
            }
          >
            <p>
              {isGerman
                ? "Wir sind weder verpflichtet noch bereit, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen."
                : "We are neither obliged nor willing to participate in dispute resolution proceedings before a consumer arbitration board."}
            </p>
          </Section>

          {!isGerman && (
            <p className="text-xs leading-relaxed text-muted/70">
              The German version of this legal notice is authoritative. This English translation is provided for convenience.
            </p>
          )}

          <p className="text-xs text-muted/60">
            {isGerman ? "Stand der Anbieterangaben:" : "Provider information last reviewed:"}{" "}
            <time dateTime="2026-08-13">{formatLegalDate("2026-08-13", lang)}</time>
          </p>

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
