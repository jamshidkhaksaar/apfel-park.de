import type { ReactNode } from "react";

import { formatPrice } from "@/lib/format";
import type { DashboardTrend } from "@/lib/admin-dashboard";
import type { Locale } from "@/lib/i18n";

/**
 * Percentage change against the previous equal-length window.
 *
 * Growth from a zero base is not a percentage, so it reports "neu" rather than
 * an infinite increase — the case that produces "+∞ %" on most dashboards.
 */
export const trendPercent = (trend: DashboardTrend): number | null => {
  if (trend.previous === 0) return null;
  return ((trend.current - trend.previous) / trend.previous) * 100;
};

export function TrendBadge({ trend, locale }: { trend: DashboardTrend; locale: Locale }) {
  const isGerman = locale === "de";
  const percent = trendPercent(trend);

  if (percent === null) {
    const label = trend.current > 0 ? (isGerman ? "neu" : "new") : (isGerman ? "keine Vergleichsdaten" : "no prior data");
    return <span className="text-xs font-medium text-muted">{label}</span>;
  }

  const rounded = Math.round(percent);
  const flat = rounded === 0;
  const up = rounded > 0;
  // Status colour is paired with an arrow glyph and a sign, never colour alone.
  const tone = flat ? "text-muted" : up ? "text-green" : "text-red";

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold tabular-nums ${tone}`}>
      <span aria-hidden="true">{flat ? "→" : up ? "↑" : "↓"}</span>
      {rounded > 0 ? "+" : ""}{rounded} %
      <span className="sr-only">
        {isGerman ? " gegenüber den vorherigen 30 Tagen" : " compared with the previous 30 days"}
      </span>
    </span>
  );
}

export function KpiTile({
  label,
  value,
  sub,
  trend,
  locale,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  trend?: DashboardTrend;
  locale: Locale;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{label}</p>
        {icon ? <span className="shrink-0 text-muted">{icon}</span> : null}
      </div>
      {/* Tabular figures so a column of tiles aligns on the decimal. */}
      <p className="mt-3 text-3xl font-bold tabular-nums leading-none text-foreground">{value}</p>
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
        {trend ? <TrendBadge trend={trend} locale={locale} /> : null}
        {sub ? <span className="text-xs text-muted">{sub}</span> : null}
      </div>
    </div>
  );
}

/**
 * Stock split as one stacked bar rather than three separate numbers: the
 * question an operator actually asks is "how much of the catalog is sellable
 * right now", which is a composition, not three magnitudes.
 */
export function StockComposition({
  inStock,
  lowStock,
  outOfStock,
  locale,
}: {
  inStock: number;
  lowStock: number;
  outOfStock: number;
  locale: Locale;
}) {
  const isGerman = locale === "de";
  // Low stock is a subset of in-stock SKUs, so healthy stock is the remainder.
  const healthy = Math.max(0, inStock - lowStock);
  const total = healthy + lowStock + outOfStock;

  const segments = [
    { key: "healthy", label: isGerman ? "Verfügbar" : "Available", value: healthy, bar: "bg-green", dot: "bg-green", text: "text-green" },
    { key: "low", label: isGerman ? "Knapp (1–3)" : "Low (1–3)", value: lowStock, bar: "bg-gold", dot: "bg-gold", text: "text-gold" },
    { key: "out", label: isGerman ? "Ausverkauft" : "Out of stock", value: outOfStock, bar: "bg-red", dot: "bg-red", text: "text-red" },
  ].filter((segment) => segment.value > 0);

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground">{isGerman ? "Lagerbestand" : "Stock levels"}</h2>
        <p className="text-xs tabular-nums text-muted">
          {total} {isGerman ? "SKUs" : "SKUs"}
        </p>
      </div>

      {total > 0 ? (
        <>
          {/* 2px gaps between fills keep adjacent segments legible without borders. */}
          <div className="mt-4 flex h-3 gap-0.5 overflow-hidden rounded-full" role="img"
            aria-label={segments.map((s) => `${s.label}: ${s.value}`).join(", ")}>
            {segments.map((segment) => (
              <div
                key={segment.key}
                className={`${segment.bar} first:rounded-l-full last:rounded-r-full`}
                style={{ width: `${(segment.value / total) * 100}%` }}
              />
            ))}
          </div>

          {/* Legend carries the label, so the split never depends on colour alone. */}
          <ul className="mt-4 grid gap-2 sm:grid-cols-3">
            {segments.map((segment) => (
              <li key={segment.key} className="flex items-baseline gap-2">
                <span aria-hidden="true" className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${segment.dot}`} />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold tabular-nums text-foreground">{segment.value}</span>
                  <span className="block text-xs text-muted">{segment.label}</span>
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="mt-4 text-sm text-muted">{isGerman ? "Keine Lagerdaten." : "No stock data."}</p>
      )}
    </div>
  );
}

export const formatMoneyCompact = (locale: Locale, value: number): string => formatPrice(locale, value);
