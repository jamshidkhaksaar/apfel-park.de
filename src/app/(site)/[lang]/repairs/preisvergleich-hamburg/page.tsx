import type { Metadata } from "next";
import Link from "next/link";

import { createMetadata } from "@/lib/metadata";
import { getRepairCatalog } from "@/lib/repair-catalog";
import { isRepairBenchmarkPublished, repairBenchmark, repairBenchmarkFields } from "@/lib/repair-price-benchmark";
import { requireLocale } from "@/lib/route-locale";
import { safeJsonStringify } from "@/lib/security";
import { siteInfo } from "@/lib/site";

const path = "/repairs/preisvergleich-hamburg";
const shopKeys = ["apfelPark", "ismart", "myMobileRepair", "phoneHelden"] as const;

type PriceKey = (typeof repairBenchmarkFields)[number]["key"];

const euro = (value: number, locale: "de" | "en") =>
  new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-DE", { style: "currency", currency: "EUR" }).format(value);

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang: rawLang } = await params;
  const lang = requireLocale(rawLang);
  return createMetadata(
    lang,
    lang === "de" ? "Handy-Reparatur Preisvergleich Hamburg" : "Phone Repair Price Comparison Hamburg",
    lang === "de"
      ? "Datiertes Preisbeispiel für iPhone-Display, Akku und Rückglas bei Apfel Park, iSmart Repair, My Mobile Repair und PhoneHelden in Hamburg."
      : "Dated price examples for iPhone displays, batteries and rear glass from Apfel Park, iSmart Repair, My Mobile Repair and PhoneHelden in Hamburg.",
    path,
    undefined,
    { noindex: !isRepairBenchmarkPublished() },
  );
}

export default async function RepairPriceComparisonPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: rawLang } = await params;
  const lang = requireLocale(rawLang);
  const de = lang === "de";
  if (!isRepairBenchmarkPublished()) {
    return (
      <section className="section-pad bg-background">
        <div className="container-page max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            {de ? "Preisvergleich" : "Price comparison"}
          </p>
          <h1 className="mt-4 text-3xl font-bold text-foreground md:text-5xl">
            {de ? "Dieser Vergleich wird fachlich geprüft." : "This comparison is under evidence review."}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted">
            {de
              ? "Wir veröffentlichen Vergleichspreise erst wieder, wenn Quelle, Datum, Leistungsumfang und Teilequalität für jeden Eintrag dokumentiert sind."
              : "We will republish comparison prices only after source, date, service scope, and part quality are documented for every entry."}
          </p>
          <Link href={`/${lang}/repairs`} className="btn-primary mt-7 inline-flex">
            {de ? "Aktuelle eigene Reparaturpreise" : "Current repair prices"}
          </Link>
        </div>
      </section>
    );
  }
  const pageUrl = `${siteInfo.url}/${lang}${path}`;

  // Apfel Park's own prices come from the same store_settings row the repair
  // finder reads, so this table cannot drift from what the shop actually
  // quotes. Only models with a real stored price are published.
  const catalog = await getRepairCatalog();

  // The stored catalog carries no model-level price: each model lists repair
  // parts whose variants hold the real quotes. Showing the cheapest variant per
  // repair type gives the honest "ab" price the shop confirms on site.
  const partLabels: Record<string, { de: string; en: string }> = {
    Display: { de: "Display", en: "Screen" },
    Battery: { de: "Akku", en: "Battery" },
    "Back Cover": { de: "Rückseite", en: "Back cover" },
    Camera: { de: "Kamera", en: "Camera" },
    "Charging Port": { de: "Ladebuchse", en: "Charging port" },
    Speaker: { de: "Lautsprecher", en: "Speaker" },
    Microphone: { de: "Mikrofon", en: "Microphone" },
    Glass: { de: "Glas", en: "Glass" },
    Motherboard: { de: "Mainboard", en: "Mainboard" },
  };
  const partLabel = (name: string) => partLabels[name]?.[de ? "de" : "en"] ?? name;

  const familyTitle = (brand: string, family: string) =>
    /^iphone$/i.test(family)
      ? `${brand} iPhone`
      : /series$/i.test(family)
        ? `${brand} Galaxy ${family.replace(/\s*Series$/i, "")}`
        : `${brand} ${family}`;

  const priceFamilies = catalog.brands
    .flatMap((brand) => brand.families.map((family) => ({ brand: brand.name, family: family.name, models: family.models })))
    .filter(({ family }) => /^iphone$/i.test(family) || /^(s|a) series$/i.test(family))
    .map(({ brand, family, models }) => {
      const rows = models
        .filter((model) => (/^iphone$/i.test(family) ? /iphone (1[3-7]|air)/i.test(model.name) : true))
        .map((model) => {
          const cells = (model.parts ?? [])
            .map((part) => {
              const prices = (part.variants ?? [])
                .map((variant) => variant.price)
                .filter((price): price is number => typeof price === "number" && price > 0);
              return prices.length > 0 ? { part: part.name, price: Math.min(...prices) } : null;
            })
            .filter((cell): cell is { part: string; price: number } => cell !== null);
          return { name: model.name, cells };
        })
        .filter((row) => row.cells.length > 0)
        .slice(0, 40);

      const columns = [...new Set(rows.flatMap((row) => row.cells.map((cell) => cell.part)))].slice(0, 4);
      return { brand, family, rows, columns };
    })
    .filter((group) => group.rows.length > 0);

  const repairOffers = priceFamilies
    .flatMap((group) =>
      group.rows.flatMap((row) =>
        row.cells
          .filter((cell) => group.columns.includes(cell.part))
          .map((cell) => ({
            "@type": "Offer",
            price: cell.price.toFixed(2),
            priceCurrency: "EUR",
            availability: "https://schema.org/InStock",
            itemOffered: { "@type": "Service", name: `${group.brand} ${row.name} – ${partLabel(cell.part)}` },
          })),
      ),
    )
    .slice(0, 200);

  const ownServiceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${pageUrl}#repair-service`,
    name: de ? "Smartphone-Reparatur in Hamburg-Wilhelmsburg" : "Smartphone repair in Hamburg-Wilhelmsburg",
    serviceType: de ? "Smartphone- und iPhone-Reparatur" : "Smartphone and iPhone repair",
    provider: { "@id": `${siteInfo.url}/#store` },
    areaServed: ["Hamburg-Wilhelmsburg", "Hamburg", "Deutschland"],
    availableChannel: {
      "@type": "ServiceChannel",
      serviceLocation: { "@id": `${siteInfo.url}/#store` },
    },
    ...(repairOffers.length > 0
      ? {
          hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: de ? "Apfel Park Reparaturpreise" : "Apfel Park repair prices",
            itemListElement: repairOffers,
          },
        }
      : {}),
  };

  const fromPrice = (price: number) => `${de ? "ab" : "from"} ${euro(price, lang)}`;
  const ownPricesIntro = de
    ? "Transparente Startpreise je Reparaturart aus unserem Preisfinder. Der Endpreis hängt von Modell, Ersatzteilqualität und zusätzlichen Schäden ab und wird vor der Reparatur bestätigt."
    : "Transparent starting prices per repair type from our price finder. The final price depends on the model, part quality and any additional damage, and is confirmed before the repair.";
  const ownPricesFootnote = de
    ? "Startpreise je Reparaturart, günstigste Ersatzteilqualität. Höherwertige Teile, weitere Defekte und Sonderbestellungen können den Preis erhöhen; verbindlich ist der im LunaCenter bestätigte Preis."
    : "Starting prices per repair type at the lowest part quality. Higher-grade parts, additional faults and special orders can raise the price; the price confirmed at the LunaCenter is binding.";
  const ownPricesEmpty = de
    ? "Die Modellpreise werden gerade aktualisiert. Ruf uns an oder nutze den Preisfinder für dein konkretes Gerät."
    : "Model prices are being updated. Call us or use the price finder for your specific device.";

  const repairQuestions = de
    ? [
        { question: "Wie lange dauert eine Reparatur?", answer: "Viele Display- und Akkureparaturen sind in etwa 30 bis 60 Minuten erledigt. Bei Sonderteilen, Wasserschäden oder aufwendigen Schäden nennen wir die Dauer vor der Freigabe und stimmen einen Abholtermin mit dir ab." },
        { question: "Kann ich ohne Termin ins LunaCenter kommen?", answer: "Ja. Du kannst während der Öffnungszeiten (Montag bis Samstag, 09:30 bis 20:00 Uhr) ohne Termin vorbeikommen. Wir prüfen dein Gerät vor Ort und bestätigen Preis und Dauer, bevor wir anfangen." },
        { question: "Bleiben meine Daten auf dem Gerät?", answer: "Bei einer Display- oder Akkureparatur bleiben die Daten in der Regel erhalten. Wir empfehlen trotzdem ein Backup, weil bei Wasserschäden oder Bauteiltausch ein Datenverlust nicht ausgeschlossen werden kann. Auf Wunsch prüfen wir Funktionen erst nach deiner Freigabe." },
        { question: "Welche Gewährleistung gilt auf die Reparatur?", answer: "Auf verbaute Teile und unsere Arbeitsleistung gilt die gesetzliche Gewährleistung. Umfang und Bedingungen bestätigen wir dir beim Auftrag schriftlich; Schäden durch Flüssigkeit, Sturz oder weitere Eingriffe sind davon nicht erfasst." },
      ]
    : [
        { question: "How long does a repair take?", answer: "Many screen and battery repairs are finished in about 30 to 60 minutes. For special-order parts, water damage or complex faults we confirm the timing before you approve the work and agree a collection time with you." },
        { question: "Can I visit the LunaCenter without an appointment?", answer: "Yes. You can come in during opening hours (Monday to Saturday, 09:30 to 20:00) without an appointment. We inspect the device on site and confirm price and timing before starting." },
        { question: "Will my data stay on the device?", answer: "Data is normally preserved during screen or battery repairs. We still recommend a backup, because water damage or component replacement can make data loss possible. We test functions only after your approval." },
        { question: "What warranty applies to the repair?", answer: "Statutory warranty applies to the parts we fit and to our labour. We confirm the scope and conditions in writing on the job order; damage from liquid, impact or later third-party work is not covered." },
      ];

  const dateLabel = new Intl.DateTimeFormat(de ? "de-DE" : "en-GB", { dateStyle: "long", timeZone: "Europe/Berlin" }).format(new Date(`${repairBenchmark.checkedAt}T12:00:00+02:00`));

  const comparisonRows = repairBenchmark.models.flatMap((model) =>
    repairBenchmarkFields.flatMap((field) => {
      const values = shopKeys.map((shop) => model.prices[shop][field.key as PriceKey]);
      const apfelPrice = model.prices.apfelPark[field.key as PriceKey];
      if (typeof apfelPrice !== "number") return [];
      const competitorValues = values.slice(1).filter((value): value is number => typeof value === "number");
      const lowestCompetitor = competitorValues.length > 0 ? Math.min(...competitorValues) : null;
      return [{ model: model.model, field, values, apfelPrice, lowestCompetitor, isLowest: lowestCompetitor !== null && apfelPrice < lowestCompetitor }];
    }),
  );
  const lowestCount = comparisonRows.filter((row) => row.isLowest).length;

  const datasetJsonLd = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: de ? "Hamburger iPhone-Reparaturpreisvergleich" : "Hamburg iPhone repair price comparison",
    description: de
      ? "Manuell geprüfte öffentliche Onlinepreise für ausgewählte iPhone-Modelle und Reparaturarten."
      : "Manually checked public online prices for selected iPhone models and repair types.",
    url: pageUrl,
    creator: { "@id": `${siteInfo.url}/#store` },
    dateModified: repairBenchmark.checkedAt,
    temporalCoverage: repairBenchmark.checkedAt,
    measurementTechnique: de ? "Manueller Vergleich öffentlich sichtbarer Preislisten" : "Manual comparison of publicly visible price lists",
    variableMeasured: repairBenchmarkFields.map((field) => de ? field.de : field.en),
    citation: Object.values(repairBenchmark.shops).map((shop) => shop.url),
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: de ? "Startseite" : "Home", item: `${siteInfo.url}/${lang}` },
      { "@type": "ListItem", position: 2, name: de ? "Reparaturen" : "Repairs", item: `${siteInfo.url}/${lang}/repairs` },
      { "@type": "ListItem", position: 3, name: de ? "Preisvergleich" : "Price comparison", item: pageUrl },
    ],
  };

  return (
    <div className="bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonStringify(ownServiceJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonStringify(datasetJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonStringify(breadcrumbJsonLd) }} />

      <section className="section-pad border-b border-border/60 bg-surface/30">
        <div className="container-page max-w-5xl">
          <nav className="mb-6 text-sm text-muted" aria-label={de ? "Brotkrumen" : "Breadcrumb"}>
            <Link href={`/${lang}/repairs`} className="transition hover:text-gold">{de ? "Reparaturen" : "Repairs"}</Link>
            <span aria-hidden="true"> / </span>
            <span>{de ? "Preisvergleich Hamburg" : "Hamburg price comparison"}</span>
          </nav>
          <p className="badge-gold inline-flex">{de ? `Preischeck vom ${dateLabel}` : `Price check from ${dateLabel}`}</p>
          <h1 className="mt-5 max-w-4xl text-4xl font-bold text-foreground md:text-6xl">
            {de ? "Handy-Reparatur Preise in Hamburg vergleichen" : "Compare phone repair prices in Hamburg"}
          </h1>
          <p className="mt-6 max-w-4xl text-lg leading-8 text-muted">
            {de
              ? `Im veröffentlichten Preischeck für fünf ausgewählte iPhone-Modelle hatte Apfel Park bei ${lowestCount} von ${comparisonRows.length} vergleichbaren, öffentlich gelisteten Reparaturpreisen den niedrigsten Wert unter Apfel Park, iSmart Repair, My Mobile Repair und PhoneHelden.`
              : `In the published check for five selected iPhone models, Apfel Park had the lowest listed value in ${lowestCount} of ${comparisonRows.length} comparable public repair prices across Apfel Park, iSmart Repair, My Mobile Repair and PhoneHelden.`}
          </p>
          <p className="mt-4 max-w-4xl text-sm leading-6 text-muted">
            {de
              ? "Das ist kein allgemeiner Anspruch, der günstigste Reparaturbetrieb Hamburgs zu sein. Der Vergleich gilt nur für die unten genannten Modelle, Leistungen, Qualitätsbezeichnungen, Quellen und den angegebenen Prüftag."
              : "This is not a general claim to be Hamburg's cheapest repair shop. It applies only to the models, services, quality labels, sources and check date shown below."}
          </p>
        </div>
      </section>

      {/* Own prices first: these are the rates the shop actually quotes, pulled
          from the same catalog row the repair finder reads. */}
      <section className="section-pad" aria-labelledby="apfel-park-preise">
        <div className="container-page">
          <h2 id="apfel-park-preise" className="text-3xl font-bold text-foreground md:text-4xl">
            {de ? "Apfel Park Preise" : "Apfel Park prices"}
          </h2>
          <p className="mt-4 max-w-3xl leading-7 text-muted">{ownPricesIntro}</p>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
            <span>{de ? "Richtwert Dauer: ca. 30–60 Min." : "Typical time: approx. 30–60 min"}</span>
            <span>{de ? "Gewährleistung auf Teile und Arbeitsleistung" : "Warranty on parts and labour"}</span>
            <span>{de ? "Abholung im LunaCenter, Wilhelm-Strauß-Weg 2b" : "Collect at LunaCenter, Wilhelm-Strauß-Weg 2b"}</span>
          </div>

          {priceFamilies.length === 0 ? (
            <p className="mt-8 rounded-2xl border border-border/60 bg-surface/20 p-6 text-sm leading-6 text-muted">{ownPricesEmpty}</p>
          ) : (
            <div className="mt-8 space-y-8">
              {priceFamilies.map((group) => (
                <article key={group.brand + group.family} className="overflow-hidden rounded-3xl border border-border/60 bg-surface/20">
                  <div className="border-b border-border/60 px-6 py-4">
                    <h3 className="text-xl font-semibold text-foreground">{familyTitle(group.brand, group.family)}</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-border/60 bg-surface/40">
                          <th scope="col" className="px-4 py-3 text-left">{de ? "Modell" : "Model"}</th>
                          {group.columns.map((part) => (
                            <th key={part} scope="col" className="px-4 py-3 text-right">{partLabel(part)}</th>
                          ))}
                          <th scope="col" className="px-4 py-3 text-right">{de ? "Dauer" : "Time"}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.rows.map((row) => (
                          <tr key={row.name} className="border-b border-border/40 last:border-b-0">
                            <th scope="row" className="px-4 py-3 text-left font-medium text-foreground">{row.name}</th>
                            {group.columns.map((part) => {
                              const cell = row.cells.find((entry) => entry.part === part);
                              return (
                                <td key={part} className="px-4 py-3 text-right font-semibold tabular-nums text-gold">
                                  {cell === undefined ? "–" : fromPrice(cell.price)}
                                </td>
                              );
                            })}
                            <td className="px-4 py-3 text-right tabular-nums text-muted">{de ? "ca. 30–60 Min." : "approx. 30–60 min"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </article>
              ))}
              <p className="text-xs leading-6 text-muted">{ownPricesFootnote}</p>
            </div>
          )}
        </div>
      </section>

      <section className="section-pad bg-surface/30" aria-labelledby="apfel-park-faq">
        <div className="container-page max-w-4xl">
          <h2 id="apfel-park-faq" className="text-3xl font-bold text-foreground md:text-4xl">
            {de ? "Häufige Fragen zur Reparatur" : "Common repair questions"}
          </h2>
          <div className="mt-6 space-y-6">
            {repairQuestions.map((entry) => (
              <article key={entry.question}>
                <h3 className="text-lg font-semibold text-foreground">{entry.question}</h3>
                <p className="mt-2 leading-7 text-muted">{entry.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad">
        <div className="container-page space-y-10">
          {repairBenchmark.models.map((model) => {
            const rows = comparisonRows.filter((row) => row.model === model.model);
            return (
              <article key={model.model} className="overflow-hidden rounded-3xl border border-border/60 bg-surface/20">
                <div className="border-b border-border/60 px-6 py-5">
                  <h2 className="text-2xl font-semibold text-foreground">{model.model}</h2>
                </div>
                <div
                  role="region"
                  aria-label={de ? `${model.model} Preisvergleich` : `${model.model} price comparison`}
                  tabIndex={0}
                  className="overflow-x-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                >
                  <table className="w-full min-w-[760px] border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-border/60 bg-surface/40">
                        <th className="px-4 py-3 text-left">{de ? "Leistung" : "Service"}</th>
                        {shopKeys.map((shop) => (
                          <th key={shop} className={`px-4 py-3 text-right ${shop === "apfelPark" ? "text-gold" : "text-foreground"}`}>
                            {repairBenchmark.shops[shop].name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr key={row.field.key} className="border-b border-border/40 last:border-b-0">
                          <th className="px-4 py-3 text-left font-medium text-foreground">{de ? row.field.de : row.field.en}</th>
                          {shopKeys.map((shop, index) => {
                            const value = row.values[index];
                            return (
                              <td key={shop} className={`px-4 py-3 text-right tabular-nums ${shop === "apfelPark" ? "font-semibold text-gold" : "text-muted"}`}>
                                {typeof value === "number" ? euro(value, lang) : "—"}
                                {shop === "apfelPark" && row.isLowest ? <span className="ml-2 text-[10px] uppercase tracking-wide">{de ? "niedrigster" : "lowest"}</span> : null}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="section-pad bg-surface/30">
        <div className="container-page grid gap-6 lg:grid-cols-2">
          <article className="tech-card rounded-3xl p-7">
            <h2 className="text-2xl font-semibold text-foreground">{de ? "Methodik" : "Method"}</h2>
            <ul className="mt-5 space-y-3 text-sm leading-6 text-muted">
              <li>{de ? "Verglichen wurden öffentlich sichtbare Onlinepreise am angegebenen Prüftag." : "Publicly visible online prices were compared on the stated date."}</li>
              <li>{de ? "Displaystufen wurden nach den veröffentlichten Bezeichnungen Standard/Copy, Premium/Soft OLED und Original zugeordnet." : "Display tiers were aligned using the published Standard/Copy, Premium/Soft OLED and Original labels."}</li>
              <li>{de ? "Akkuwerte beziehen sich auf die öffentlich gelistete OEM/Premium- beziehungsweise Standardoption, nicht auf Apples Original-Service." : "Battery values refer to the listed OEM/Premium or Standard option, not Apple's original service."}</li>
              <li>{de ? "Nicht öffentliche Angebote, Gutscheine, Diagnoseergebnisse, Zusatzschäden, Garantieumfang und Aktionspreise sind nicht berücksichtigt." : "Private quotes, coupons, diagnosis findings, additional damage, warranty scope and promotional prices are excluded."}</li>
            </ul>
          </article>
          <article className="tech-card rounded-3xl p-7">
            <h2 className="text-2xl font-semibold text-foreground">{de ? "Geprüfte Quellen" : "Checked sources"}</h2>
            <ul className="mt-5 space-y-3 text-sm">
              {Object.entries(repairBenchmark.shops).map(([key, shop]) => (
                <li key={shop.name}>
                  {key === "apfelPark" ? (
                    <Link href={`/${lang}/repairs`} className="text-gold underline-offset-4 hover:underline">
                      {shop.name}
                    </Link>
                  ) : (
                    <a href={shop.url} target="_blank" rel="noopener noreferrer nofollow" className="text-gold underline-offset-4 hover:underline">
                      {shop.name}
                    </a>
                  )}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-sm leading-6 text-muted">
              {de ? "Preise können sich nach dem Prüftag ändern. Maßgeblich ist immer das aktuelle Angebot des jeweiligen Betriebs." : "Prices may change after the check date. The current quote from each provider always prevails."}
            </p>
          </article>
        </div>
      </section>

      <section className="section-pad">
        <div className="container-page text-center">
          <h2 className="text-3xl font-bold text-foreground">{de ? "Aktuelle Apfel-Park-Preise prüfen" : "Check current Apfel Park prices"}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted">{de ? "Der Preisfinder zeigt die aktuell gespeicherten Modell- und Qualitätsvarianten. Vor kostenpflichtigen Arbeiten bestätigen wir Preis und Umfang." : "The repair finder shows the currently stored model and quality options. Price and scope are confirmed before paid work begins."}</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href={`/${lang}/repairs`} className="btn-primary">{de ? "Zum Preisfinder" : "Open price finder"}</Link>
            <Link href={`/${lang}/repairs#repair-request`} className="btn-secondary">{de ? "Reparatur anfragen" : "Request a repair"}</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
