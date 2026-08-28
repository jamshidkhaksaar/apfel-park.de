import type { Locale } from "./i18n";
import type { ProductCondition } from "./products";

export type ProductPageSignalInput = {
  locale: Locale;
  condition: ProductCondition;
  stock?: number;
  batteryHealth?: number;
  hasRealProductPhotos: boolean;
};

export type ProductPageSignals = {
  conditionTitle: string;
  conditionLabel: string;
  stockLabel: string;
  fulfillmentLabel: string;
  realPhotosLabel: string | null;
  batteryLabel: string | null;
};

export type ProductConditionNoteInput = {
  condition: ProductCondition;
  model?: string;
  note?: string;
};

const normalizeText = (value: string): string => value.toLocaleLowerCase().replace(/[^a-z0-9]+/gi, " ").trim();

export const getSafeConditionNote = ({ condition, model, note }: ProductConditionNoteInput): string | null => {
  const cleanNote = note?.trim();
  if (!cleanNote) return null;
  const normalizedNote = normalizeText(cleanNote);
  if (condition === "used" && /(?:fabrikneu|neu und unbenutzt|brand new|factory new|new and unused|new unused|unused)/.test(normalizedNote)) return null;

  const normalizedModel = normalizeText(model ?? "");
  if (normalizedModel && !/\bmax\b/.test(normalizedModel) && normalizedNote.includes(`${normalizedModel} max`)) return null;
  return cleanNote;
};

export const getProductPageSignals = ({
  locale,
  condition,
  stock,
  batteryHealth,
  hasRealProductPhotos,
}: ProductPageSignalInput): ProductPageSignals => {
  const isGerman = locale === "de";
  const conditionLabel = condition === "new"
    ? isGerman ? "Neu & versiegelt" : "New & sealed"
    : condition === "open_box"
      ? "Open-Box"
      : isGerman ? "Gebraucht" : "Used";

  return {
    conditionTitle: isGerman ? "Zustand transparent" : "Condition transparency",
    conditionLabel,
    stockLabel: stock !== undefined
      ? stock > 0
        ? isGerman ? `${stock} verfügbar` : `${stock} available`
        : isGerman ? "Ausverkauft" : "Sold out"
      : isGerman ? "Ausverkauft" : "Out of stock",
    fulfillmentLabel: typeof stock === "number" && stock > 0
      ? isGerman ? "Abholung oder Versand" : "Pickup or delivery"
      : isGerman ? "Derzeit nicht verfügbar" : "Not currently available",
    realPhotosLabel: hasRealProductPhotos
      ? isGerman ? "Echte Produktfotos" : "Real product photos"
      : null,
    batteryLabel: batteryHealth !== undefined
      ? isGerman ? `Batteriekapazität: ${batteryHealth}%` : `Battery health: ${batteryHealth}%`
      : null,
  };
};
