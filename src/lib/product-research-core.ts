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
  skuSuggestion?: string | null;
  eprelId?: string | null;
  specs?: Array<{ label: string; value: string }>;
  features?: string[];
  variants?: Array<{ color: string; storage: string; sku?: string; images?: string[] }>;
  gallery?: string[];
  batteryDetails?: { included?: boolean; wattHours?: number };
  manufacturer?: { name?: string; address?: string; email?: string };
  euResponsiblePerson?: { name?: string; address?: string; email?: string };
  energyLabel?: {
    efficiencyClass?: string;
    batteryEndurance?: string;
    batteryCycles?: number;
    reliabilityClass?: string;
    repairabilityClass?: string;
    ipRating?: string;
    labelImage?: string;
    ficheDe?: string;
    ficheEn?: string;
  };
  gtinSuggestion?: string | null;
  countryOfOrigin?: string;
  safetyWarnings?: string[];
  mpnSuggestion?: string | null;
  dimensions?: {
    heightMm?: number;
    widthMm?: number;
    depthMm?: number;
    weightG?: number;
    screenInches?: number;
  };
  packageContents?: Array<{ label: { de: string; en: string }; included: boolean }>;
  refurbishmentSteps?: Array<{ title: { de: string; en: string }; description: { de: string; en: string } }>;
  campaignSuggestion?: { badge: { de: string; en: string }; message: { de: string; en: string } };
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
          images: Array.isArray(entry.images)
            ? (entry.images as unknown[]).filter((url): url is string => typeof url === "string" && Boolean(url.trim()))
            : undefined,
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
  const skuRaw = text("sku", 80) || text("skuSuggestion", 80);
  const eprelRaw = text("eprelId", 50) || text("eprelRegistrationNumber", 50) || text("eprel", 50);

  const energyLabelRaw = value.energyLabel && typeof value.energyLabel === "object"
    ? value.energyLabel as Record<string, unknown>
    : null;

  return {
    title: text("title", 255),
    subtitle: text("subtitle", 300),
    description: text("description", 5000),
    brand: text("brand", 100),
    model: text("model", 160),
    category: text("category", 80),
    skuSuggestion: skuRaw || null,
    eprelId: eprelRaw || null,
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
    energyLabel: energyLabelRaw
      ? {
          efficiencyClass: textFrom(energyLabelRaw, "efficiencyClass", 10) || textFrom(energyLabelRaw, "energyClass", 10),
          batteryEndurance: textFrom(energyLabelRaw, "batteryEndurance", 60),
          batteryCycles: typeof energyLabelRaw.batteryCycles === "number" && Number.isFinite(energyLabelRaw.batteryCycles)
            ? Math.round(energyLabelRaw.batteryCycles)
            : undefined,
          repairabilityClass: textFrom(energyLabelRaw, "repairabilityClass", 10),
          reliabilityClass: textFrom(energyLabelRaw, "reliabilityClass", 10),
          ipRating: textFrom(energyLabelRaw, "ipRating", 20) || textFrom(energyLabelRaw, "ingressProtection", 20),
          labelImage: textFrom(energyLabelRaw, "labelImage", 300),
          ficheDe: textFrom(energyLabelRaw, "ficheDe", 300),
          ficheEn: textFrom(energyLabelRaw, "ficheEn", 300),
        }
      : undefined,
    gtinSuggestion,
    mpnSuggestion,
    countryOfOrigin: text("countryOfOrigin", 2)?.toUpperCase(),
    safetyWarnings: strings("safetyWarnings", 500),
    dimensions: value.dimensions && typeof value.dimensions === "object"
      ? {
          heightMm: positiveNum((value.dimensions as Record<string, unknown>).heightMm),
          widthMm: positiveNum((value.dimensions as Record<string, unknown>).widthMm),
          depthMm: positiveNum((value.dimensions as Record<string, unknown>).depthMm),
          weightG: positiveNum((value.dimensions as Record<string, unknown>).weightG),
          screenInches: positiveNum((value.dimensions as Record<string, unknown>).screenInches),
        }
      : undefined,
    packageContents: Array.isArray(value.packageContents)
      ? value.packageContents
          .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
          .map((item) => {
            const rawLabel = item.label;
            const de = typeof rawLabel === "string" ? rawLabel.trim() : (rawLabel && typeof rawLabel === "object" ? String((rawLabel as Record<string, unknown>).de ?? "").trim() : "");
            const en = typeof rawLabel === "string" ? rawLabel.trim() : (rawLabel && typeof rawLabel === "object" ? String((rawLabel as Record<string, unknown>).en ?? "").trim() : "");
            return {
              label: { de: de.slice(0, 120), en: (en || de).slice(0, 120) },
              included: item.included !== false,
            };
          })
          .filter((item) => item.label.de || item.label.en)
          .slice(0, 15)
      : undefined,
    refurbishmentSteps: Array.isArray(value.refurbishmentSteps)
      ? value.refurbishmentSteps
          .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
          .map((item) => {
            const rawTitle = item.title;
            const rawDesc = item.description;
            const titleDe = typeof rawTitle === "string" ? rawTitle.trim() : (rawTitle && typeof rawTitle === "object" ? String((rawTitle as Record<string, unknown>).de ?? "").trim() : "");
            const titleEn = typeof rawTitle === "string" ? rawTitle.trim() : (rawTitle && typeof rawTitle === "object" ? String((rawTitle as Record<string, unknown>).en ?? "").trim() : "");
            const descDe = typeof rawDesc === "string" ? rawDesc.trim() : (rawDesc && typeof rawDesc === "object" ? String((rawDesc as Record<string, unknown>).de ?? "").trim() : "");
            const descEn = typeof rawDesc === "string" ? rawDesc.trim() : (rawDesc && typeof rawDesc === "object" ? String((rawDesc as Record<string, unknown>).en ?? "").trim() : "");
            return {
              title: { de: titleDe.slice(0, 100), en: (titleEn || titleDe).slice(0, 100) },
              description: { de: descDe.slice(0, 700), en: (descEn || descDe).slice(0, 700) },
            };
          })
          .filter((item) => item.title.de && item.description.de)
          .slice(0, 8)
      : undefined,
    campaignSuggestion: value.campaignSuggestion && typeof value.campaignSuggestion === "object"
      ? {
          badge: {
            de: String((value.campaignSuggestion as Record<string, unknown>).badge && typeof (value.campaignSuggestion as Record<string, unknown>).badge === "object" ? ((value.campaignSuggestion as Record<string, unknown>).badge as Record<string, string>).de ?? "" : (value.campaignSuggestion as Record<string, unknown>).badge ?? "").trim().slice(0, 60),
            en: String((value.campaignSuggestion as Record<string, unknown>).badge && typeof (value.campaignSuggestion as Record<string, unknown>).badge === "object" ? ((value.campaignSuggestion as Record<string, unknown>).badge as Record<string, string>).en ?? "" : "").trim().slice(0, 60),
          },
          message: {
            de: String((value.campaignSuggestion as Record<string, unknown>).message && typeof (value.campaignSuggestion as Record<string, unknown>).message === "object" ? ((value.campaignSuggestion as Record<string, unknown>).message as Record<string, string>).de ?? "" : (value.campaignSuggestion as Record<string, unknown>).message ?? "").trim().slice(0, 300),
            en: String((value.campaignSuggestion as Record<string, unknown>).message && typeof (value.campaignSuggestion as Record<string, unknown>).message === "object" ? ((value.campaignSuggestion as Record<string, unknown>).message as Record<string, string>).en ?? "" : "").trim().slice(0, 300),
          },
        }
      : undefined,
  };
}

const positiveNum = (value: unknown): number | undefined => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

const textFrom = (obj: Record<string, unknown>, key: string, max: number): string | undefined => {
  const entry = obj[key];
  if (typeof entry !== "string") return undefined;
  const clean = entry.trim().slice(0, max);
  return clean && !SENSITIVE.test(clean) ? clean : undefined;
};
