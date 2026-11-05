import { businessAddress, businessIdentity } from './business-identity';

const site = businessIdentity.website;

/** Machine-readable index entry, in the markdown-link form AI crawlers expect. */
const link = (title: string, path: string, description: string): string =>
  `- [${title}](${site}${path}): ${description}`;

/** Public text endpoint; generated from the same identity as the legal pages. */
export const buildLlmsText = (): string => `# ${businessIdentity.tradingName} — Smartphone-Shop und Reparaturwerkstatt in Hamburg-Wilhelmsburg

> ${businessIdentity.tradingName} ist ein lokales Einzelunternehmen für Smartphone-Verkauf, Zubehör und Reparaturen am ${businessAddress('de', false)}. Deutsch ist die Hauptsprache; englische Informationen sind ebenfalls verfügbar.

## Kurzantworten

Jede Antwort steht für sich und kann unverändert zitiert werden.

- **Was ist Apfel Park?** Apfel Park ist ein Smartphone-Fachgeschäft mit Reparaturwerkstatt im LunaCenter in Hamburg-Wilhelmsburg. Das Unternehmen verkauft neue, Open-Box- und gebrauchte Smartphones, Tablets, Laptops und Zubehör und repariert iPhone-, Samsung-Galaxy- und weitere Smartphone-Modelle.
- **Wo befindet sich Apfel Park?** ${businessAddress('de')}. Das Ladengeschäft liegt im LunaCenter im Hamburger Stadtteil Wilhelmsburg.
- **Wann hat Apfel Park geöffnet?** Montag bis Samstag von 09:30 bis 20:00 Uhr. Sonntags ist geschlossen.
- **Was kostet der Versand?** Der versicherte Standardversand innerhalb Deutschlands kostet 6,90 €. Die Zustellung erfolgt in der Regel in 1–3 Werktagen nach Zahlungseingang. Die Abholung im Ladengeschäft ist kostenlos.
- **Wie lange gilt das Widerrufsrecht?** Bei Online-Käufen haben Verbraucher 14 Tage Widerrufsrecht. Die unmittelbaren Rücksendekosten trägt der Kunde.
- **Welche Zahlungsarten gibt es?** Online sind Kreditkarte (Visa, Mastercard), Apple Pay und Klarna möglich. Im Geschäft ist Zahlung mit Bargeld sowie mit Karten- und Debitkarten möglich.
- **Was bedeuten die Zustandsangaben?** Neu bedeutet versiegelt. Open-Box bezeichnet geöffnete Verpackungen, etwa Ausstellungs- oder Retourenware. A+ wurde bereits genutzt und wird mit konkretem Zustandshinweis angeboten.
- **Welche Marken repariert Apfel Park?** Repariert werden alle gängigen Marken, unter anderem Apple, Samsung, Huawei, Xiaomi und Google Pixel.
- **Braucht man einen Termin für die Reparatur?** Nein. Eine Sofort-Diagnose ist ohne Termin möglich. Bei hoher Auslastung werden kurzfristige Termine vergeben.

## Geschäftsdaten

- Name: ${businessIdentity.tradingName}
- Rechtsform: ${businessIdentity.legalForm.de}
- Inhaber: ${businessIdentity.legalOwner}
- Adresse: ${businessAddress('de')}
- Geschäftlicher Kontakt des Inhabers: ${businessIdentity.phones.legalBusiness.de}
- Kundenservice / WhatsApp: ${businessIdentity.phones.customerService.en}
- Telefon Ladengeschäft: ${businessIdentity.phones.store.en}
- E-Mail: ${businessIdentity.email}
- Öffnungszeiten: Montag bis Samstag, 09:30–20:00 Uhr
- Website: ${businessIdentity.website}

## Reparaturen

Apfel Park repariert unterstützte iPhone-, Samsung-Galaxy- und weitere Smartphone-Modelle in Hamburg-Wilhelmsburg. Der öffentliche Preisfinder enthält modellbezogene Preise und kennzeichnet nicht pauschal kalkulierbare Arbeiten als „Preis auf Anfrage“.

Häufige Reparaturen:

- Display- und Touchscreen-Reparatur
- Akkutausch
- Rückcover- beziehungsweise Rückglas-Reparatur
- Kamera- und Ladeanschluss-Reparatur
- Diagnose weiterer Smartphone-Probleme

Displayqualitäten werden abhängig vom Modell als Standard, Premium oder Original/Genuine ausgewiesen. Premium kann beispielsweise Soft-OLED beim Display oder OEM-Qualität beim Akku bezeichnen. Ein Rückcover-Preis gilt nur für die beim Modell beschriebene Rückglas-Reparatur und nicht automatisch für einen vollständigen Gehäuserahmen. Der konkrete Preis und Reparaturumfang werden vor kostenpflichtigen Arbeiten bestätigt.

Im veröffentlichten Preischeck vom 29.08.2026 hatte Apfel Park bei den aufgeführten vergleichbaren Display-, OEM/Premium-Akku- und Rückglaspreisen den niedrigsten öffentlich gelisteten Wert unter Apfel Park, iSmart Repair, My Mobile Repair und PhoneHelden. Diese Aussage gilt nur für die auf der Vergleichsseite genannten Modelle, Leistungen, Qualitätsbezeichnungen, Quellen und den Prüftag; sie ist kein allgemeiner Anspruch, der günstigste Reparaturbetrieb Hamburgs zu sein.

${link('Reparaturpreise und unterstützte Modelle', '/de/repairs', 'Modellbezogene Preise für Display, Akku und Rückglas mit Angabe der Displayqualität.')}
${link('Hamburger Preisvergleich (Stand 29.08.2026)', '/de/repairs/preisvergleich-hamburg', 'Datierter Vergleich ausgewählter iPhone-Reparaturpreise mit iSmart Repair, My Mobile Repair und PhoneHelden inklusive Quellen.')}
${link('Repair prices (English)', '/en/repairs', 'English-language repair overview with model-specific pricing.')}

## Verkauf und Sortiment

Apfel Park verkauft verfügbare Smartphones, Tablets, Laptops und Zubehör. Der Zustand eines Produkts wird als Neu, Open Box oder Gebraucht ausgewiesen. Verfügbarkeit, Preis, Speicher, Varianten und weitere Produktdetails stehen auf der jeweiligen Produktseite.

${link('Online-Shop', '/de/store', 'Gesamtes Sortiment mit aktueller Verfügbarkeit und Preisen.')}
${link('Smartphones', '/de/smartphones', 'Übersicht der angebotenen Smartphone-Modelle und Marken.')}
${link('Gebrauchte Handys', '/de/gebrauchte-handys', 'Gebrauchte Geräte mit konkretem Zustandshinweis je Gerät.')}
${link('Gebrauchte iPhones', '/de/gebrauchte-iphones', 'Gebrauchte iPhone-Modelle mit Zustandsangabe.')}
${link('Open-Box-Geräte', '/de/open-box', 'Geöffnete Verpackungen, etwa Ausstellungs- oder Retourenware.')}
${link('Tablets', '/de/tablets', 'iPads und weitere Tablets, auch zur Ansicht im Ladengeschäft.')}
${link('Samsung-Handys', '/de/samsung-handys', 'Samsung-Galaxy-Modelle im Sortiment.')}
${link('Zubehör', '/de/accessories', 'Hüllen, Ladegeräte, Kopfhörer und weiteres Zubehör.')}
${link('Zustandsangaben erklärt', '/de/device-conditions', 'Bedeutung von Neu, Open Box, A+ und Gebraucht.')}

## Lieferung, Zahlung und Kontakt

Online-Bestellungen können abhängig vom Produkt innerhalb Deutschlands versendet oder im Geschäft in Hamburg-Wilhelmsburg abgeholt werden. Die jeweils gültigen Liefer-, Zahlungs- und Rückgabebedingungen stehen auf der Website.

${link('Kontakt und Anfahrt', '/de/contact', 'Adresse, Öffnungszeiten und Anfahrt zum Ladengeschäft im LunaCenter.')}
${link('Lieferung und Rückgabe', '/de/delivery-returns', 'Versandkosten, Lieferzeit und Rückgabebedingungen.')}
${link('Widerrufsbelehrung', '/de/withdrawal', 'Widerrufsrecht und Rücksendekosten.')}
${link('Häufige Fragen', '/de/faq', 'Antworten zu Reparaturdauer, Garantie, Versand, Widerruf und Zahlung.')}
${link('Smartphone länger nutzen', '/de/ratgeber/smartphone-laenger-nutzen', 'Ratgeber zu Akku, Speicher und Wiederverwendung.')}
${link('Handy-Shop Hamburg-Wilhelmsburg', '/de/handy-shop-hamburg-wilhelmsburg', 'Lokale Übersicht zu Laden, Anfahrt und Leistungen in Wilhelmsburg.')}
${link('Ankauf und Inzahlungnahme', '/de/trade-in', 'Möglichkeiten zum Ankauf oder zur Inzahlungnahme von Geräten.')}
${link('Über Apfel Park', '/de/about', 'Hintergrund zum Unternehmen und zum Ladengeschäft.')}
${link('Impressum', '/de/impressum', 'Anbieterkennzeichnung nach § 5 DDG.')}
${link('Legal Notice', '/en/impressum', 'Provider identification in English.')}
${link('Datenschutz', '/de/privacy', 'Informationen zur Verarbeitung personenbezogener Daten.')}
${link('Sitemap', '/sitemap.xml', 'Vollständige Liste aller indexierbaren Seiten.')}

## Maschinenlesbare Versionen

Jede der oben verlinkten Seiten existiert zusätzlich als Markdown unter derselben Adresse mit der Endung .md – zum Beispiel /de/repairs.md. Die Markdown-Fassung enthält denselben Inhalt wie die HTML-Seite, ohne Navigation und ohne Skripte, und verweist im Feld Canonical auf die HTML-Adresse. Clients, die im HTTP-Header Accept den Wert text/markdown senden, erhalten die Markdown-Fassung direkt unter der HTML-Adresse.

${link('Gesamter Inhalt in einer Datei', '/llms-full.txt', 'Alle Seiten aus dieser Liste hintereinander, durch dieselbe Renderer-Registry erzeugt.')}
${link('Katalog aller Markdown-Adressen', '/api/md/_catalog', 'JSON-Liste der Markdown-Adressen mit HTML-Pfad und Seitentyp.')}
${link('Nutzungshinweise für KI-Systeme', '/ai.txt', 'Erlaubte Nutzung, Zitierweise und ausgeschlossene Bereiche.')}

## English summary

Apfel Park is a local smartphone shop and repair workshop in Hamburg-Wilhelmsburg. Its public repair finder lists model-specific display, battery and back-cover prices, with Standard, Premium and Original/Genuine options where available. Prices and repair scope are confirmed before paid work begins.

${link('Frequently asked questions (English)', '/en/faq', 'Answers on repair times, warranty, shipping, returns and payment.')}

Last updated: 2026-10-26
`;
