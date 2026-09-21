import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import PageIntro from "../../../../components/PageIntro";
import { createMetadata } from "../../../../lib/metadata";
import { siteInfo } from "../../../../lib/site";
import { requireLocale } from "@/lib/route-locale";
import TrusmiPartner from '@/components/TrusmiPartner';

export const dynamic = "force-dynamic";

export const generateMetadata = async ({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> => {
  const lang = requireLocale((await params).lang);
  return createMetadata(
    lang,
    lang === "de"
      ? "Handy-Reparatur für Unternehmen in Hamburg"
      : "Phone repair & device procurement for businesses in Hamburg",
    lang === "de"
      ? "Reparaturen, Geräte und Zubehör für Hamburger Unternehmen: Firmengeräte-Reparatur, Mengenbestellungen und Gerätebeschaffung auf Rechnung. Angebot in 1–2 Werktagen."
      : "Repairs, devices and accessories for Hamburg businesses: company device repair, bulk orders and device procurement on invoice. Quote within 1–2 business days.",
    "/firmenkunden",
  );
};

const Icon = ({ children, className = "h-6 w-6" }: { children: ReactNode; className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

const IconRepair = () => (
  <Icon><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76Z" /></Icon>
);
const IconDevices = () => (
  <Icon><rect x="7" y="2" width="10" height="20" rx="2" /><path d="M11 18h2" /></Icon>
);
const IconAccessories = () => (
  <Icon><path d="M3 14v-2a9 9 0 0 1 18 0v2" /><rect x="3" y="14" width="4" height="6" rx="1" /><rect x="17" y="14" width="4" height="6" rx="1" /></Icon>
);
const IconTradeIn = () => (
  <Icon><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" /><path d="M3 21v-5h5" /></Icon>
);
const IconContract = () => (
  <Icon><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /><path d="M8 13h8M8 17h5" /></Icon>
);
const IconCheck = () => (
  <Icon className="h-5 w-5"><path d="M20 6 9 17l-5-5" /></Icon>
);
const IconShield = () => (
  <Icon className="h-5 w-5"><path d="M12 2 4 5v6c0 5 3.4 8.5 8 11 4.6-2.5 8-6 8-11V5Z" /></Icon>
);
const IconClock = () => (
  <Icon className="h-5 w-5"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Icon>
);
const IconInvoice = () => (
  <Icon className="h-5 w-5"><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h3" /></Icon>
);
const IconChat = () => (
  <Icon className="h-5 w-5"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12Z" /></Icon>
);
const IconDownload = () => (
  <Icon><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></Icon>
);

export default async function BusinessCustomersPage({ params }: { params: Promise<{ lang: string }> }) {
  const lang = requireLocale((await params).lang);
  const isGerman = lang === "de";

  const services = [
    {
      icon: <IconRepair />,
      title: isGerman ? "Reparaturen für Firmengeräte" : "Repairs for company devices",
      body: isGerman
        ? ["Smartphones, Tablets und Laptops — von Display- und Akkuschäden bis zur Platinenreparatur.", "Diagnose und Preis vor Beginn der Arbeit; keine Reparatur ohne Ihre Freigabe.", "Mehrere Geräte bearbeiten wir gesammelt und stellen eine Rechnung."]
        : ["Smartphones, tablets and laptops — from screen and battery damage to board-level repair.", "Diagnosis and price before work starts; no repair without your approval.", "We handle multiple devices together and issue one invoice."],
    },
    {
      icon: <IconDevices />,
      title: isGerman ? "Gerätebeschaffung für Teams" : "Device procurement for teams",
      body: isGerman
        ? ["Neue, Open-Box- und geprüfte Gebrauchtgeräte — auch in Stückzahlen.", "Schriftliches Angebot mit Preis, Zustand und Lieferzeit.", "Rechnung mit ausgewiesener Umsatzsteuer."]
        : ["New, open-box and tested used devices — including larger quantities.", "A written quote with price, condition and delivery time.", "Invoice with itemised VAT."],
    },
    {
      icon: <IconAccessories />,
      title: isGerman ? "Zubehör in Mengen" : "Accessories in bulk",
      body: isGerman
        ? ["Ladekabel, Netzteile, Hüllen, Panzerglas, Kopfhörer und Powerbanks.", "Größere Stückzahlen auf Anfrage — Lieferung in Deutschland oder Abholung in Hamburg.", "Auch als wiederkehrende Bestellung nach Absprache."]
        : ["Charging cables, power adapters, cases, screen protectors, headphones and power banks.", "Larger quantities on request — shipped within Germany or collected in Hamburg.", "Also available as a recurring order by arrangement."],
    },
    {
      icon: <IconTradeIn />,
      title: isGerman ? "Ankauf von Altgeräten" : "Buy-back of old devices",
      body: isGerman
        ? ["Wir prüfen den Ankauf ausgemusterter Firmengeräte nach Absprache.", "Der ermittelte Wert kann mit einer Neuanschaffung verrechnet werden."]
        : ["We assess the purchase of retired company devices by arrangement.", "The agreed value can be offset against a new purchase."],
    },
    {
      icon: <IconContract />,
      title: isGerman ? "Rahmenaufträge & feste Ansprechperson" : "Standing orders & a fixed contact",
      body: isGerman
        ? ["Für wiederkehrende Bedarfe vereinbaren wir feste Abläufe und Konditionen.", "Eine Sammelrechnung ist nach Absprache möglich."]
        : ["For recurring needs we agree fixed processes and terms.", "A consolidated invoice is possible by arrangement."],
    },
  ];

  const process = isGerman
    ? [
        { title: "Anfrage", body: "Per Formular, E-Mail oder Telefon — nennen Sie Geräte, Stückzahl und Zeitrahmen." },
        { title: "Angebot", body: "Wir prüfen den Bedarf und senden ein Angebot, in der Regel in 1–2 Werktagen." },
        { title: "Durchführung", body: "Nach Ihrer Freigabe; Abgabe im Laden in Wilhelmsburg oder nach Absprache." },
        { title: "Abschluss", body: "Fertigstellung, Rechnung und Rückgabe — mit fester Ansprechperson." },
      ]
    : [
        { title: "Enquiry", body: "Via form, email or phone — tell us the devices, quantity and timeframe." },
        { title: "Quote", body: "We assess the requirement and send a quote, usually within 1–2 business days." },
        { title: "Delivery", body: "After your approval; drop-off at our Wilhelmsburg store or by arrangement." },
        { title: "Completion", body: "Completion, invoice and hand-back — with a fixed contact person." },
      ];

  const reasons = isGerman
    ? [
        "Werkstatt und Laden vor Ort in Hamburg-Wilhelmsburg — kein anonymer Versandhändler.",
        "Klare, vorab genannte Preise ohne Überraschungen.",
        `Rechnung mit ausgewiesener Umsatzsteuer (USt-IdNr. ${siteInfo.vatId}).`,
        "Beratung auf Deutsch und Englisch.",
      ]
    : [
        "A local workshop and store in Hamburg-Wilhelmsburg — not an anonymous mail-order seller.",
        "Clear prices agreed up front, with no surprises.",
        `Invoice with itemised VAT (VAT ID ${siteInfo.vatId}).`,
        "Advice in German and English.",
      ];

  const trust = isGerman
    ? [
        { icon: <IconInvoice />, label: "Rechnung mit USt.-Ausweis" },
        { icon: <IconClock />, label: "Angebot in 1–2 Werktagen" },
        { icon: <IconShield />, label: "Gesetzliche Gewährleistung" },
        { icon: <IconChat />, label: "Beratung auf DE & EN" },
      ]
    : [
        { icon: <IconInvoice />, label: "Invoice with VAT" },
        { icon: <IconClock />, label: "Quote within 1–2 business days" },
        { icon: <IconShield />, label: "Statutory warranty" },
        { icon: <IconChat />, label: "Advice in DE & EN" },
      ];

  const faqs = isGerman
    ? [
        { q: "Bekommen wir eine Rechnung?", a: "Ja, mit ausgewiesener Umsatzsteuer. Eine Sammelrechnung ist nach Absprache möglich." },
        { q: "Gibt es Mindestmengen?", a: "Nein. Wir bearbeiten auch einzelne Geräte. Bei größeren Mengen erhalten Sie individuelle Konditionen auf Anfrage." },
        { q: "Wie lange dauert eine Reparatur?", a: "Viele Reparaturen erledigen wir am selben oder nächsten Werktag, abhängig von Modell und Ersatzteil. Müssen wir ein Teil bestellen, nennen wir die Dauer im Angebot." },
        { q: "Holen Sie Geräte ab?", a: "Für Unternehmen in Hamburg ist eine Abholung nach Absprache möglich. Alternativ geben Sie die Geräte im Laden ab oder senden sie ein." },
        { q: "Gilt eine Garantie auf Reparaturen?", a: "Auf Reparaturen gilt die gesetzliche Gewährleistung. Die genauen Bedingungen bestätigen wir vor der Reparatur." },
        { q: "Ist ein Rahmenvertrag möglich?", a: "Ja, für wiederkehrende Bedarfe vereinbaren wir Rahmenbedingungen auf Anfrage." },
      ]
    : [
        { q: "Do we receive an invoice?", a: "Yes, with itemised VAT. A consolidated invoice is possible by arrangement." },
        { q: "Is there a minimum quantity?", a: "No. We handle single devices too. For larger volumes you receive individual terms on request." },
        { q: "How long does a repair take?", a: "Many repairs are done the same or next business day, depending on model and part. If we need to order a part, we state the time in the quote." },
        { q: "Do you collect devices?", a: "Collection is possible for businesses in Hamburg by arrangement. Alternatively, drop devices off at the store or send them in." },
        { q: "Is there a warranty on repairs?", a: "Statutory warranty applies to repairs. We confirm the exact terms before the repair." },
        { q: "Is a service agreement possible?", a: "Yes, we agree framework terms for recurring needs on request." },
      ];

  return (
    <div className="bg-background">
      <PageIntro
        title={isGerman ? "Smartphone- und Geräte-Service für Unternehmen" : "Smartphone and device services for businesses"}
        subtitle={isGerman ? "Reparaturen, Gerätebeschaffung und Zubehör für Firmen in Hamburg — auf Rechnung, mit fester Ansprechperson." : "Repairs, device procurement and accessories for businesses in Hamburg — on invoice, with a fixed contact."}
        eyebrow={isGerman ? "Firmenkunden & B2B" : "Business & B2B"}
      />

      <section className="section-pad">
        <div className="container-page max-w-5xl space-y-20">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <h2 className="text-balance text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {isGerman ? "Ein Ansprechpartner für Geräte, Reparaturen und Zubehör" : "One contact for devices, repairs and accessories"}
              </h2>
              <p className="mt-4 max-w-xl leading-relaxed text-muted">
                {isGerman
                  ? "Apfel Park betreut Unternehmen in Hamburg-Wilhelmsburg: defekte Firmengeräte reparieren, mehrere Geräte gesammelt abwickeln, Teams mit Geräten und Zubehör ausstatten — transparent, auf Rechnung und ohne anonymer Versandhändler zu sein."
                  : "Apfel Park serves businesses in Hamburg-Wilhelmsburg: repair faulty company devices, handle multiple units together, equip teams with devices and accessories — transparent, on invoice, and without being an anonymous mail-order seller."}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={`/${lang}/contact`} className="btn-primary">
                  {isGerman ? "Unternehmensanfrage stellen" : "Send a business enquiry"}
                </Link>
                <Link href={`/${lang}/repairs`} className="btn-secondary">
                  {isGerman ? "Reparaturpreise ansehen" : "See repair prices"}
                </Link>
              </div>
            </div>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-4">
              {trust.map(item => (
                <li key={item.label} className="flex items-center gap-3 text-sm text-muted">
                  <span className="text-gold">{item.icon}</span>
                  {item.label}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col items-start justify-between gap-5 rounded-2xl border border-border bg-surface/40 px-6 py-5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <span className="shrink-0 text-gold"><IconDownload /></span>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {isGerman ? "Unternehmensprofil (PDF)" : "Company profile (PDF)"}
                </p>
                <p className="text-xs leading-5 text-muted">
                  {isGerman
                    ? "Firmenprofil, Leistungen und Kontaktdaten zum Weiterleiten an Ihre Einkaufs- oder IT-Abteilung."
                    : "Profile, services and contact details to forward to your procurement or IT team."}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <a href="/downloads/apfel-park-unternehmensprofil.pdf" download className="btn-secondary">
                {isGerman ? "Deutsch (PDF)" : "German (PDF)"}
              </a>
              <a href="/downloads/apfel-park-company-profile.pdf" download className="btn-secondary">
                {isGerman ? "Englisch (PDF)" : "English (PDF)"}
              </a>
            </div>
          </div>

          <div id="trusmi" className="scroll-mt-32">
            <TrusmiPartner locale={lang} wholesale />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gold">{isGerman ? "Leistungen" : "Services"}</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {isGerman ? "Was wir für Unternehmen übernehmen" : "What we handle for businesses"}
            </h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2" data-business-services>
              {services.map(service => (
                <article key={service.title} className="min-w-0 rounded-2xl border border-border bg-background p-5 sm:p-6 sm:last:odd:col-span-2">
                  <div className="flex items-center gap-3">
                    <span aria-hidden="true" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gold/20 bg-gold/5 text-gold">{service.icon}</span>
                    <h3 className="font-semibold leading-snug text-foreground">{service.title}</h3>
                  </div>
                  <ul className="mt-5 space-y-2.5 text-sm leading-relaxed text-muted">
                    {service.body.map(item => (
                      <li key={item} className="flex items-start gap-2.5">
                        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gold" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gold">{isGerman ? "Ablauf" : "Process"}</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {isGerman ? "So läuft die Zusammenarbeit" : "How the process works"}
            </h2>
            <ol className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {process.map((step, index) => (
                <li key={step.title}>
                  <span className="block font-mono text-sm text-gold">0{index + 1}</span>
                  <span className="mt-3 block h-px w-full bg-border" />
                  <h3 className="mt-4 font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>

          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gold">{isGerman ? "Warum Apfel Park" : "Why Apfel Park"}</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {isGerman ? "Ein lokaler Partner, keine Plattform" : "A local partner, not a platform"}
              </h2>
              <p className="mt-4 leading-relaxed text-muted">
                {isGerman
                  ? "Sie erreichen direkt die Werkstatt in Wilhelmsburg — mit klaren Preisen, nachvollziehbaren Abläufen und einer festen Ansprechperson."
                  : "You reach the workshop in Wilhelmsburg directly — with clear prices, traceable processes and a fixed contact person."}
              </p>
            </div>
            <ul className="space-y-4">
              {reasons.map(reason => (
                <li key={reason} className="flex items-start gap-3 text-sm leading-relaxed text-muted">
                  <span className="mt-0.5 shrink-0 text-gold"><IconCheck /></span>
                  {reason}
                </li>
              ))}
            </ul>
          </div>

          <div className="mx-auto max-w-3xl">
            <h2 className="text-center text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {isGerman ? "Häufige Fragen von Unternehmen" : "Frequently asked business questions"}
            </h2>
            <div className="mt-8 divide-y divide-border/70 border-y border-border/70">
              {faqs.map(faq => (
                <details key={faq.q} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-foreground">
                    <span>{faq.q}</span>
                    <Icon className="h-5 w-5 shrink-0 text-muted transition-transform group-open:rotate-180"><path d="m6 9 6 6 6-6" /></Icon>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-border bg-surface/40 p-8 sm:p-10">
            <div className="pointer-events-none absolute inset-0 circuit-pattern opacity-10" />
            <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-xl font-bold text-foreground sm:text-2xl">{isGerman ? "Unternehmensanfrage" : "Business enquiry"}</h2>
                <p className="mt-2 text-sm text-muted">
                  {isGerman
                    ? "Nennen Sie uns Geräte, Stückzahl und Zeitrahmen — wir melden uns mit einem Angebot."
                    : "Tell us the devices, quantity and timeframe — we'll come back with a quote."}
                </p>
                <p className="mt-3 text-sm text-foreground">
                  <a href={`tel:${siteInfo.landlineE164}`} className="text-gold underline underline-offset-4">{siteInfo.landline}</a>
                  {" · "}
                  <a href={`mailto:${siteInfo.email}`} className="text-gold underline underline-offset-4">{siteInfo.email}</a>
                </p>
              </div>
              <Link href={`/${lang}/contact`} className="btn-primary shrink-0">
                {isGerman ? "Zum Kontaktformular" : "To the contact form"}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
