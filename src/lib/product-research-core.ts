import { validatedGtin } from "./product-identifiers";

// Structured result of AI research. GTIN/MPN are intentionally absent:
// they are always entered manually and never set by AI.
export type ProductResearchResult = {
  title?: string;
  subtitle?: string;
  description?: string;
  brand?: string;
  model?: string;
  category?: string;
  specs?: Array<{ label: string; value: string }>;
  features?: string[];
  variants?: Array<{ color: string; storage: string; sku?: string }>;
  gallery?: string[];
  batteryDetails?: { included?: boolean; wattHours?: number };
  manufacturer?: { name?: string; address?: string; email?: string };
  euResponsiblePerson?: { name?: string; address?: string; email?: string };
  energyLabel?: { efficiencyClass?: string; batteryEndurance?: string };
  gtinSuggestion?: string | null;
  mpnSuggestion?: string | null;
};

const SENSITIVE = /(imei|serial|serien|eid|meid)/i;

export function sanitizeResearchResult(raw: unknown): ProductResearchResult {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const value = raw as Record<string, unknown>;
  const text = (key: string, max = 500): string | undefined => {
    const entry = value[key];
    if (typeof entry !== "string") return undefined;
    const clean = entry.trim().slice(0, max);
    if (!clean || SENSITIVE.test(clean)) return undefined;
    return clean;
  };
  const strings = (key: string, max = 2000): string[] | undefined => {
    const entry = value[key];
    if (!Array.isArray(entry)) return undefined;
    const clean = entry.filter((item): item is string => typeof item === "string").map((item) => item.trim().slice(0, max)).filter(Boolean);
    return clean.length ? clean : undefined;
  };
  const specs = Array.isArray(value.specs)
    ? value.specs
        .filter((entry): entry is Record<string, unknown> => Boolean(entry && typeof entry === "object"))
        .map((entry) => ({ label: String(entry.label ?? "").trim().slice(0, 120), value: String(entry.value ?? "").trim().slice(0, 300) }))
        .filter((entry) => entry.label && entry.value && !SENSITIVE.test(entry.label) && !SENSITIVE.test(entry.value))
        .slice(0, 40)
    : undefined;
  const variants = Array.isArray(value.variants)
    ? value.variants
        .filter((entry): entry is Record<string, unknown> => Boolean(entry && typeof entry === "object"))
        .map((entry) => ({
          color: String(entry.color ?? "").trim().slice(0, 80),
          storage: String(entry.storage ?? "").trim().slice(0, 80),
          sku: String(entry.sku ?? "").trim().slice(0, 80) || undefined,
        }))
        .filter((entry) => entry.color && entry.storage)
        .slice(0, 20)
    : undefined;
  const gallery = strings("gallery", 2048)?.map((url) => {
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "https:") return "";
      return parsed.toString();
    } catch {
      return "";
    }
  }).filter(Boolean).slice(0, 12);

  const gtinRaw = text("gtin", 32);
  const gtinSuggestion = gtinRaw ? validatedGtin(gtinRaw) : null;
  const mpnRaw = text("mpn", 120);
  const mpnSuggestion = mpnRaw && !/^(?:n\/?a|none|unknown)$/i.test(mpnRaw) ? mpnRaw : null;

  return {
    title: text("title", 255),
    subtitle: text("subtitle", 300),
    description: text("description", 5000),
    brand: text("brand", 100),
    model: text("model", 160),
    category: text("category", 80),
    specs,
    features: strings("features", 300),
    variants,
    gallery,
    batteryDetails: value.batteryDetails && typeof value.batteryDetails === "object"
      ? { included: Boolean((value.batteryDetails as Record<string, unknown>).included), wattHours: Number((value.batteryDetails as Record<string, unknown>).wattHours) || undefined }
      : undefined,
    manufacturer: value.manufacturer && typeof value.manufacturer === "object"
      ? {
          name: textFrom(value.manufacturer as Record<string, unknown>, "name", 200),
          address: textFrom(value.manufacturer as Record<string, unknown>, "address", 300),
          email: textFrom(value.manufacturer as Record<string, unknown>, "email", 200),
        }
      : undefined,
    euResponsiblePerson: value.euResponsiblePerson && typeof value.euResponsiblePerson === "object"
      ? {
          name: textFrom(value.euResponsiblePerson as Record<string, unknown>, "name", 200),
          address: textFrom(value.euResponsiblePerson as Record<string, unknown>, "address", 300),
          email: textFrom(value.euResponsiblePerson as Record<string, unknown>, "email", 200),
        }
      : undefined,
    energyLabel: value.energyLabel && typeof value.energyLabel === "object"
      ? {
          efficiencyClass: textFrom(value.energyLabel as Record<string, unknown>, "efficiencyClass", 10),
          batteryEndurance: textFrom(value.energyLabel as Record<string, unknown>, "batteryEndurance", 60),
        }
      : undefined,
    gtinSuggestion,
    mpnSuggestion,
  };
}

const textFrom = (obj: Record<string, unknown>, key: string, max: number): string | undefined => {
  const entry = obj[key];
  if (typeof entry !== "string") return undefined;
  const clean = entry.trim().slice(0, max);
  return clean && !SENSITIVE.test(clean) ? clean : undefined;
};
