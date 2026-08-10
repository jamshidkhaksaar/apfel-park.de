"use client";

import { useState } from "react";

export type EprelMatch = {
  registration_number: string;
  supplier: string;
  model_identifier: string;
  device_type: string | null;
  energy_class: string | null;
  battery_endurance_hours: string | number | null;
  battery_endurance_cycles: number | null;
  repairability_class: string | null;
  reliability_class: string | null;
  ingress_protection: string | null;
  on_market_start: string | null;
};

/**
 * Finds the official EPREL registration for a device and hands it back so the
 * energy label fields fill from the register rather than being typed by hand.
 *
 * Search by the model number on the box or in the settings (A3090, SM-S931B),
 * not by the marketing name -- EPREL does not store marketing names.
 */
export default function EprelPicker({
  locale,
  onSelect,
}: {
  locale: "de" | "en";
  onSelect: (match: EprelMatch) => void;
}) {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<EprelMatch[]>([]);
  const [state, setState] = useState<"idle" | "loading" | "empty">("idle");

  const search = async () => {
    if (term.trim().length < 2) return;
    setState("loading");
    const response = await fetch(`/api/admin/eprel?q=${encodeURIComponent(term.trim())}`);
    const data = (await response.json()) as { success: boolean; results?: EprelMatch[] };
    const rows = data.results ?? [];
    setResults(rows);
    setState(rows.length === 0 ? "empty" : "idle");
  };

  return (
    <div className="mt-3 rounded-xl border border-border/60 bg-surface/40 p-3">
      <p className="text-xs text-muted">
        {locale === "de"
          ? "Offizielle EPREL-Registrierung suchen — nach der Modellnummer vom Karton oder aus den Geräte-Einstellungen (z. B. A3090, SM-S931B), nicht nach dem Verkaufsnamen."
          : "Find the official EPREL registration — search by the model number from the box or the device settings (e.g. A3090, SM-S931B), not the marketing name."}
      </p>
      <div className="mt-2 flex gap-2">
        <input
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void search();
            }
          }}
          placeholder="A3090 / SM-S931B / Apple"
          className="w-full rounded-xl border border-border/60 bg-surface/70 px-3 py-2 text-sm text-foreground"
        />
        <button
          type="button"
          onClick={() => void search()}
          className="shrink-0 rounded-xl border border-gold/40 px-4 py-2 text-sm font-medium text-gold transition hover:bg-gold/10"
        >
          {state === "loading" ? "…" : locale === "de" ? "Suchen" : "Search"}
        </button>
      </div>

      {state === "empty" ? (
        <p className="mt-2 text-xs text-muted">
          {locale === "de" ? "Keine Registrierung gefunden." : "No registration found."}
        </p>
      ) : null}

      {results.length > 0 ? (
        <ul className="mt-3 max-h-64 space-y-1.5 overflow-y-auto">
          {results.map((match) => (
            <li key={match.registration_number}>
              <button
                type="button"
                onClick={() => {
                  onSelect(match);
                  setResults([]);
                  setTerm("");
                }}
                className="w-full rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-left text-xs transition hover:border-gold/40"
              >
                <span className="font-semibold text-foreground">
                  {match.supplier} {match.model_identifier}
                </span>
                <span className="ml-2 text-muted">
                  {match.energy_class ? `Klasse ${match.energy_class}` : ""}
                  {match.battery_endurance_hours ? ` · ${match.battery_endurance_hours} h` : ""}
                  {match.ingress_protection ? ` · ${match.ingress_protection}` : ""}
                  {match.on_market_start ? ` · ${String(match.on_market_start).slice(0, 10)}` : ""}
                </span>
                <span className="ml-2 text-muted/70">#{match.registration_number}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
