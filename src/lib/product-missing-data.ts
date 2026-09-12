import type { ProductChannelFacts } from "./product-channel-readiness";
import { evaluateProductChannelReadiness } from "./product-channel-readiness";

export type MissingDataInput = ProductChannelFacts & {
  model?: string;
  batteryHealth?: string | number | null;
  isActive?: boolean;
};

export type MissingDataItem = {
  messageDe?: string;
  labelDe?: string;
  code: string;
  label: string;
  severity: "error" | "warning";
  channel: "store" | "google" | "ebay" | "amazon" | null;
  aiFillable: boolean;
  message: string;
};

export type MissingDataChecklist = {
  items: MissingDataItem[];
  errorCount: number;
  warningCount: number;
  stockZero: boolean;
  inactive: boolean;
};

const channelLabel = {
  store: "Store",
  google: "Google Merchant",
  ebay: "eBay.de",
  amazon: "Amazon.de",
} as const;

export function productMissingData(input: MissingDataInput): MissingDataChecklist {
  const readiness = evaluateProductChannelReadiness(input);
  const items: MissingDataItem[] = [];
  const push = (item: MissingDataItem) => items.push(item);
  if (input.energyReviewRequired) {
    push({ code: 'energy_review', label: 'Energy evidence review', labelDe: 'Energie-Nachweis prüfen', severity: 'error', channel: 'google', aiFillable: false,
      message: 'Google publication is on hold. Verify the exact device and supplier energy-label evidence before requesting reactivation. AI fill or an ordinary save does not clear this hold.',
      messageDe: 'Google-Veröffentlichung pausiert. Exaktes Gerät und Energie-Nachweis vom Lieferanten prüfen, bevor die Freigabe angefordert wird. KI-Ausfüllen oder normales Speichern hebt die Prüfsperre nicht auf.' });
  }

  const imageCount = input.images?.filter(Boolean).length ?? 0;
  if (imageCount === 0) {
    push({ code: "images_none", label: "Images", severity: "error", channel: "store", aiFillable: true, message: "No product images. Add a cover or use AI fill." });
  } else if (imageCount < 4) {
    push({ code: "images_few", label: "Images", severity: "warning", channel: "store", aiFillable: true, message: `Only ${imageCount} of 4 recommended images.` });
  }

  if (!input.gtin?.trim()) {
    push({ code: "gtin_missing", label: "GTIN", severity: "error", channel: "google", aiFillable: false, message: "GTIN missing. Enter manually for Google Merchant." });
  }
  if (!input.mpn?.trim()) {
    push({ code: "mpn_missing", label: "MPN", severity: "warning", channel: "ebay", aiFillable: false, message: "MPN missing. Enter manually for eBay/Amazon." });
  }
  if (!input.brand?.trim()) {
    push({ code: "brand_missing", label: "Brand", severity: "error", channel: "google", aiFillable: true, message: "Brand missing." });
  }
  if (!input.title?.trim()) {
    push({ code: "title_missing", label: "Title", severity: "error", channel: "store", aiFillable: true, message: "Title missing." });
  }
  if (!input.description?.trim()) {
    push({ code: "description_missing", label: "Description", severity: "error", channel: "store", aiFillable: true, message: "Description missing." });
  }
  if (input.condition === "open_box" || input.condition === "used") {
    if (!input.conditionNote?.trim()) {
      push({ code: "condition_note_missing", label: "Condition note", severity: "error", channel: "store", aiFillable: false, message: "Condition note required for open-box/used." });
    }
    if (!input.hasRealProductPhotos) {
      push({ code: "real_photos_missing", label: "Exact-device photos", severity: "error", channel: "store", aiFillable: false, message: "Confirm exact-device photos." });
    }
  }
  if (input.condition === "used" && /iphone/i.test(`${input.brand} ${input.model} ${input.title}`) && !String(input.batteryHealth ?? "").trim()) {
    push({ code: "battery_missing", label: "Battery health", severity: "error", channel: "store", aiFillable: true, message: "Battery health required for used iPhones." });
  }
  if (!input.manufacturer?.name) {
    push({ code: "gpsr_manufacturer", label: "GPSR manufacturer", severity: "warning", channel: "google", aiFillable: true, message: "GPSR manufacturer details incomplete." });
  }
  if (!input.euResponsiblePerson?.name) {
    push({ code: "gpsr_eu_responsible", label: "EU responsible person", severity: "warning", channel: "google", aiFillable: true, message: "EU responsible person missing." });
  }

  for (const channel of ["store", "google", "ebay", "amazon"] as const) {
    for (const error of readiness[channel].errors) {
      if (input.energyReviewRequired && channel === 'google' && error === 'Energy-label evidence requires review before Google publication.') continue;
      push({ code: `channel_${channel}`, label: channelLabel[channel], severity: "error", channel, aiFillable: false, message: error });
    }
  }

  return {
    items,
    errorCount: items.filter((item) => item.severity === "error").length,
    warningCount: items.filter((item) => item.severity === "warning").length,
    stockZero: Number(input.stock ?? 0) <= 0,
    inactive: input.isActive === false,
  };
}
