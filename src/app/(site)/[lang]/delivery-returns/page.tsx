import type { Metadata } from "next";
import Link from "next/link";

import PageIntro from "../../../../components/PageIntro";
import { createMetadata } from "../../../../lib/metadata";
import { siteInfo } from "../../../../lib/site";
import { requireLocale } from "@/lib/route-locale";

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
  const sections = isGerman
    ? [
        {
          title: "Lieferung",
          body: [
            "Kostenlose Abholung im Store in Hamburg.",
            "Versicherter Versand innerhalb Deutschlands: 6,90 €.",
            "Lieferzeit: 1–3 Werktage nach Zahlungseingang, sofern beim Artikel nichts anderes angegeben ist.",
          ],
        },
        {
          title: "Widerrufsrecht (14 Tage)",
          body: [
            "Bei online geschlossenen Kaufverträgen haben Verbraucher 14 Tage Zeit, den Vertrag ohne Angabe von Gründen zu widerrufen — unabhängig davon, ob das Gerät als Versiegelt, Unboxed oder Gebraucht gekauft wurde.",
            "Die Frist beginnt mit Erhalt der Ware. Zur Ausübung genügt eine eindeutige Erklärung — am einfachsten über unsere Online-Widerrufsfunktion (Button oben), per E-Mail oder per Post.",
            "Nach Eingang Ihres Widerrufs erhalten Sie unverzüglich eine Eingangsbestätigung per E-Mail.",
          ],
        },
        {
          title: "Prüfen, Testen & Aktivieren",
          body: [
            "Sie dürfen die Ware so prüfen und ausprobieren, wie es zur Feststellung von Beschaffenheit, Eigenschaften und Funktionsweise nötig ist — vergleichbar mit dem Ausprobieren im Ladengeschäft.",
            "Dazu gehört auch das Einschalten und kurze Inbetriebnehmen eines Telefons. Eine darüber hinausgehende Nutzung (z. B. tage- oder wochenlanger Gebrauch) kann zu Wertersatz führen.",
          ],
        },
        {
          title: "Wertersatz bei Wertverlust",
          body: [
            "Ein Abzug (Wertersatz) kommt nur in Betracht, wenn der Wertverlust auf einen Umgang zurückgeht, der zur Prüfung von Beschaffenheit, Eigenschaften und Funktionsweise nicht notwendig war (§ 357a BGB).",
            "Ein Abzug richtet sich stets nach dem tatsächlichen, nachweisbaren Wertverlust im Einzelfall — es gibt keine pauschalen Abzüge.",
            "Das bloße Öffnen der Verpackung oder das Testen des Geräts begründet keinen Wertersatz.",
          ],
        },
        {
          title: "Erstattung",
          body: [
            "Nach einem wirksamen Widerruf erstatten wir alle Zahlungen einschließlich der Kosten der günstigsten Standardlieferung spätestens binnen 14 Tagen nach Eingang Ihrer Widerrufserklärung.",
            "Die Erstattung erfolgt über dasselbe Zahlungsmittel, das Sie bei der Bestellung verwendet haben.",
            "Wir dürfen die Erstattung zurückhalten, bis wir die Ware zurückerhalten haben oder Sie den Versand der Ware nachgewiesen haben.",
          ],
        },
        {
          title: "Rücksendekosten",
          body: [
            "Die unmittelbaren Kosten der Rücksendung tragen Sie als Kunde. Dieser Hinweis erfolgt hier ausdrücklich vor Vertragsschluss.",
            "Bei einem Mangel der Ware gelten Ihre gesetzlichen Mängelrechte — in diesem Fall tragen wir die Rücksendekosten.",
          ],
        },
        {
          title: "Originalverpackung",
          body: [
            "Eine Rücksendung ist auch ohne Originalverpackung möglich — das Widerrufsrecht hängt nicht davon ab.",
            "Bitte verpacken Sie das Gerät für den Transport dennoch sicher, um Schäden zu vermeiden.",
          ],
        },
        {
          title: "Hygiene-Ausnahme (eng begrenzt)",
          body: [
            "Nur bei versiegelten Waren, die aus Gründen des Gesundheitsschutzes oder der Hygiene nicht zur Rückgabe geeignet sind (z. B. versiegelte In-Ear-Kopfhörer), erlischt das Widerrufsrecht, wenn die Versiegelung nach der Lieferung entfernt wurde (§ 312g Abs. 2 Nr. 3 BGB).",
            "Die Versiegelung muss als solche erkennbar sein. Smartphones fallen nicht unter diese Ausnahme.",
          ],
        },
        {
          title: "Vor der Rücksendung eines Telefons",
          body: [
            "Sichern Sie Ihre Daten (Backup).",
            "iPhone: Apple-ID abmelden und „Wo ist?“ deaktivieren (Einstellungen → Ihr Name → Abmelden), anschließend „Alle Inhalte & Einstellungen löschen“.",
            "Android: Google-Konto entfernen und das Gerät auf Werkseinstellungen zurücksetzen.",
            "Geräte mit aktiver Aktivierungssperre (Activation Lock) können die Bearbeitung der Erstattung verzögern, da wir das Gerät nicht prüfen können.",
          ],
        },
        {
          title: "Muster-Widerruf",
          body: [
            `An: ${siteInfo.email.replace("@", " [at] ").replaceAll(".", " [dot] ")} — Hiermit widerrufe ich den von mir abgeschlossenen Vertrag über den Kauf der folgenden Waren: [Artikel], bestellt am: [Datum], erhalten am: [Datum], Name/Anschrift: [Ihre Angaben], Datum/Unterschrift (nur bei Mitteilung auf Papier).`,
          ],
        },
      ]
    : [
        {
          title: "Delivery",
          body: [
            "Free collection from our Hamburg store.",
            "Insured shipping within Germany: €6.90.",
            "Delivery time: 1–3 business days after payment, unless the product page states otherwise.",
          ],
        },
        {
          title: "Right of withdrawal (14 days)",
          body: [
            "For online consumer purchases, you have 14 days to withdraw without giving a reason — regardless of whether the device was bought as Sealed, Unboxed, or Used.",
            "The period starts when you receive the goods. A clear statement suffices — easiest via our online withdrawal function (button above), by email, or by post.",
            "After we receive your withdrawal you immediately get a receipt confirmation by email.",
          ],
        },
        {
          title: "Inspecting, testing & activating",
          body: [
            "You may examine and try out the goods as needed to establish their nature, characteristics, and functioning — comparable to trying them in a physical store.",
            "This includes switching a phone on and briefly setting it up. Use beyond that (e.g. days or weeks of regular use) can lead to a value-loss deduction.",
          ],
        },
        {
          title: "Compensation for loss of value",
          body: [
            "A deduction only applies where the loss of value results from handling that was not necessary to establish the nature, characteristics, and functioning of the goods (§ 357a BGB).",
            "Any deduction is always based on the actual, provable loss of value in the individual case — there are no flat-rate deductions.",
            "Merely opening the packaging or testing the device does not justify a deduction.",
          ],
        },
        {
          title: "Refund",
          body: [
            "After a valid withdrawal we refund all payments including the least expensive standard-delivery cost within 14 days of receiving your withdrawal notice.",
            "The refund uses the same payment method you used for the order.",
            "We may withhold the refund until we have received the goods back or you have provided proof of shipment.",
          ],
        },
        {
          title: "Return shipping costs",
          body: [
            "You bear the direct cost of returning the goods. We state this expressly here, before the contract is concluded.",
            "If the goods are defective, your statutory defect rights apply — in that case we bear the return costs.",
          ],
        },
        {
          title: "Original packaging",
          body: [
            "You can return goods without the original packaging — your withdrawal right does not depend on it.",
            "Please still pack the device securely for transport to avoid damage.",
          ],
        },
        {
          title: "Hygiene exception (narrow)",
          body: [
            "Only for sealed goods that are unsuitable for return for health or hygiene reasons (e.g. sealed in-ear headphones) does the withdrawal right expire once the seal is removed after delivery (§ 312g (2) No. 3 BGB).",
            "The seal must be recognizable as such. Smartphones are not covered by this exception.",
          ],
        },
        {
          title: "Before returning a phone",
          body: [
            "Back up your data.",
            "iPhone: sign out of your Apple ID and disable Find My (Settings → your name → Sign Out), then use 'Erase All Content and Settings'.",
            "Android: remove your Google account and factory-reset the device.",
            "Devices with an active activation lock can delay refund processing, as we cannot inspect the device.",
          ],
        },
        {
          title: "Model withdrawal notice",
          body: [
            `To: ${siteInfo.email.replace("@", " [at] ").replaceAll(".", " [dot] ")} — I hereby withdraw from the contract concluded by me for the purchase of the following goods: [items], ordered on: [date], received on: [date], name/address: [your details], date/signature (only for paper notice).`,
          ],
        },
      ];

  return (
    <div className="bg-background">
      <PageIntro title={isGerman ? "Lieferung & Rückgabe" : "Delivery & Returns"} subtitle={isGerman ? "Klare Informationen zu Versand, Widerruf und Rückgabe." : "Clear information about shipping, withdrawal, and returns."} eyebrow={isGerman ? "Online Shop" : "Online Store"} />
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
                    {item}
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
