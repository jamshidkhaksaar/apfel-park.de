import { createAdminDbClient } from "@/lib/admin-db";

export type RepairPartQuality = "genuine" | "premium" | "standard";

export type RepairPartVariant = {
  id: string;
  label: string;
  quality: RepairPartQuality;
  price: number | null;
  note?: string;
};

export type RepairCatalogPart = {
  id: string;
  name: string;
  variants: RepairPartVariant[];
};

export type RepairCatalogModel = {
  id: string;
  name: string;
  price: number | null;
  note?: string;
  sourceUrl?: string;
  image?: string;
  parts?: RepairCatalogPart[];
  launchYear?: number;
  colors?: string[];
  modelNumbers?: string[];
};

export type RepairFamilyType = "phone" | "tablet" | "watch" | "laptop" | "pc" | "other";

export type RepairCatalogFamily = {
  id: string;
  name: string;
  type?: RepairFamilyType;
  description?: string;
  sourceUrl?: string;
  models: RepairCatalogModel[];
};

export type RepairCatalogBrand = {
  id: string;
  name: string;
  icon: string;
  description?: string;
  sourceUrl?: string;
  families: RepairCatalogFamily[];
};

export type RepairCatalog = {
  brands: RepairCatalogBrand[];
};

const m = (
  id: string,
  name: string,
  price: number | null,
  sourceUrl?: string,
  note?: string,
): RepairCatalogModel => ({ id, name, price, sourceUrl, note });

const family = (
  id: string,
  name: string,
  sourceUrl: string,
  models: RepairCatalogModel[],
  description?: string,
): RepairCatalogFamily => ({
  id,
  name,
  sourceUrl,
  models,
  description,
});

const iphonesSource = "https://www.ikitit.de/apple/apple-iphone-reparatur/";
const ipadsSource = "https://www.ikitit.de/apple/apple-ipad-reparatur/";
const appleWatchSource = "https://www.ikitit.de/apple/apple-watch-reparatur/apple-watch-serie-3-2-1/";
const samsungRootSource = "https://www.ikitit.de/samsung-luebeck-reparatur/";
const samsungSSource = "https://www.ikitit.de/samsung/samsung-galaxy-s-serie-reparatur/";
const samsungASource = "https://www.ikitit.de/samsung/samsung-galaxy-a-serie-reparatur/";
const samsungFlipSource = "https://www.ikitit.de/samsung-luebeck-reparatur/samsung-z-flip-reparatur/";
const samsungTabletSource = "https://www.ikitit.de/sony/galaxy-tablet/";
const pixelSource = "https://www.ikitit.de/google-pixel-reparatur-luebeck/";
const xiaomiSource = "https://www.ikitit.de/xiaomi-reparatur-luebeck/";
const fairphoneSource = "https://www.ikitit.de/fairphone/";
const sonySource = "https://www.ikitit.de/sony/";
const sonyXZSource = "https://www.ikitit.de/sony/xperia-x-serie/sony-xperia-xz/";
const sonyZ5CompactSource = "https://www.ikitit.de/sony/xperia-z-serie/sony-xperia-z5-compact/";

export const defaultRepairCatalog: RepairCatalog = {
  brands: [
    {
      id: "apple",
      name: "Apple",
      icon: "apple",
      description: "iPhone, iPad und Apple Watch Reparaturen aus dem iKitIt Katalog.",
      sourceUrl: "https://www.ikitit.de/apple-luebeck/",
      families: [
        family("iphone", "iPhone", iphonesSource, [
          m("iphone-17-pro-max", "iPhone 17 Pro Max", 499.9, iphonesSource),
          m("iphone-17-pro", "iPhone 17 Pro", 499.9, iphonesSource),
          m("iphone-17", "iPhone 17", 499.9, iphonesSource),
          m("iphone-air", "iPhone Air", 499.9, iphonesSource),
          m("iphone-16-pro-max", "iPhone 16 Pro Max", 499.9, iphonesSource),
          m("iphone-11", "iPhone 11", 69.9, iphonesSource),
          m("iphone-xr", "iPhone XR", 69.9, iphonesSource),
          m("iphone-x", "iPhone X", 59.9, iphonesSource),
          m("iphone-se-3", "iPhone SE (3. Gen.)", 49.9, iphonesSource),
          m("iphone-8", "iPhone 8", 49.9, iphonesSource),
          m("iphone-7", "iPhone 7", 49.9, iphonesSource),
        ], "Display-/Basispreise laut iKitIt Katalog."),
        family("ipad", "iPad", ipadsSource, [
          m("ipad-pro-13-m5", 'iPad Pro 13" (M5)', 849.9, ipadsSource),
          m("ipad-pro-11-m5", 'iPad Pro 11" (M5)', 699.9, ipadsSource),
          m("ipad-pro-12-9-6", 'iPad Pro 12.9" (6. Gen.)', 499.9, ipadsSource),
          m("ipad-8", "iPad (8. Gen.)", 149.9, ipadsSource),
          m("ipad-6", "iPad (6. Gen.)", 99.9, ipadsSource),
          m("ipad-4", "iPad (4. Gen.)", 79.9, ipadsSource),
          m("ipad-mini-6", "iPad Mini (6. Gen.)", 249.9, ipadsSource),
          m("ipad-2", "iPad 2", 49.9, ipadsSource),
        ], "iPad Reparaturpreise laut iKitIt Katalog."),
        family("apple-watch", "Apple Watch", appleWatchSource, [
          m("apple-watch-ultra-2", "Apple Watch Ultra 2", 319.9, appleWatchSource),
          m("apple-watch-ultra", "Apple Watch Ultra", 239.9, appleWatchSource),
          m("apple-watch-series-9", "Apple Watch Series 9", 199.9, appleWatchSource),
          m("apple-watch-series-6", "Apple Watch Series 6", 149.9, appleWatchSource),
          m("apple-watch-se", "Apple Watch SE", 149.9, appleWatchSource),
          m("apple-watch-series-3", "Apple Watch Series 3", 129.9, appleWatchSource),
        ], "Watch Preise aus dem Apple Watch Katalog von iKitIt."),
      ],
    },
    {
      id: "samsung",
      name: "Samsung",
      icon: "samsung",
      description: "Galaxy Smartphones, Tablets und Foldables.",
      sourceUrl: samsungRootSource,
      families: [
        family("galaxy-s", "Galaxy S Series", samsungSSource, [
          m("s25-ultra", "Galaxy S25 Ultra", 299.9, samsungSSource),
          m("s25-plus", "Galaxy S25 Plus", 239.9, samsungSSource),
          m("s25", "Galaxy S25", 199.9, samsungSSource),
          m("s24-ultra", "Galaxy S24 Ultra", 299.9, samsungSSource),
          m("s24-plus", "Galaxy S24 Plus", 199.9, samsungSSource),
          m("s24", "Galaxy S24", 169.9, samsungSSource),
          m("s24-fe", "Galaxy S24 FE", 149.9, samsungSSource),
          m("s23-ultra", "Galaxy S23 Ultra", 299.9, samsungSSource),
          m("s23", "Galaxy S23", 179.9, samsungSSource),
          m("s22-ultra", "Galaxy S22 Ultra", 299.9, samsungSSource),
        ], "Aktuelle S-Serie Preise laut iKitIt."),
        family("galaxy-a", "Galaxy A Series", samsungASource, [
          m("a72", "Galaxy A72", 139.9, samsungASource),
          m("a55", "Galaxy A55 5G", 129.9, samsungASource),
          m("a54", "Galaxy A54 5G", 129.9, samsungASource),
          m("a53", "Galaxy A53 5G", 109.9, samsungASource),
          m("a52", "Galaxy A52", 109.9, samsungASource),
          m("a51", "Galaxy A51", 99.9, samsungASource),
          m("a50", "Galaxy A50", 99.9, samsungASource),
          m("a34", "Galaxy A34 5G", 139.9, samsungASource),
          m("a03", "Galaxy A03 / A03S", 99.9, samsungASource),
        ], "Galaxy A Preise laut iKitIt."),
        family("galaxy-tab-a", "Galaxy Tablets A Series", samsungTabletSource, [
          m("tab-a9-plus", "Galaxy Tab A9+", null, samsungTabletSource, "Preis auf Anfrage"),
          m("tab-a8", "Galaxy Tab A8", null, samsungTabletSource, "Preis auf Anfrage"),
          m("tab-a7", "Galaxy Tab A7", null, samsungTabletSource, "Preis auf Anfrage"),
        ], "Die unterstützten A-Serie Tablets sind gelistet, Preise werden individuell angeboten."),
        family("galaxy-tab-s", "Galaxy Tablets S Series", samsungTabletSource, [
          m("tab-s9", "Galaxy Tab S9", null, samsungTabletSource, "Preis auf Anfrage"),
          m("tab-s8", "Galaxy Tab S8", null, samsungTabletSource, "Preis auf Anfrage"),
          m("tab-s7-fe", "Galaxy Tab S7 FE", null, samsungTabletSource, "Preis auf Anfrage"),
          m("tab-s6", "Galaxy Tab S6", null, samsungTabletSource, "Preis auf Anfrage"),
        ], "Die Galaxy Tab Seite nennt Modelle, aber keine festen Preise."),
        family("z-flip", "Flip Phones", samsungFlipSource, [
          m("z-flip-6", "Galaxy Z Flip 6", null, samsungFlipSource, "Preis auf Anfrage"),
          m("z-flip-5", "Galaxy Z Flip 5", null, samsungFlipSource, "Preis auf Anfrage"),
          m("z-flip-4", "Galaxy Z Flip 4", null, samsungFlipSource, "Preis auf Anfrage"),
        ], "Foldable Geräte werden bei iKitIt nach Fehlerbild angeboten."),
        family("z-fold", "Fold Phones", samsungFlipSource, [
          m("z-fold-6", "Galaxy Z Fold 6", null, samsungFlipSource, "Preis auf Anfrage"),
          m("z-fold-5", "Galaxy Z Fold 5", null, samsungFlipSource, "Preis auf Anfrage"),
          m("z-fold-4", "Galaxy Z Fold 4", null, samsungFlipSource, "Preis auf Anfrage"),
        ], "Die Z Fold Modelle werden im Z Flip/Fold Reparaturbereich individuell bewertet."),
      ],
    },
    {
      id: "google-pixel",
      name: "Google Pixel",
      icon: "google",
      description: "Google Pixel Reparaturen von Pixel 4 bis zur aktuellen Generation.",
      sourceUrl: pixelSource,
      families: [
        family("pixel", "Pixel Smartphones", pixelSource, [
          m("pixel-9-pro-fold", "Google Pixel 9 Pro Fold", 349.9, pixelSource),
          m("pixel-9-pro-xl", "Google Pixel 9 Pro XL", 399.9, pixelSource),
          m("pixel-9-pro", "Google Pixel 9 Pro", 379.9, pixelSource),
          m("pixel-9", "Google Pixel 9", 299.9, pixelSource),
          m("pixel-8-pro", "Google Pixel 8 Pro", 369.9, pixelSource),
          m("pixel-8a", "Google Pixel 8a", 179.9, pixelSource),
          m("pixel-8", "Google Pixel 8", 239.9, pixelSource),
          m("pixel-7-pro", "Google Pixel 7 Pro", 299.9, pixelSource),
          m("pixel-7a", "Google Pixel 7a", 189.9, pixelSource),
          m("pixel-7", "Google Pixel 7", 249.9, pixelSource),
          m("pixel-6-pro", "Google Pixel 6 Pro", 289.9, pixelSource),
          m("pixel-6", "Google Pixel 6", 199.9, pixelSource),
          m("pixel-6a", "Google Pixel 6a", 149.9, pixelSource),
          m("pixel-5", "Google Pixel 5", 209.9, pixelSource),
          m("pixel-4-xl", "Google Pixel 4 XL", 249.9, pixelSource),
          m("pixel-4", "Google Pixel 4", 249.9, pixelSource),
        ], "Google Pixel Preise direkt aus dem iKitIt Katalog."),
      ],
    },
    {
      id: "xiaomi",
      name: "Xiaomi",
      icon: "xiaomi",
      description: "Xiaomi, POCO und Redmi Reparaturen.",
      sourceUrl: xiaomiSource,
      families: [
        family("xiaomi-main", "Xiaomi Series", xiaomiSource, [
          m("xiaomi-13-ultra", "Xiaomi 13 Ultra", 799.9, xiaomiSource),
          m("xiaomi-13-pro", "Xiaomi 13 Pro 5G", 599.9, xiaomiSource),
          m("xiaomi-13", "Xiaomi 13 5G", 399.9, xiaomiSource),
          m("xiaomi-13-lite", "Xiaomi 13 Lite 5G", 199.9, xiaomiSource),
          m("xiaomi-12t", "Xiaomi 12T / 12T Pro 5G", 199.9, xiaomiSource),
          m("xiaomi-12-pro", "Xiaomi 12 Pro", 149.9, xiaomiSource),
          m("xiaomi-12", "Xiaomi 12", 179.9, xiaomiSource),
          m("xiaomi-12-lite", "Xiaomi 12 Lite", 149.9, xiaomiSource),
        ], "Direkte Xiaomi Modelle mit festen Katalogpreisen."),
        family("poco", "POCO", xiaomiSource, [
          m("poco-f5-pro", "POCO F5 Pro 5G", 279.9, xiaomiSource),
          m("poco-f5", "POCO F5", 259.9, xiaomiSource),
          m("poco-x5-pro", "POCO X5 Pro 5G", 199.9, xiaomiSource),
          m("poco-x5", "POCO X5 5G", 189.9, xiaomiSource),
          m("poco-m5", "POCO M5", 99.9, xiaomiSource),
        ], "POCO Preise laut iKitIt."),
        family("redmi", "Redmi", xiaomiSource, [
          m("redmi-note", "Redmi Note / Redmi Mainline", null, xiaomiSource, "Preis auf Anfrage"),
          m("redmi-a", "Redmi A Series", null, xiaomiSource, "Preis auf Anfrage"),
        ], "Redmi wird unterstützt; konkrete Preise werden individuell angeboten."),
      ],
    },
    {
      id: "fairphone",
      name: "Fairphone",
      icon: "fairphone",
      description: "Nachhaltige Smartphone-Reparaturen.",
      sourceUrl: fairphoneSource,
      families: [
        family("fairphone", "Fairphone", fairphoneSource, [
          m("fairphone-5", "Fairphone 5", null, fairphoneSource, "Preis auf Anfrage"),
          m("fairphone-4", "Fairphone 4", null, fairphoneSource, "Preis auf Anfrage"),
          m("fairphone-3-plus", "Fairphone 3+", null, fairphoneSource, "Preis auf Anfrage"),
        ], "iKitIt listet Fairphone Reparaturen ohne festen Sofortpreis."),
      ],
    },
    {
      id: "nothing",
      name: "Nothing Phone",
      icon: "nothing",
      description: "Manuell gepflegte Marke für Nothing und CMF Geräte.",
      families: [
        family("nothing-phone", "Nothing Phone", "", [
          m("nothing-phone-2", "Nothing Phone (2)", null, undefined, "Preis auf Anfrage"),
          m("nothing-phone-2a", "Nothing Phone (2a)", null, undefined, "Preis auf Anfrage"),
          m("cmf-phone-1", "CMF Phone 1", null, undefined, "Preis auf Anfrage"),
        ], "Keine öffentlichen iKitIt Preise gefunden. Diese Reihe ist manuell anlegbar."),
      ],
    },
    {
      id: "sony",
      name: "Sony",
      icon: "sony",
      description: "Sony Xperia Smartphones und Tablets.",
      sourceUrl: sonySource,
      families: [
        family("xperia-x", "Xperia X Series", sonyXZSource, [
          m("xperia-xz", "Sony Xperia XZ", 149.9, sonyXZSource),
          m("xperia-x-compact", "Sony Xperia X Compact", 159.9, sonyXZSource, "Bitte Details im Sony Katalog prüfen"),
        ], "Repräsentative Xperia X-Serie Modelle aus dem Sony Katalog."),
        family("xperia-z", "Xperia Z Series", sonyZ5CompactSource, [
          m("xperia-z5-compact", "Sony Xperia Z5 Compact", 99.9, sonyZ5CompactSource),
          m("xperia-z-ultra", "Sony Xperia Z Ultra", 99.9, sonyZ5CompactSource, "Bitte Details im Sony Katalog prüfen"),
        ], "Ältere Xperia Z Modelle aus dem Sony Bereich."),
        family("xperia-tablet", "Xperia Tablet Series", sonySource, [
          m("xperia-tablet", "Sony Xperia Tablet", null, sonySource, "Preis auf Anfrage"),
        ], "Tablet Geräte werden individuell angeboten."),
      ],
    },
  ],
};

const VALID_QUALITIES = new Set<string>(["genuine", "premium", "standard"]);

const sanitizePartVariant = (v: unknown): RepairPartVariant | null => {
  if (!v || typeof v !== "object") return null;
  const variant = v as Record<string, unknown>;
  const id = typeof variant.id === "string" && variant.id.trim() ? variant.id : "";
  const label = typeof variant.label === "string" && variant.label.trim() ? variant.label : "";
  if (!id || !label) return null;
  const quality: RepairPartQuality = VALID_QUALITIES.has(variant.quality as string)
    ? (variant.quality as RepairPartQuality)
    : "standard";
  return {
    id,
    label,
    quality,
    price: typeof variant.price === "number" && Number.isFinite(variant.price) ? variant.price : null,
    note: typeof variant.note === "string" && variant.note.trim() ? variant.note : undefined,
  };
};

const sanitizePart = (v: unknown): RepairCatalogPart | null => {
  if (!v || typeof v !== "object") return null;
  const part = v as Record<string, unknown>;
  const id = typeof part.id === "string" && part.id.trim() ? part.id : "";
  const name = typeof part.name === "string" && part.name.trim() ? part.name : "";
  if (!id || !name) return null;
  const variants = Array.isArray(part.variants)
    ? (part.variants.map(sanitizePartVariant).filter(Boolean) as RepairPartVariant[])
    : [];
  return { id, name, variants };
};

const sanitizeModel = (value: unknown): RepairCatalogModel | null => {
  if (!value || typeof value !== "object") return null;
  const model = value as Record<string, unknown>;
  const id = typeof model.id === "string" && model.id.trim() ? model.id : "";
  const name = typeof model.name === "string" && model.name.trim() ? model.name : "";
  if (!id || !name) return null;

  return {
    id,
    name,
    price: typeof model.price === "number" && Number.isFinite(model.price) ? model.price : null,
    note: typeof model.note === "string" && model.note.trim() ? model.note : undefined,
    sourceUrl: typeof model.sourceUrl === "string" && model.sourceUrl.trim() ? model.sourceUrl : undefined,
    image: typeof model.image === "string" && model.image.trim() ? model.image : undefined,
    launchYear: typeof model.launchYear === "number" && Number.isInteger(model.launchYear) && model.launchYear > 1990
      ? model.launchYear : undefined,
    ...((() => {
      const colors = Array.isArray(model.colors)
        ? (model.colors as unknown[]).filter((c): c is string => typeof c === "string" && c.trim() !== "").map(c => (c as string).trim())
        : [];
      return colors.length > 0 ? { colors } : {};
    })()),
    ...((() => {
      const modelNumbers = Array.isArray(model.modelNumbers)
        ? (model.modelNumbers as unknown[]).filter((n): n is string => typeof n === "string" && n.trim() !== "").map(n => (n as string).trim())
        : [];
      return modelNumbers.length > 0 ? { modelNumbers } : {};
    })()),
    ...((() => {
      const sanitizedParts = Array.isArray(model.parts)
        ? (model.parts.map(sanitizePart).filter(Boolean) as RepairCatalogPart[])
        : [];
      return sanitizedParts.length > 0 ? { parts: sanitizedParts } : {};
    })()),
  };
};

const VALID_FAMILY_TYPES = new Set<string>(["phone", "tablet", "watch", "laptop", "pc", "other"]);

const sanitizeFamily = (value: unknown): RepairCatalogFamily | null => {
  if (!value || typeof value !== "object") return null;
  const family = value as Record<string, unknown>;
  const id = typeof family.id === "string" && family.id.trim() ? family.id : "";
  const name = typeof family.name === "string" && family.name.trim() ? family.name : "";
  if (!id || !name) return null;

  const models = Array.isArray(family.models) ? family.models.map(sanitizeModel).filter(Boolean) as RepairCatalogModel[] : [];

  return {
    id,
    name,
    type: VALID_FAMILY_TYPES.has(family.type as string) ? (family.type as RepairFamilyType) : undefined,
    description: typeof family.description === "string" && family.description.trim() ? family.description : undefined,
    sourceUrl: typeof family.sourceUrl === "string" && family.sourceUrl.trim() ? family.sourceUrl : undefined,
    models,
  };
};

const sanitizeBrand = (value: unknown): RepairCatalogBrand | null => {
  if (!value || typeof value !== "object") return null;
  const brand = value as Record<string, unknown>;
  const id = typeof brand.id === "string" && brand.id.trim() ? brand.id : "";
  const name = typeof brand.name === "string" && brand.name.trim() ? brand.name : "";
  if (!id || !name) return null;

  const families = Array.isArray(brand.families)
    ? (brand.families.map(sanitizeFamily).filter(Boolean) as RepairCatalogFamily[])
    : [];

  return {
    id,
    name,
    icon: typeof brand.icon === "string" && brand.icon.trim() ? brand.icon : id,
    description: typeof brand.description === "string" && brand.description.trim() ? brand.description : undefined,
    sourceUrl: typeof brand.sourceUrl === "string" && brand.sourceUrl.trim() ? brand.sourceUrl : undefined,
    families,
  };
};

export const normalizeRepairCatalog = (value: unknown): RepairCatalog => {
  if (!value || typeof value !== "object") return defaultRepairCatalog;
  const record = value as Record<string, unknown>;
  const brands = Array.isArray(record.brands)
    ? (record.brands.map(sanitizeBrand).filter(Boolean) as RepairCatalogBrand[])
    : [];

  if (brands.length === 0) {
    return defaultRepairCatalog;
  }

  return { brands };
};

/**
 * Like normalizeRepairCatalog but intended for the admin save path:
 * it sanitizes input without ever falling back to the hard-coded default,
 * so the admin can actually delete brands and persist an empty (or reduced) catalog.
 */
export const sanitizeCatalogForSave = (value: unknown): RepairCatalog => {
  if (!value || typeof value !== "object") return { brands: [] };
  const record = value as Record<string, unknown>;
  const brands = Array.isArray(record.brands)
    ? (record.brands.map(sanitizeBrand).filter(Boolean) as RepairCatalogBrand[])
    : [];
  return { brands };
};

export const getRepairCatalog = async (): Promise<RepairCatalog> => {
  try {
    const admin = createAdminDbClient();
    const { data, error } = await admin
      .from("store_settings")
      .select("value")
      .eq("key", "repair_catalog")
      .maybeSingle();

    if (error) {
      console.error("[repair-catalog] read error:", error);
      return defaultRepairCatalog;
    }

    // No row in DB yet — show default so the admin can seed the catalog
    if (data === null) return defaultRepairCatalog;

    // Row exists — trust what was saved (even an empty brand list)
    const raw = typeof data.value === "string" ? JSON.parse(data.value) : data.value;
    return sanitizeCatalogForSave(raw);
  } catch (err) {
    console.error("[repair-catalog] unexpected error:", err);
    return defaultRepairCatalog;
  }
};
