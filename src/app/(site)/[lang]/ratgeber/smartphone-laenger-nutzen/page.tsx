import type { Metadata } from "next";
import Link from "next/link";

import PageIntro from "@/components/PageIntro";
import { createMetadata } from "@/lib/metadata";
import { requireLocale } from "@/lib/route-locale";
import { safeJsonStringify } from "@/lib/security";
import { siteInfo } from "@/lib/site";

type GuideSection = {
  title: string;
  paragraphs: string[];
  items?: string[];
};

type GuideContent = {
  eyebrow: string;
  title: string;
  subtitle: string;
  sections: GuideSection[];
  helpTitle: string;
  helpText: string;
  links: Array<{ href: string; label: string }>;
};

const guidePath = "/ratgeber/smartphone-laenger-nutzen";

const content: Record<"de" | "en", GuideContent> = {
  de: {
    eyebrow: "Ratgeber",
    title: "Smartphone länger nutzen: reparieren, gebraucht kaufen oder ersetzen?",
    subtitle: "Eine praktische Orientierung für Reparatur, Gebrauchtkauf, Datensicherung und die sichere Weitergabe von Smartphones.",
    sections: [
      {
        title: "Reparieren oder ersetzen?",
        paragraphs: [
          "Ein Smartphone muss bei einem Defekt nicht automatisch ersetzt werden. Prüfen Sie zuerst, was genau beschädigt ist, wie wichtig das Gerät im Alltag ist und wie lange es noch genutzt werden soll.",
          "Eine Reparatur kann sinnvoll sein, wenn nur Display, Akku, Ladebuchse oder Rückseite betroffen sind und das Gerät noch ausreichend leistungsfähig ist. Ein Ersatz kann besser passen, wenn mehrere teure Schäden vorliegen oder wichtige Ersatzteile nicht verfügbar sind.",
        ],
      },
      {
        title: "Akku, Display und Ladeanschluss prüfen",
        paragraphs: ["Bei einem gebrauchten oder beschädigten Gerät sollten mindestens diese Funktionen geprüft werden:"],
        items: [
          "Akku: Laufzeit, ungewöhnliche Erwärmung und sichtbare Beschädigungen",
          "Display: Helligkeit, Touch-Funktion, tote Pixel und Risse",
          "Kameras, Blitz, Lautsprecher und Mikrofon",
          "Ladeanschluss und sicherer Kontakt mit einem passenden Kabel",
          "Mobilfunk, WLAN, Bluetooth und GPS",
          "Tasten, Face ID oder Fingerabdrucksensor, falls vorhanden",
          "Gehäuse auf Verformung, Feuchtigkeitsspuren oder lose Teile",
        ],
      },
      {
        title: "Gebraucht, Open-Box oder refurbished",
        paragraphs: [
          "Die Bezeichnungen werden nicht überall gleich verwendet. Fragen Sie deshalb nach dem konkreten Zustand des Geräts, dem Lieferumfang, der Batterieinformation und den geltenden Garantie- oder Gewährleistungsangaben.",
        ],
        items: [
          "Gebraucht: Das Gerät wurde bereits genutzt; Gebrauchsspuren und Technik sollten beschrieben und geprüft werden.",
          "Open-Box: Die Verpackung wurde geöffnet; der genaue Zustand sollte ausdrücklich erklärt werden.",
          "Refurbished: Das Gerät wurde geprüft und gegebenenfalls instandgesetzt; Umfang und Ergebnis der Prüfung sollten nachvollziehbar sein.",
        ],
      },
      {
        title: "Aktivierungssperre und Konten prüfen",
        paragraphs: [
          "Vor dem Kauf eines gebrauchten iPhones oder Android-Geräts sollte sichergestellt sein, dass das Gerät vom vorherigen Konto getrennt wurde und sich zurücksetzen und neu einrichten lässt.",
          "Nach dem Zurücksetzen darf kein unbekanntes Apple- oder Google-Konto die Einrichtung blockieren. Kaufbeleg oder eine nachvollziehbare Herkunft sind ebenfalls hilfreich.",
        ],
      },
      {
        title: "Daten vor Reparatur, Trade-in oder Weitergabe sichern",
        paragraphs: ["Vor einer Reparatur: Sichern Sie Ihre Daten und folgen Sie den Anweisungen des Reparaturbetriebs. Bei Trade-in, Spende oder Weitergabe gelten zusätzlich die Schritte zur Kontentfernung und zum Zurücksetzen:"],
        items: [
          "Fotos, Kontakte, Nachrichten und wichtige Dateien sichern und die Sicherung prüfen",
          "Authenticator-Apps, Passkeys und Banking-Zugänge berücksichtigen",
          "Bei Trade-in, Spende oder Weitergabe SIM-Karte und Speicherkarte entfernen",
          "Erst bei Trade-in, Spende oder Weitergabe Geräteortung deaktivieren und Apple-ID oder Google-Konto entfernen",
          "Bei Trade-in, Spende oder Weitergabe Zahlungs- und Banking-Apps abmelden",
          "Bei Trade-in, Spende oder Weitergabe das Gerät erst nach erfolgreicher Sicherung auf Werkseinstellungen zurücksetzen",
        ],
      },
      {
        title: "Einstellungen für eine längere Nutzung",
        paragraphs: ["Einige einfache Einstellungen können Sicherheit und Alltag verbessern:"],
        items: [
          "Automatische Updates aktivieren, soweit verfügbar",
          "Gerätesperre und Zwei-Faktor-Schutz verwenden",
          "Regelmäßige Sicherungen einrichten",
          "Schrift- und Anzeigegröße an den eigenen Bedarf anpassen",
          "Nicht benötigte Apps und Berechtigungen entfernen",
          "Ladegerät und Kabel auf Beschädigungen prüfen",
        ],
      },
    ],
    helpTitle: "Hilfe in Hamburg",
    helpText: "Apfel Park in Hamburg bietet Smartphone-Verkauf, Reparatur, Zubehör, gebrauchte und Open-Box-Geräte sowie Unterstützung bei Einrichtung und Datenübertragung. Die passende Lösung hängt vom konkreten Gerät, Schaden, Zustand und Datenbedarf ab.",
    links: [
      { href: "/repairs", label: "Reparatur und Service" },
      { href: "/gebrauchte-handys", label: "Gebrauchte Handys" },
      { href: "/open-box", label: "Open-Box-Geräte" },
      { href: "/smartphones", label: "Smartphones" },
      { href: "/contact", label: "Kontakt" },
    ],
  },
  en: {
    eyebrow: "Guide",
    title: "Make your smartphone last longer: repair, buy used, or replace it?",
    subtitle: "A practical guide to repair, used devices, backups, account security, and safe handover.",
    sections: [
      {
        title: "Repair or replace?",
        paragraphs: [
          "A damaged smartphone does not always need to be replaced. Start by checking what is actually damaged, how important the device is in daily life, and how long you want to keep using it.",
          "Repair may make sense when only the display, battery, charging port, or back is affected and the device still meets your needs. Replacement may be more suitable when several expensive faults are present or important parts are unavailable.",
        ],
      },
      {
        title: "Check the battery, display, and charging port",
        paragraphs: ["For a used or damaged device, check at least these functions:"],
        items: [
          "Battery: runtime, unusual heat, and visible damage",
          "Display: brightness, touch response, dead pixels, and cracks",
          "Cameras, flash, speakers, and microphone",
          "Charging port and a stable connection with a suitable cable",
          "Mobile network, Wi-Fi, Bluetooth, and GPS",
          "Buttons, Face ID, or fingerprint sensor where available",
          "Body for bending, moisture marks, or loose parts",
        ],
      },
      {
        title: "Used, open-box, or refurbished",
        paragraphs: [
          "These labels are not used consistently everywhere. Ask about the exact condition, included items, battery information, and the applicable warranty or statutory rights.",
        ],
        items: [
          "Used: The device has been used before; wear and technical condition should be described and checked.",
          "Open-box: The packaging has been opened; the exact condition should be explained clearly.",
          "Refurbished: The device has been tested and may have been serviced; the scope and outcome of testing should be clear.",
        ],
      },
      {
        title: "Check activation locks and accounts",
        paragraphs: [
          "Before buying a used iPhone or Android device, make sure it has been removed from the previous account and can be reset and set up again.",
          "After a reset, an unknown Apple or Google account must not block setup. Proof of purchase or a traceable source is also useful.",
        ],
      },
      {
        title: "Back up data before repair, trade-in, or handover",
        paragraphs: ["Before a repair: back up your data and follow the repair provider's instructions. For a trade-in, donation, or handover, also complete the account-removal and reset steps below:"],
        items: [
          "Back up photos, contacts, messages, and important files, then check the backup",
          "Account for authenticator apps, passkeys, and banking access",
          "For a trade-in, donation, or handover, remove the SIM and memory card",
          "Only for a trade-in, donation, or handover, turn off device tracking and remove the Apple or Google account",
          "For a trade-in, donation, or handover, sign out of payment and banking apps",
          "For a trade-in, donation, or handover, reset the device only after the backup has succeeded",
        ],
      },
      {
        title: "Settings for longer use",
        paragraphs: ["A few simple settings can improve security and everyday use:"],
        items: [
          "Enable automatic updates where available",
          "Use a device lock and two-factor protection",
          "Set up regular backups",
          "Adjust text and display size to your needs",
          "Remove apps and permissions you no longer need",
          "Check chargers and cables for damage",
        ],
      },
    ],
    helpTitle: "Help in Hamburg",
    helpText: "Apfel Park in Hamburg offers smartphones, repairs, accessories, used and open-box devices, plus help with setup and data transfer. The right choice depends on the specific device, fault, condition, and data needs.",
    links: [
      { href: "/repairs", label: "Repairs and service" },
      { href: "/gebrauchte-handys", label: "Used phones" },
      { href: "/open-box", label: "Open-box devices" },
      { href: "/smartphones", label: "Smartphones" },
      { href: "/contact", label: "Contact" },
    ],
  },
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang: rawLang } = await params;
  const lang = requireLocale(rawLang);
  const locale = lang === "en" ? "en" : "de";
  const copy = content[locale];
  return createMetadata(locale, copy.title, copy.subtitle, guidePath);
}

export default async function SmartphoneLongevityGuidePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: rawLang } = await params;
  const lang = requireLocale(rawLang);
  const locale = lang === "en" ? "en" : "de";
  const copy = content[locale];
  const pageUrl = `${siteInfo.url}/${locale}${guidePath}`;
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${pageUrl}#article`,
    headline: copy.title,
    description: copy.subtitle,
    url: pageUrl,
    inLanguage: locale === "de" ? "de-DE" : "en-DE",
    articleSection: locale === "de" ? "Smartphone-Ratgeber" : "Smartphone guide",
    author: { "@id": `${siteInfo.url}/#store` },
    publisher: { "@id": `${siteInfo.url}/#store` },
    mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: locale === "de" ? "Startseite" : "Home", item: `${siteInfo.url}/${locale}` },
      { "@type": "ListItem", position: 2, name: copy.eyebrow, item: pageUrl },
    ],
  };

  return (
    <div className="bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonStringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonStringify(breadcrumbJsonLd) }} />
      <PageIntro title={copy.title} subtitle={copy.subtitle} eyebrow={copy.eyebrow} />
      <article className="section-pad">
        <div className="container-page max-w-4xl">
          <div className="space-y-10">
            {copy.sections.map((section) => (
              <section key={section.title} className="tech-card rounded-2xl p-6 md:p-8">
                <h2 className="text-2xl font-bold text-foreground">{section.title}</h2>
                <div className="mt-4 space-y-4 text-muted leading-relaxed">
                  {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                </div>
                {section.items ? (
                  <ul className="mt-5 list-disc space-y-2 pl-5 text-muted leading-relaxed marker:text-gold">
                    {section.items.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>

          <section className="mt-10 rounded-3xl border border-gold/20 bg-gold/5 p-6 md:p-8">
            <h2 className="text-2xl font-bold text-foreground">{copy.helpTitle}</h2>
            <p className="mt-4 text-muted leading-relaxed">{copy.helpText}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              {copy.links.map((item) => (
                <Link key={item.href} href={`/${locale}${item.href}`} className="btn-secondary inline-flex">
                  {item.label}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </article>
    </div>
  );
}
