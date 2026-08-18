import Image from "next/image";

import { eprelProductUrl } from "@/lib/eprel";
import type { Locale } from "@/lib/i18n";
import type { EnergyLabel } from "@/lib/products";

const CLASS_COLORS: Record<string, string> = {
  A: "#00a651",
  B: "#4cb748",
  C: "#bfd730",
  D: "#fff200",
  E: "#fdb913",
  F: "#f37021",
  G: "#ed1c24",
};

const CLASS_TEXT: Record<string, string> = { C: "#111111", D: "#111111", E: "#111111" };
const GRADES = ["A", "B", "C", "D", "E", "F", "G"];

export function EnergyClassArrow({ grade, locale, className = "" }: { grade: string; locale: Locale; className?: string }) {
  const normalized = grade.toUpperCase();
  if (!GRADES.includes(normalized)) return null;

  return (
    <span
      className={`inline-flex items-center gap-2 ${className}`}
      aria-label={locale === "de" ? `Energieeffizienzklasse ${normalized} auf einer Skala von A bis G` : `Energy efficiency class ${normalized} on a scale from A to G`}
    >
      <span
        className="inline-flex h-9 min-w-14 items-center pl-3 pr-6 text-lg font-black leading-none"
        style={{
          backgroundColor: CLASS_COLORS[normalized],
          color: CLASS_TEXT[normalized] ?? "#ffffff",
          clipPath: "polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%)",
        }}
        aria-hidden="true"
      >
        {normalized}
      </span>
      <span className="text-xs font-semibold text-muted">A–G</span>
    </span>
  );
}

export default function EuEnergyLabelSection({
  locale,
  energyLabel,
  eprelId,
}: {
  locale: Locale;
  energyLabel: EnergyLabel;
  eprelId?: string;
}) {
  const isGerman = locale === "de";
  const cycles = energyLabel.batteryCycles != null
    ? `≥ ${new Intl.NumberFormat(isGerman ? "de-DE" : "en-GB").format(energyLabel.batteryCycles)}`
    : undefined;
  const metrics = [
    {
      label: isGerman ? "Akkulaufzeit pro Ladung" : "Battery endurance per charge",
      value: energyLabel.batteryEndurance,
      detail: isGerman ? "Standardisierter Nutzungstest" : "Standardised usage test",
    },
    {
      label: isGerman ? "Sturzfestigkeitsklasse" : "Repeated free-fall reliability",
      value: energyLabel.reliabilityClass ? `${isGerman ? "Klasse" : "Class"} ${energyLabel.reliabilityClass}` : undefined,
      detail: isGerman ? "A ist am robustesten" : "A is the most robust",
    },
    {
      label: isGerman ? "Akku-Lebensdauer" : "Battery endurance in cycles",
      value: cycles,
      detail: isGerman ? "Ladezyklen bis 80 % Restkapazität" : "Cycles until 80% remaining capacity",
    },
    {
      label: isGerman ? "Reparierbarkeitsklasse" : "Repairability class",
      value: energyLabel.repairabilityClass ? `${isGerman ? "Klasse" : "Class"} ${energyLabel.repairabilityClass}` : undefined,
      detail: isGerman ? "A ist am besten reparierbar" : "A is the most repairable",
    },
    {
      label: isGerman ? "Staub- und Wasserschutz" : "Ingress protection",
      value: energyLabel.ipRating,
      detail: isGerman ? "Geprüfte IP-Schutzart" : "Tested IP rating",
    },
  ].filter((entry): entry is { label: string; value: string; detail: string } => Boolean(entry.value));
  const fiche = isGerman
    ? energyLabel.ficheDe ?? energyLabel.ficheEn
    : energyLabel.ficheEn ?? energyLabel.ficheDe;

  return (
    <section className="glass-panel overflow-hidden rounded-3xl border border-border/60" aria-labelledby="eu-energy-label-heading">
      <header className="border-b border-border/60 px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">EU 2023/1669</p>
            <h2 id="eu-energy-label-heading" className="mt-1 text-xl font-semibold text-foreground">
              {isGerman ? "EU-Energielabel für Smartphones" : "EU energy label for smartphones"}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              {isGerman
                ? "Offizielle, standardisiert geprüfte Angaben zu Effizienz, Akkulaufzeit, Robustheit und Reparierbarkeit."
                : "Official, standardised results for efficiency, battery life, durability and repairability."}
            </p>
          </div>
          {eprelId ? (
            <span className="rounded-full border border-border/70 bg-surface/60 px-3 py-1.5 text-xs font-semibold text-muted">
              EPREL #{eprelId}
            </span>
          ) : null}
        </div>
      </header>

      <div className={`grid gap-6 p-5 sm:p-6 ${energyLabel.labelImage ? "lg:grid-cols-[minmax(220px,280px)_minmax(0,1fr)]" : ""}`}>
        {energyLabel.labelImage ? (
          <figure className="self-start">
            <a
              href={energyLabel.labelImage}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-2xl border border-border/70 bg-white p-3 shadow-sm transition hover:border-gold/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              <Image
                src={energyLabel.labelImage}
                alt={isGerman ? "Offizielles EU-Energielabel dieses Modells" : "Official EU energy label for this model"}
                width={1134}
                height={2268}
                unoptimized
                className="mx-auto h-auto w-full max-w-[260px]"
              />
            </a>
            <figcaption className="mt-2 text-center text-xs text-muted">
              {isGerman ? "Offizielles Label – zum Vergrößern öffnen" : "Official label — open to enlarge"}
            </figcaption>
          </figure>
        ) : null}

        <div className="min-w-0">
          {energyLabel.efficiencyClass ? (
            <div className="rounded-2xl border border-border/60 bg-surface/45 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                {isGerman ? "Energieeffizienzklasse" : "Energy efficiency class"}
              </p>
              <EnergyClassArrow grade={energyLabel.efficiencyClass} locale={locale} className="mt-3" />
              <div className="mt-4 grid grid-cols-7 gap-1" aria-hidden="true">
                {GRADES.map((grade) => (
                  <span
                    key={grade}
                    className={`flex h-6 items-center justify-center text-[10px] font-black ${grade === energyLabel.efficiencyClass ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : "opacity-70"}`}
                    style={{ backgroundColor: CLASS_COLORS[grade], color: CLASS_TEXT[grade] ?? "#ffffff" }}
                  >
                    {grade}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {metrics.length > 0 ? (
            <dl className="mt-4 grid gap-3">
              {metrics.map((metric) => (
                <div key={metric.label} className="min-w-0 rounded-2xl border border-border/60 bg-surface/35 p-4">
                  <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{metric.label}</dt>
                  <dd className="mt-2 text-xl font-semibold text-foreground">{metric.value}</dd>
                  <p className="mt-1 text-xs leading-5 text-muted">{metric.detail}</p>
                </div>
              ))}
            </dl>
          ) : null}

          {!energyLabel.labelImage && eprelId ? (
            <p className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-sm leading-6 text-foreground">
              {isGerman
                ? "Das offizielle Label ist im verknüpften EPREL-Eintrag verfügbar."
                : "The official label is available in the linked EPREL entry."}
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-3">
            {fiche ? (
              <a href={fiche} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-border/70 bg-surface/60 px-4 py-2.5 text-sm font-semibold text-foreground transition hover:border-gold/50 hover:text-gold">
                {isGerman ? "Produktdatenblatt (PDF)" : "Product information sheet (PDF)"}
              </a>
            ) : null}
            {eprelId ? (
              <a href={eprelProductUrl(eprelId)} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-gold/45 bg-gold/10 px-4 py-2.5 text-sm font-semibold text-gold transition hover:bg-gold hover:text-black">
                {isGerman ? "In EPREL prüfen" : "Verify in EPREL"}
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
