import { discountPercentage } from "@/lib/catalog-card";
import { formatPrice } from "@/lib/format";
import type { Locale } from "@/lib/i18n";

const sizes = {
  card: { price: "text-xl", strike: "text-xs", tag: "text-[11px]" },
  row: { price: "text-2xl", strike: "text-sm", tag: "text-xs" },
  detail: { price: "text-3xl", strike: "text-sm", tag: "text-xs" },
} as const;

/**
 * One price treatment for the whole store: card, list row, quick-add drawer and
 * the product buy box. Tabular figures keep prices aligned down a column, which
 * is what makes a grid of products scan like a shop rather than a brochure.
 */
export default function PriceBlock({
  locale,
  price,
  compareAtPrice,
  size = "card",
  align = "start",
  className = "",
  from = false,
  lowest30Days = false,
}: {
  locale: Locale;
  price: number;
  compareAtPrice?: number;
  size?: keyof typeof sizes;
  align?: "start" | "end";
  className?: string;
  from?: boolean;
  /** The strike price is the 30-day lowest price (Black Friday): label it so. */
  lowest30Days?: boolean;
}) {
  const scale = sizes[size];
  const discount = discountPercentage(price, compareAtPrice);
  const isGerman = locale === "de";

  return (
    <div className={`flex flex-col gap-0.5 ${align === "end" ? "items-end text-right" : "items-start"} ${className}`}>
      <p className={`${scale.price} font-bold tabular-nums leading-tight text-foreground`}><span className="sr-only">{isGerman ? "Aktueller Preis: " : "Current price: "}</span>{from ? <span className="mr-1 text-sm font-medium">{isGerman ? "Ab" : "From"}</span> : null}{formatPrice(locale, price)}</p>
      {compareAtPrice && compareAtPrice > price ? (
        <p className={`flex flex-wrap items-center gap-1.5 ${scale.strike} leading-tight`}>
          {lowest30Days ? (
            <span className="text-muted">{isGerman ? "30-Tage-Tiefstpreis" : "Lowest 30-day price"}</span>
          ) : null}
          <span className="font-semibold tabular-nums text-muted-strong line-through"><span className="sr-only">{lowest30Days ? (isGerman ? "Niedrigster Preis der letzten 30 Tage: " : "Lowest price of the last 30 days: ") : (isGerman ? "Vorheriger Preis: " : "Previous price: ")}</span>{formatPrice(locale, compareAtPrice)}</span>
          {/* The Black Friday badge already shows the saving. */}
          {discount && !lowest30Days ? (
            <span className={`rounded bg-sale px-1.5 py-0.5 ${scale.tag} font-bold tabular-nums text-white`}>
              −{discount}%
              <span className="sr-only"> {isGerman ? "gespart" : "off"}</span>
            </span>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
