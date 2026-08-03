import type { Locale } from "@/lib/i18n";
import type { RepairCatalog, RepairCatalogModel } from "@/lib/repair-catalog";

/**
 * Server-rendered repair price table.
 *
 * RepairCatalogExplorer is a client component, so until now the "Preise &
 * Modelle" section contained no euro figures in the HTML at all — Google saw
 * an empty price section on the page that is supposed to rank for
 * "handy reparatur hamburg günstig", "iphone akku tauschen hamburg" and
 * "iphone display reparatur hamburg". This renders the same catalogue data as
 * crawlable markup alongside the interactive finder.
 */

// The catalogue names parts inconsistently (English and German mixed, plus a
// "Hosing" typo). Normalise before grouping so prices are not silently dropped.
const PART_ALIASES: Record<string, PartKey> = {
  display: "display",
  touchscreen: "display",
  touchglas: "display",
  lcd: "display",
  battery: "battery",
  akku: "battery",
  "back cover": "backcover",
  hosing: "backcover",
  housing: "backcover",
  camera: "camera",
  "charging port": "charging",
  charging: "charging",
};

type PartKey = "display" | "battery" | "backcover" | "camera" | "charging";

const COLUMNS: { key: PartKey; de: string; en: string }[] = [
  { key: "display", de: "Display", en: "Display" },
  { key: "battery", de: "Akku", en: "Battery" },
  { key: "backcover", de: "Rückcover", en: "Back cover" },
  { key: "camera", de: "Kamera", en: "Camera" },
];

const MODELS_PER_BRAND = 12;

const euro = (value: number) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(value);

/** Lowest listed price for a part on one model, or null when quote-on-request. */
const lowestPartPrice = (model: RepairCatalogModel, key: PartKey): number | null => {
  let lowest: number | null = null;
  for (const part of model.parts ?? []) {
    if (PART_ALIASES[part.name.trim().toLowerCase()] !== key) continue;
    for (const variant of part.variants) {
      if (typeof variant.price === "number" && variant.price > 0) {
        lowest = lowest === null ? variant.price : Math.min(lowest, variant.price);
      }
    }
  }
  return lowest;
};

/** Lowest price per part type across the whole catalogue, for the "ab" summary. */
export const catalogueFloorPrices = (catalog: RepairCatalog): Partial<Record<PartKey, number>> => {
  const floors: Partial<Record<PartKey, number>> = {};
  for (const brand of catalog.brands) {
    for (const family of brand.families) {
      for (const model of family.models) {
        for (const { key } of COLUMNS) {
          const price = lowestPartPrice(model, key);
          if (price === null) continue;
          const current = floors[key];
          floors[key] = current === undefined ? price : Math.min(current, price);
        }
      }
    }
  }
  return floors;
};

export default function RepairPriceTable({
  lang,
  catalog,
}: {
  lang: Locale;
  catalog: RepairCatalog;
}) {
  const de = lang === "de";
  const floors = catalogueFloorPrices(catalog);

  const brands = catalog.brands
    .map((brand) => ({
      name: brand.name,
      models: brand.families
        .flatMap((family) => family.models)
        .filter((model) => COLUMNS.some(({ key }) => lowestPartPrice(model, key) !== null))
        .slice(0, MODELS_PER_BRAND),
    }))
    .filter((brand) => brand.models.length > 0);

  if (brands.length === 0) return null;

  const summary = COLUMNS.filter(({ key }) => floors[key] !== undefined)
    .map(({ key, de: dl, en: el }) => `${de ? dl : el} ${de ? "ab" : "from"} ${euro(floors[key] as number)}`)
    .join(" · ");

  return (
    <div className="mt-10">
      <h3 className="text-xl font-semibold text-foreground">
        {de
          ? "Reparatur Preise Hamburg – Übersicht"
          : "Repair prices in Hamburg – overview"}
      </h3>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
        {de
          ? `Richtpreise für die häufigsten Reparaturen in unserer Werkstatt in Hamburg-Wilhelmsburg: ${summary}. Der Endpreis hängt von Modell, Ersatzteilqualität und Zusatzschäden ab und wird vor jeder kostenpflichtigen Reparatur bestätigt.`
          : `Guide prices for the most common repairs at our Hamburg-Wilhelmsburg workshop: ${summary}. The final price depends on the model, part quality and any additional damage, and is always confirmed before paid work begins.`}
      </p>

      {brands.map((brand) => (
        <section key={brand.name} className="mt-8">
          <h4 className="mb-3 text-base font-semibold text-foreground">
            {de
              ? `${brand.name} Reparatur – Preise`
              : `${brand.name} repair prices`}
          </h4>
          <div className="overflow-x-auto rounded-xl border border-border/60">
            <table className="w-full min-w-[520px] border-collapse text-sm">
              <caption className="sr-only">
                {de
                  ? `${brand.name} Reparaturpreise bei Apfel Park in Hamburg`
                  : `${brand.name} repair prices at Apfel Park in Hamburg`}
              </caption>
              <thead>
                <tr className="border-b border-border/60 bg-surface/40">
                  <th scope="col" className="px-4 py-2.5 text-left font-semibold text-foreground">
                    {de ? "Modell" : "Model"}
                  </th>
                  {COLUMNS.map((column) => (
                    <th
                      key={column.key}
                      scope="col"
                      className="px-4 py-2.5 text-right font-semibold text-foreground"
                    >
                      {de ? column.de : column.en}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {brand.models.map((model) => (
                  <tr key={model.id} className="border-b border-border/40 last:border-b-0">
                    <th scope="row" className="px-4 py-2.5 text-left font-medium text-foreground">
                      {model.name}
                    </th>
                    {COLUMNS.map((column) => {
                      const price = lowestPartPrice(model, column.key);
                      return (
                        <td
                          key={column.key}
                          className="px-4 py-2.5 text-right tabular-nums text-muted"
                        >
                          {price === null ? (
                            <span className="text-xs">{de ? "auf Anfrage" : "on request"}</span>
                          ) : (
                            <>
                              <span className="text-xs">{de ? "ab " : "from "}</span>
                              {euro(price)}
                            </>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      <p className="mt-6 text-xs leading-5 text-muted">
        {de
          ? "Alle Preise inkl. MwSt. und Einbau. Weitere Modelle findest du im Preisfinder oben – für nicht gelistete Geräte erstellen wir dir ein individuelles Angebot."
          : "All prices include VAT and fitting. More models are available in the price finder above; for unlisted devices we prepare an individual quote."}
      </p>
    </div>
  );
}
