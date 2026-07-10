import type { Locale } from "../lib/i18n";
import type { Product } from "../lib/products";

type ConditionBadgeProps = {
  condition: Product["condition"];
  lang: Locale;
  className?: string;
};

/**
 * Renders an "Open-Box" badge for products whose condition is not "new"
 * (refurbished or used). Returns null for new products.
 */
export default function ConditionBadge({ condition, lang, className = "" }: ConditionBadgeProps) {
  if (!condition || condition === "new") return null;
  return (
    <span
      className={`inline-flex items-center rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-400 ring-1 ring-emerald-500/30 ${className}`}
    >
      {lang === "de" ? "Open-Box" : "Open-Box"}
    </span>
  );
}
