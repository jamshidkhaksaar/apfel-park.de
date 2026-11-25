import type { Locale } from "./i18n";

/**
 * Prices in page titles and snippets.
 *
 * English searches from Germany ("iphone 16 pro max price in germany") reach
 * the English pages by the tens of thousands but rarely click: the old titles
 * never answered the question. These helpers put the live price into the
 * title, within the 47 characters left before the " | Apfel Park" suffix.
 */

export const TITLE_BUDGET = 47;

/** "€1,049" / "1.049 €"; cents only when the price has them, never rounded away. */
export const titleEuro = (value: number, locale: Locale): string => {
  const whole = Number.isInteger(value);
  return new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-IE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(value);
};

/** "iPhone 16 Pro Max 256 GB A+ – €1,049 in Germany", shortened to fit, or null. */
export const germanyPriceTitle = (name: string, price: number, options: { from?: boolean } = {}): string | null => {
  if (!(price > 0)) return null;
  const amount = `${options.from ? "from " : ""}${titleEuro(price, "en")}`;
  const candidates = [`${name} – ${amount} in Germany`, `${name} – ${amount}`];
  return candidates.find((candidate) => candidate.length <= TITLE_BUDGET) ?? null;
};

/** Collection title for a model page: "iPhone 17 Price in Germany – from €799". */
export const modelPriceTitle = (model: string, fromPrice: number): string | null => {
  if (!(fromPrice > 0)) return null;
  const amount = `from ${titleEuro(fromPrice, "en")}`;
  const candidates = [`${model} Price in Germany – ${amount}`, `${model} Price Germany – ${amount}`, `${model} – ${amount}`];
  return candidates.find((candidate) => candidate.length <= TITLE_BUDGET) ?? null;
};

export const modelPriceDescription = (model: string, fromPrice: number): string =>
  `Current ${model} prices in Germany from ${titleEuro(fromPrice, "en")}: new, open-box and used (Grade A+) with warranty. Delivery across Germany or pickup in Hamburg.`;
