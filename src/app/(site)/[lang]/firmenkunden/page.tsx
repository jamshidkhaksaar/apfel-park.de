import type { Metadata } from "next";
import Link from "next/link";

import PageIntro from "../../../../components/PageIntro";
import { createMetadata } from "../../../../lib/metadata";
import { siteInfo } from "../../../../lib/site";
import { requireLocale } from "@/lib/route-locale";

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

export default async function BusinessCustomersPage({ params }: { params: Promise<{ lang: string }> }) {
  const lang = requireLocale((await params).lang);
  const isGerman = lang === "de";

  const services = isGerman
    ? [
        {
          title: "Reparaturen für Firmengeräte",
          body: [
            "Smartphones, Tablets und Laptops — von Display- und Akkuschäden bis zur Platinenreparatur.",
            "Diagnose und Preis vor Beginn der Arbeit; keine Reparatur ohne Ihre Freigabe.",
            "Mehrere Geräte bearbeiten wir gesammelt und stellen eine Rechnung.",
          ],
        },
        {
          title: "Gerätebeschaffung für Teams",
          body: [
            "Neue, Open-Box- und geprüfte Gebrauchtgeräte — auch in Stückzahlen.",
            "Sie erhalten ein schriftliches Angebot mit Preis, Zustand und Lieferzeit.",
            "Rechnung mit ausgewiesener Umsatzsteuer.",
          ],
        },
        {
          title: "Zubehör in Mengen",
          body: [
            "Ladekabel, Netzteile, Hüllen, Panzerglas, Kopfhörer und Powerbanks.",
            "Größere Stückzahlen auf Anfrage — mit Lieferung innerhalb Deutschlands oder Abholung in Hamburg.",
            "Auch als wiederkehrende Bestellung nach Absprache.",
          ],
        },
        {
          title: "Ankauf & Rücknahme von Altgeräten",
          body: [
            "Wir prüfen den Ankauf ausgemusterter Firmengeräte nach Absprache.",
            "Der ermittelte Wert kann mit einer Neuanschaffung verrechnet werden.",
          ],
        },
        {
          title: "Rahmenaufträge & feste Ansprechperson",
          body: [
            "Für wiederkehrende Bedarfe vereinbaren wir feste Abläufe und Konditionen.",
            "Eine Sammelrechnung ist nach Absprache möglich.",
          ],
        },
      ]
    : [
        {
          title: "Repairs for company devices",
          body: [
            "Smartphones, tablets and laptops — from screen and battery damage to board-level repair.",
            "Diagnosis and price before work starts; no repair without your approval.",
            "We handle multiple devices together and issue one invoice.",
          ],
        },
        {
          title: "Device procurement for teams",
          body: [
            "New, open-box and tested used devices — including larger quantities.",
            "You receive a written quote with price, condition and delivery time.",
            "Invoice with itemised VAT.",
          ],
        },
        {
          title: "Accessories in bulk",
          body: [
            "Charging cables, power adapters, cases, screen protectors, headphones and power banks.",
            "Larger quantities on request — delivered within Germany or collected in Hamburg.",
            "Also available as a recurring order by arrangement.",
          ],
        },
        {
          title: "Purchase & buy-back of old devices",
          body: [
            "We assess the purchase of retired company devices by arrangement.",
            "The agreed value can be offset against a new purchase.",
          ],
        },
        {
          title: "Standing orders & a fixed contact",
          body: [
            "For recurring needs we agree fixed processes and terms.",
            "A consolidated invoice is possible by arrangement.",
          ],
        },
      ];

  const process = isGerman
    ? [
        { title: "1. Anfrage", body: "Per Formular, E-Mail oder Telefon — nennen Sie Geräte, Stückzahl und gewünschten Zeitrahmen." },
        { title: "2. Angebot", body: "Wir prüfen den Bedarf und senden ein Angebot, in der Regel innerhalb von 1–2 Werktagen." },
        { title: "3. Durchführung", body: "Nach Ihrer Freigabe; Abgabe im Laden in Wilhelmsburg oder nach Absprache." },
        { title: "4. Abschluss", body: "Fertigstellung, Rechnung und Rückgabe — mit fester Ansprechperson." },
      ]
    : [
        { title: "1. Enquiry", body: "Via form, email or phone — tell us the devices, quantity and your timeframe." },
        { title: "2. Quote", body: "We assess the requirement and send a quote, usually within 1–2 business days." },
        { title: "3. Delivery", body: "After your approval; drop-off at our Wilhelmsburg store or by arrangement." },
        { title: "4. Completion", body: "Completion, invoice and hand-back — with a fixed contact person." },
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
        <div className="container-page max-w-4xl space-y-8">
          <div className="tech-card flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gold/30 p-6">
            <p className="text-sm text-foreground">
              {isGerman
                ? "Sie haben einen Firmenbedarf? Senden Sie uns die Geräte, Stückzahl und Ihren Zeitrahmen — wir melden uns in der Regel innerhalb von 1–2 Werktagen mit einem Angebot."
                : "Have a business requirement? Send us the devices, quantity and your timeframe — we usually reply with a quote within 1–2 business days."}
            </p>
            <Link href={`/${lang}/contact`} className="btn-primary shrink-0">
              {isGerman ? "Unternehmensanfrage stellen" : "Send a business enquiry"}
            </Link>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground">{isGerman ? "Was wir für Unternehmen übernehmen" : "What we handle for businesses"}</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {services.map(service => (
                <div key={service.title} className="tech-card rounded-2xl p-5">
                  <h3 className="font-semibold text-foreground">{service.title}</h3>
                  <ul className="mt-3 space-y-2 text-sm text-muted">
                    {service.body.map(item => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground">{isGerman ? "So läuft die Zusammenarbeit" : "How the process works"}</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {process.map(step => (
                <div key={step.title} className="tech-card rounded-2xl p-5">
                  <h3 className="font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted">{step.body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="tech-card rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-foreground">{isGerman ? "Warum Apfel Park" : "Why Apfel Park"}</h2>
            <ul className="mt-4 space-y-2 text-sm text-muted">
              {reasons.map(item => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground">{isGerman ? "Häufige Fragen von Unternehmen" : "Frequently asked business questions"}</h2>
            <div className="mt-4 divide-y divide-border/70 border-y border-border/70">
              {faqs.map(faq => (
                <details key={faq.q} className="group py-5 transition-colors">
                  <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-foreground">
                    <span>{faq.q}</span>
                    <span className="text-muted transition-transform group-open:rotate-180" aria-hidden="true">▾</span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>

          <div className="tech-card rounded-2xl border border-gold/30 p-6">
            <h2 className="text-lg font-semibold text-foreground">{isGerman ? "Kontakt für Unternehmen" : "Business contact"}</h2>
            <p className="mt-2 text-sm text-muted">
              {isGerman ? "Rufen Sie uns an oder schreiben Sie uns mit Angabe von Geräten und Stückzahl." : "Call us or email us stating your devices and quantity."}
            </p>
            <p className="mt-3 text-sm text-foreground">
              <a href={`tel:${siteInfo.landlineE164}`} className="text-gold underline underline-offset-4">{siteInfo.landline}</a>
              {" · "}
              <a href={`mailto:${siteInfo.email}`} className="text-gold underline underline-offset-4">{siteInfo.email}</a>
            </p>
            <p className="mt-4 text-sm text-muted">
              <Link href={`/${lang}/repairs`} className="text-gold underline underline-offset-4">{isGerman ? "Reparaturpreise ansehen" : "See repair prices"}</Link>
              {" · "}
              <Link href={`/${lang}/store`} className="text-gold underline underline-offset-4">{isGerman ? "Zum Shop" : "To the store"}</Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
