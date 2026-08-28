import type { Locale } from "../lib/i18n";
import type { Product } from "../lib/products";

type ConditionBadgeProps = {
  condition: Product["condition"];
  lang: Locale;
  className?: string;
};

const STYLES: Record<string, string> = {
  new: "bg-gold/15 text-gold-text ring-gold/30",
  open_box: "bg-green/15 text-green-text ring-green/30",
  used: "bg-blue/15 text-blue-text ring-blue/30",
};

const LABELS: Record<string, { de: string; en: string }> = {
  new: { de: "Versiegelt", en: "Sealed" },
  open_box: { de: "Unboxed", en: "Unboxed" },
  used: { de: "Gebraucht A+", en: "Used A+" },
};

/**
 * Shows the product condition as a small chip: Sealed (new), Unboxed
 * (open_box) or Used. Renders for every condition so customers always
 * see what they are buying.
 */
export default function ConditionBadge({ condition, lang, className = "" }: ConditionBadgeProps) {
  const key = condition && LABELS[condition] ? condition : "new";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ring-1 ${STYLES[key]} ${className}`}
    >
      {LABELS[key][lang === "de" ? "de" : "en"]}
    </span>
  );
}
