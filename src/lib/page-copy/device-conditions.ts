/**
 * Copy of /device-conditions, shared by the page and its markdown twin.
 */

import type { Locale } from '@/lib/i18n';

export type PageSection = { title: string; body: string[] };

export const deviceConditionsIntro = (locale: Locale) => locale === 'de'
  ? { title: 'Gerätezustände & Ihre Rechte', subtitle: 'Versiegelt, Unboxed oder Gebraucht - so kaufen Sie transparent und rechtssicher bei Apfel Park.' }
  : { title: 'Device conditions & your rights', subtitle: 'Sealed, Unboxed or Used - transparent, legally sound buying at Apfel Park.' };

export const deviceConditionSections = (locale: Locale): PageSection[] => {
  const isGerman = locale === 'de';
  return isGerman
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
          title: "A+",
          body: [
            "Geprüfte Gebrauchtgeräte in sehr gutem Zustand mit Zustandshinweis auf der Produktseite.",
            "Bei A+-iPhones geben wir die Batteriekapazität als Einzelwert oder Bereich an.",
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
          title: "A+",
          body: [
            "Inspected pre-owned devices in very good condition, with a condition note on the product page.",
            "For A+ iPhones we state battery health as a single value or a range.",
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
};
