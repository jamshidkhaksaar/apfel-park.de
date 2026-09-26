/**
 * Derives a product subcategory from its title/subtitle/model text.
 *
 * 2,820 of 2,902 products sat in a single "accessories" category, so the admin
 * filters could not narrow anything down. These rules are the single source of
 * truth, shared by the API (which classifies on save) and by
 * scripts/classify-subcategories.mjs (which backfills in bulk).
 *
 * Order matters -- first match wins. A case that mentions MagSafe is a case,
 * not a mount, while a "MagSafe Ladegerät" is charging, which is why charging
 * is tested first. Many cases never say "Hülle" at all ("BMW M IML Metal Logos
 * MagSafe für iPhone 17 Pro") and some encode the type in the MPN (GUHC... is a
 * Guess hard case), so anything left over that names a phone falls back to a
 * case rather than to "other".
 */
export const SUBCATEGORY_RULES: ReadonlyArray<readonly [string, RegExp]> = [
  ["replacement-displays", /ersatzdisplay|displayeinheit|replacement display|lcd assembly|soft oled|hard oled|incell|in-cell/],
  ["screen-protection", /panzerglas|displayschutz|schutzglas|schutzfolie|displayfolie|screen protector|\bfolie\b/],
  ["audio", /kopfhörer|kopfhoerer|headphone|headset|earbud|airpod|ohrhörer|lautsprecher|speaker|soundbar/],
  ["wearables", /smartwatch|fitness.?tracker|smart.?band|aktivitätstracker/],
  ["watch-straps", /uhrenarmband|armband|watch band|watchband|\bstrap\b/],
  ["charging", /powerbank|ladekabel|ladegerät|ladegeraet|ladestation|charger|netzteil|\bkabel\b|\bcable\b|adapter|\bakku\b|\bbattery\b|wireless charg|typ.?c|usb.?c|klinke|buchse/],
  ["cases-wallet", /wally|wallet|folio|\bbook\b|kartenfach|klapp|\bflip\b|geldbörse/],
  ["cases-hard", /hardcase|hartschale|hard case|hardshell|hardcover|\bhc\b|\b[a-z]{2,3}hc[a-z0-9]{5,}/],
  ["cases-silicone", /silikon|silicone|gelskin|\btpu\b|\bgel\b|liquid/],
  ["cases-clear", /transparent|\bclear\b|\bcromo\b|crystal/],
  ["cases-other", /hülle|huelle|schutzhülle|\bcase\b|\bcover\b|bumper|rückseiten|magsafe|\b[a-z]{2,3}hm[a-z0-9]{5,}/],
  ["holders-mounts", /halterung|\bhalter\b|\bholder\b|\bstand\b|\bmount\b|kfz-|autohalter|popgrip|\bgrip\b|ringhalter/],
  ["bags", /tasche|\bbag\b|sleeve|rucksack|backpack|beutel/],
  ["computer", /maus|\bmouse\b|tastatur|keyboard|\bhub\b|docking|hdmi|rj45/],
  ["pens", /stylus|\bstift\b|\bpen\b/],
  ["cases-other", /iphone|galaxy|samsung|pixel|xiaomi|huawei|z fold|z flip/],
];

export const PART_SUBCATEGORIES = ['replacement-displays', 'replacement-batteries', 'repair-components'] as const;

/** Avoid confusing power banks, screen protectors or cases with internal parts. */
export const classifyPartSubcategory = (text: string): string | null => {
  const haystack = text.toLowerCase();
  if (/ersatzdisplay|displayeinheit|replacement display|lcd assembly|soft oled|hard oled|incell|in-cell/.test(haystack)) return 'replacement-displays';
  if (!/power.?bank|externer akku|external battery|battery case|powerbank.hülle/.test(haystack)
    && /ersatzakku|replacement batter|internal batter|(?:akku|battery).*(?:für|for).*?(?:iphone|galaxy|samsung|pixel|xiaomi|huawei)|(?:iphone|galaxy|samsung|pixel|xiaomi|huawei).*?(?:akku|battery)/.test(haystack)) return 'replacement-batteries';
  if (/ersatzteil|repair component|flexkabel|flex cable|ladebuchse|charging port|hörmuschel|earpiece assembly|kameramodul|camera module/.test(haystack)) return 'repair-components';
  return null;
};

/** Accessories and repair parts each have their own subcategories. */
export const classifySubcategory = (category: string | null, text: string): string => {
  if (category === "parts") return classifyPartSubcategory(text) ?? "repair-components";
  if (category !== "accessories") return category ?? "other";
  const haystack = text.toLowerCase();
  for (const [name, pattern] of SUBCATEGORY_RULES) if (pattern.test(haystack)) return name;
  return "other";
};

export const ACCESSORY_SUBCATEGORIES = [
  "replacement-displays",
  "cases-hard",
  "cases-silicone",
  "cases-wallet",
  "cases-clear",
  "cases-other",
  "charging",
  "screen-protection",
  "audio",
  "watch-straps",
  "holders-mounts",
  "bags",
  "wearables",
  "computer",
  "pens",
  "other",
] as const;

export const subcategoryLabel = (slug: string, locale: "de" | "en"): string => {
  const labels: Record<string, [string, string]> = {
    parts: ["Ersatzteile", "Spare parts"],
    "replacement-batteries": ["Ersatzakkus", "Replacement batteries"],
    "repair-components": ["Reparaturkomponenten", "Repair components"],
    "replacement-displays": ["Ersatzdisplays", "Replacement displays"],
    "cases-hard": ["Hardcases", "Hard cases"],
    "cases-silicone": ["Silikonhüllen", "Silicone cases"],
    "cases-wallet": ["Klapphüllen", "Wallet cases"],
    "cases-clear": ["Transparente Hüllen", "Clear cases"],
    "cases-other": ["Hüllen (sonstige)", "Cases (other)"],
    charging: ["Laden & Kabel", "Charging & cables"],
    "screen-protection": ["Displayschutz", "Screen protection"],
    audio: ["Audio", "Audio"],
    "watch-straps": ["Armbänder", "Watch straps"],
    "holders-mounts": ["Halterungen", "Holders & mounts"],
    bags: ["Taschen", "Bags"],
    wearables: ["Wearables", "Wearables"],
    computer: ["Computer-Zubehör", "Computer"],
    pens: ["Stifte", "Pens"],
    other: ["Sonstiges", "Other"],
    smartphones: ["Smartphones", "Smartphones"],
    tablets: ["Tablets", "Tablets"],
  };
  const entry = labels[slug];
  return entry ? (locale === "de" ? entry[0] : entry[1]) : slug;
};
