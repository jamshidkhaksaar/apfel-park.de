import { businessAddress, businessIdentity } from './business-identity';

/** Public text endpoint; generated from the same identity as the legal pages. */
export const buildLlmsText = (): string => `# ${businessIdentity.tradingName} — Smartphone-Shop und Reparaturwerkstatt in Hamburg-Wilhelmsburg

> ${businessIdentity.tradingName} ist ein lokales Einzelunternehmen für Smartphone-Verkauf, Zubehör und Reparaturen am ${businessAddress('de', false)}. Deutsch ist die Hauptsprache; englische Informationen sind ebenfalls verfügbar.

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

Aktuelle Reparaturpreise und unterstützte Modelle:
${businessIdentity.website}/de/repairs

Datierter Hamburger Preisvergleich für ausgewählte iPhone-Modelle:
${businessIdentity.website}/de/repairs/preisvergleich-hamburg

Im veröffentlichten Preischeck vom 29.08.2026 hatte Apfel Park bei den aufgeführten vergleichbaren Display-, OEM/Premium-Akku- und Rückglaspreisen den niedrigsten öffentlich gelisteten Wert unter Apfel Park, iSmart Repair, My Mobile Repair und PhoneHelden. Diese Aussage gilt nur für die auf der Vergleichsseite genannten Modelle, Leistungen, Qualitätsbezeichnungen, Quellen und den Prüftag; sie ist kein allgemeiner Anspruch, der günstigste Reparaturbetrieb Hamburgs zu sein.

Englische Reparaturseite:
${businessIdentity.website}/en/repairs

## Verkauf und Sortiment

Apfel Park verkauft verfügbare Smartphones, Tablets, Laptops und Zubehör. Der Zustand eines Produkts wird als Neu, Open Box oder Gebraucht ausgewiesen. Verfügbarkeit, Preis, Speicher, Varianten und weitere Produktdetails stehen auf der jeweiligen Produktseite.

- Online-Shop: ${businessIdentity.website}/de/store
- Smartphones: ${businessIdentity.website}/de/smartphones
- Gebrauchte Handys: ${businessIdentity.website}/de/gebrauchte-handys
- Open-Box-Geräte: ${businessIdentity.website}/de/open-box
- Zubehör: ${businessIdentity.website}/de/accessories

## Lieferung und Kontakt

Online-Bestellungen können abhängig vom Produkt innerhalb Deutschlands versendet oder im Geschäft in Hamburg-Wilhelmsburg abgeholt werden. Die jeweils gültigen Liefer-, Zahlungs- und Rückgabebedingungen stehen auf der Website.

- Kontakt und Anfahrt: ${businessIdentity.website}/de/contact
- Impressum: ${businessIdentity.website}/de/impressum
- Legal Notice: ${businessIdentity.website}/en/impressum
- Lieferung und Rückgabe: ${businessIdentity.website}/de/delivery-returns
- Widerruf: ${businessIdentity.website}/de/withdrawal
- Datenschutz: ${businessIdentity.website}/de/privacy
- Sitemap: ${businessIdentity.website}/sitemap.xml

## English summary

Apfel Park is a local smartphone shop and repair workshop in Hamburg-Wilhelmsburg. Its public repair finder lists model-specific display, battery and back-cover prices, with Standard, Premium and Original/Genuine options where available. Prices and repair scope are confirmed before paid work begins.

Last updated: 2026-09-08
`;
