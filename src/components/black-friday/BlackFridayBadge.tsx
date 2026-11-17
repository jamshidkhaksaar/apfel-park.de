import type { Locale } from "@/lib/i18n";

/**
 * Black Friday saving badge for the top-left corner of a product image. The
 * percentage is the saving against the 30-day lowest price (see
 * `campaign-pricing.ts`), so it can be shown as-is. CSS-only animation.
 */
export default function BlackFridayBadge({
  percent,
  locale,
  size = "card",
  className = "",
}: {
  percent: number;
  locale: Locale;
  size?: "card" | "row" | "detail";
  className?: string;
}) {
  const scale = {
    card: { pad: "px-2 pb-1.5 pt-1", label: "text-[7.5px]", pct: "text-[15px] px-1.5", gap: "gap-0.5" },
    row: { pad: "px-2 pb-1.5 pt-1", label: "text-[8px]", pct: "text-base px-1.5", gap: "gap-0.5" },
    detail: { pad: "px-3 pb-2 pt-1.5", label: "text-[10px]", pct: "text-2xl px-2", gap: "gap-1" },
  }[size];

  return (
    <span
      className={`bf-badge pointer-events-none inline-flex flex-col items-start ${scale.pad} ${scale.gap} ${className}`}
      role="img"
      aria-label={locale === "de" ? `Black Friday: ${percent} % Rabatt` : `Black Friday: ${percent}% off`}
    >
      <span className={`bf-gold-text relative z-[2] font-black uppercase leading-none tracking-[0.14em] ${scale.label}`}>
        Black Friday
      </span>
      <span
        className={`bf-badge-pct relative z-[2] rounded-[0.3rem] font-black leading-[1.15] tabular-nums text-white ${scale.pct}`}
      >
        −{percent}%
      </span>
    </span>
  );
}
