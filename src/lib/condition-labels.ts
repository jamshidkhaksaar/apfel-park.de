import type { Locale } from "@/lib/i18n";
import type { ProductCondition } from "@/lib/products";

/**
 * Apfel Park sells exactly three condition tiers, and these are the only
 * customer-facing words for them. Cards, filter pills, product pages, cart,
 * feeds and JSON-LD all read from here so a tier is never described two ways.
 *
 * There is deliberately no "refurbished"/"generalüberholt" tier: sealed and
 * open-box stock is new, and pre-owned stock is sold as tested grade A+.
 */
export const conditionLabels: Record<Locale, Record<ProductCondition, string>> = {
  de: {
    new: "Neu (Versiegelt)",
    open_box: "Neu – Open Box",
    used: "Gebraucht – Zustand A+",
  },
  en: {
    new: "New (Sealed)",
    open_box: "New – Open Box",
    used: "Used – Grade A+",
  },
};

export const conditionDescriptions: Record<Locale, Record<ProductCondition, string>> = {
  de: {
    new: "Originalversiegeltes Neugerät mit voller Herstellergarantie.",
    open_box: "Neugerät aus geöffneter Verpackung: unbenutzt, vollständig und mit Garantie.",
    used: "Geprüftes Gebrauchtgerät in Top-Zustand (Note A+) mit minimalen bis keinen Gebrauchsspuren.",
  },
  en: {
    new: "Original sealed new device with the full manufacturer warranty.",
    open_box: "New device from an opened box: unused, complete and covered by warranty.",
    used: "Tested pre-owned device in top condition (grade A+), with minimal to no signs of wear.",
  },
};

/** The condition shown for unknown or missing data, so cards never render blank. */
export const conditionLabel = (locale: Locale, condition: string | null | undefined): string =>
  (condition && (conditionLabels[locale] as Record<string, string>)[condition]) || conditionLabels[locale].new;
