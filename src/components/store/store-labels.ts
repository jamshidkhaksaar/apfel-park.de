import type { Locale } from "@/lib/i18n";
import type { ProductCategory, ProductCondition } from "@/lib/products";

export const categoryLabels = {
  de: { smartphones: "Smartphone", tablets: "Tablet", accessories: "Zubehör", consoles: "Konsole", laptops: "Laptop" },
  en: { smartphones: "Smartphone", tablets: "Tablet", accessories: "Accessory", consoles: "Console", laptops: "Laptop" },
} as const satisfies Record<Locale, Record<ProductCategory, string>>;

export const conditionLabels = {
  de: { new: "Versiegelt", open_box: "Open Box", used: "Gebraucht" },
  en: { new: "Sealed", open_box: "Open Box", used: "Used" },
} as const satisfies Record<Locale, Record<ProductCondition, string>>;

export type StockTone = "out" | "low" | "in";

/**
 * Availability is the card's trust signal — there are no reviews to lean on —
 * so it gets one shared treatment across the grid, the list rows and the PDP.
 * `low` uses gold rather than `--orange`, which resolves to a neutral grey in
 * the mono theme and would read as disabled instead of urgent.
 */
export const stockTone = (stock: number, isOutOfStock: boolean): StockTone =>
  isOutOfStock ? "out" : stock <= 3 ? "low" : "in";

export const stockToneClass: Record<StockTone, string> = {
  out: "text-red-text",
  low: "text-gold-text",
  in: "text-green-text",
};

export const stockLabel = (locale: Locale, stock: number, tone: StockTone): string => {
  const isGerman = locale === "de";
  if (tone === "out") return isGerman ? "Ausverkauft" : "Out of stock";
  if (tone === "low") return isGerman ? `Nur noch ${stock}` : `Only ${stock} left`;
  return isGerman ? "Sofort verfügbar" : "In stock";
};

export const deliveryLabel = (locale: Locale): string =>
  locale === "de" ? "1–3 Werktage · Abholung möglich" : "1–3 business days · pickup available";
