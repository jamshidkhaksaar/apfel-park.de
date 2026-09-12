"use client";

import { useId, useRef, useState } from "react";

export type EprelMatch = {
  registration_number: string;
  supplier: string;
  model_identifier: string;
  device_type: string | null;
  energy_class: string | null;
  battery_endurance_hours: string | number | null;
  battery_endurance_minutes: number | null;
  battery_endurance_cycles: number | null;
  repairability_class: string | null;
  reliability_class: string | null;
  ingress_protection: string | null;
  on_market_start: string | null;
  label_image?: string | null;
  fiche_de?: string | null;
  fiche_en?: string | null;
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
  const inputId = useId();
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<EprelMatch[]>([]);
  const [state, setState] = useState<"idle" | "empty" | "error">("idle");
  const [loading, setLoading] = useState(false);
  const pending = useRef(false);

  const search = async () => {
    if (pending.current || term.trim().length < 2) return;
    pending.current = true;
    setLoading(true);
    setState("idle");
    setResults([]);
    try {
      const response = await fetch(`/api/admin/eprel?q=${encodeURIComponent(term.trim())}`);
      if (!response.ok) throw new Error("EPREL request failed");
      const data = (await response.json()) as { success: boolean; results?: EprelMatch[] };
      if (!data.success || !Array.isArray(data.results)) throw new Error("Invalid EPREL response");
      setResults(data.results);
      setState(data.results.length === 0 ? "empty" : "idle");
    } catch {
      setState("error");
    } finally {
      pending.current = false;
      setLoading(false);
    }
  };

  return (
    <div className="mt-3 rounded-xl border border-border/60 bg-surface/40 p-3">
      <label htmlFor={inputId} className="block text-sm font-medium">{locale === "de" ? "Modellnummer" : "Model number"}</label>
      <p id={`${inputId}-help`} className="text-xs text-muted">
        {locale === "de"
          ? "Offizielle EPREL-Registrierung suchen — nach der Modellnummer vom Karton oder aus den Geräte-Einstellungen (z. B. A3090, SM-S931B), nicht nach dem Verkaufsnamen."
          : "Find the official EPREL registration — search by the model number from the box or the device settings (e.g. A3090, SM-S931B), not the marketing name."}
      </p>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <input
          id={inputId}
          aria-describedby={`${inputId}-help${state === "error" ? ` ${inputId}-error` : ""}`}
          disabled={loading}
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void search();
            }
          }}
          placeholder="A3090 / SM-S931B / Apple"
          className="min-w-0 w-full rounded-xl border border-border/60 bg-surface/70 px-3 py-2 text-sm text-foreground"
        />
        <button
          type="button"
          disabled={loading || term.trim().length < 2}
          onClick={() => void search()}
          className="shrink-0 rounded-xl border border-gold/40 px-4 py-2 text-sm font-medium text-gold transition hover:bg-gold/10"
        >
          {loading ? (locale === "de" ? "Suche …" : "Searching …") : state === "error" ? (locale === "de" ? "Erneut versuchen" : "Retry") : locale === "de" ? "Suchen" : "Search"}
        </button>
      </div>

      {state === "error" ? <p id={`${inputId}-error`} role="alert" className="mt-2 text-xs text-red-500">{locale === "de" ? "EPREL-Suche fehlgeschlagen. Bitte erneut versuchen." : "EPREL search failed. Please retry."}</p> : null}
      <p role="status" className="mt-2 text-xs text-muted">{loading ? (locale === "de" ? "Suche läuft …" : "Searching …") : results.length > 0 ? `${results.length} ${locale === "de" ? "Registrierungen gefunden." : "registrations found."}` : ""}</p>
      {state === "empty" ? (
        <p role="status" className="mt-2 text-xs text-muted">
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
