import type { Metadata } from "next";
import Link from "next/link";

import { createMetadata } from "@/lib/metadata";
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
              {Object.values(repairBenchmark.shops).map((shop) => (
                <li key={shop.name}>
                  <a href={shop.url} target="_blank" rel="noopener noreferrer nofollow" className="text-gold underline-offset-4 hover:underline">
                    {shop.name}
                  </a>
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
