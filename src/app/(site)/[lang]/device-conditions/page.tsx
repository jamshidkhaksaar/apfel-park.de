import type { Metadata } from "next";
import Link from "next/link";

import PageIntro from "../../../../components/PageIntro";
import { createMetadata } from "../../../../lib/metadata";
import { requireLocale } from "@/lib/route-locale";

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

  const sections = isGerman
    ? [
        {
          title: "Versiegelt (Neu)",
          body: [
            "Originalverpackte, ungeöffnete Neuware. Zusätzliche Garantieangaben stehen am jeweiligen Produkt.",
            "Gesetzliche Gewährleistung: 24 Monate.",
          ],
        },
        {
          title: "Unboxed (Open-Box)",
          body: [
            "Geöffnete, aber unbenutzte oder kaum benutzte Geräte - z. B. Vorführgeräte oder Retouren.",
            "Jedes Gerät wird von uns vollständig geprüft und funktionsgetestet.",
            "Der genaue Zustand steht als Hinweis auf der Produktseite; bei Bedarf zeigen wir echte Fotos des Geräts.",
            "Sie sparen gegenüber dem Neupreis - bei voller Funktionsfähigkeit.",
          ],
        },
        {
          title: "Gebraucht A+",
          body: [
            "Geprüfte Gebrauchtgeräte in sehr gutem Zustand mit Zustandshinweis auf der Produktseite.",
            "Bei gebrauchten iPhones geben wir die gemessene Batteriekapazität an.",
            "Zu jedem Gerät erhalten Sie eine ordnungsgemäße Rechnung; bei Gebrauchtware kann Differenzbesteuerung nach §25a UStG gelten (kein gesonderter USt-Ausweis).",
          ],
        },
        {
          title: "Ihre gesetzlichen Rechte",
          body: [
            "Widerrufsrecht: Beim Online-Kauf haben Verbraucher 14 Tage Widerrufsrecht - unabhängig vom Gerätezustand. Am einfachsten über unsere Online-Widerrufsfunktion ('Vertrag widerrufen').",
            "Sie dürfen die Ware prüfen und testen, wie es zur Feststellung von Beschaffenheit, Eigenschaften und Funktionsweise nötig ist - auch ein Telefon einschalten und kurz in Betrieb nehmen.",
            "Ein Wertersatz-Abzug kommt nur bei Nutzung über das Testen hinaus in Betracht und bemisst sich immer am tatsächlichen, nachweisbaren Wertverlust - keine Pauschalen.",
            "Gewährleistung: Wir verkürzen die gesetzliche Gewährleistungsfrist nicht - sie beträgt 24 Monate ab Übergabe, auch bei Open-Box- und Gebrauchtgeräten.",
            "Normale Abnutzung (z. B. nachlassende Akkukapazität) ist kein Mangel im Sinne der Gewährleistung.",
            "Ihre Mängelrechte bei tatsächlichen Defekten bleiben unberührt.",
          ],
        },
        {
          title: "Unser Versprechen",
          body: [
            "Kundenretouren werden ausschließlich als Unboxed oder Gebraucht wieder angeboten - niemals als 'Versiegelt'.",
            "Jedes Unboxed- und Gebrauchtgerät wird vor dem Verkauf technisch geprüft.",
            "Der Zustand wird transparent auf der Produktseite ausgewiesen - was Sie sehen, ist was Sie bekommen.",
            "Beim Kauf eines Unboxed- oder Gebrauchtgeräts bestätigen Sie im Checkout, dass Sie den ausgewiesenen Zustand kennen. Diese Bestätigung speichern wir zusammen mit Ihrer Bestellung.",
          ],
        },
      ]
    : [
        {
          title: "Sealed (New)",
          body: [
            "Factory-sealed, unopened new devices. Any additional warranty is stated on the product page.",
            "Statutory warranty: 24 months.",
          ],
        },
        {
          title: "Unboxed (Open-Box)",
          body: [
            "Opened but unused or barely used devices - e.g. display units or returns.",
            "Every device is fully inspected and function-tested by us.",
            "The exact condition is noted on the product page; on request we provide real photos of the device.",
            "You save compared to the new price - with full functionality.",
          ],
        },
        {
          title: "Used A+",
          body: [
            "Inspected pre-owned devices in very good condition, with a condition note on the product page.",
            "For used iPhones we state the measured battery health.",
            "You receive a proper invoice with every device; used goods may be sold under the margin scheme (§25a UStG, no separate VAT shown).",
          ],
        },
        {
          title: "Your legal rights",
          body: [
            "Right of withdrawal: for online purchases, consumers have a 14-day withdrawal right - regardless of device condition. Easiest via our online withdrawal function ('Withdraw contract').",
            "You may examine and test the goods as needed to establish their nature, characteristics, and functioning - including switching a phone on and briefly setting it up.",
            "A value-loss deduction only applies to use beyond testing and is always based on the actual, provable loss of value - no flat rates.",
            "Statutory warranty: we do not shorten the statutory warranty period - it is 24 months from delivery, including for open-box and used devices.",
            "Normal wear and tear (e.g. declining battery capacity) is not a defect under warranty law.",
            "Your rights regarding actual defects remain unaffected.",
          ],
        },
        {
          title: "Our promise",
          body: [
            "Customer returns are re-sold exclusively as Unboxed or Used - never as 'Sealed'.",
            "Every unboxed and used device is technically inspected before sale.",
            "The condition is shown transparently on the product page - what you see is what you get.",
            "When buying an unboxed or used device, you confirm at checkout that you are aware of the stated condition. We store this confirmation with your order.",
          ],
        },
      ];

  return (
    <div className="bg-background">
      <PageIntro
        title={isGerman ? "Gerätezustände & Ihre Rechte" : "Device conditions & your rights"}
        subtitle={
          isGerman
            ? "Versiegelt, Unboxed oder Gebraucht - so kaufen Sie transparent und rechtssicher bei Apfel Park."
            : "Sealed, Unboxed or Used - transparent, legally sound buying at Apfel Park."
        }
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
