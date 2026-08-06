/**
 * Product slug generation — the single source of truth for how product URLs
 * are formed, shared by the admin API, the import endpoint and
 * scripts/migrate-slugs.mjs.
 *
 * Why this shape: the old `slugify(title)-<Date.now()>` slugs carried a
 * meaningless 13-digit epoch. The timestamp is dropped, but the title is kept
 * as the base, because the title is the only field that actually distinguishes
 * products in this catalog — 2,820 of 2,902 products are accessories, where
 * brand + model + condition is not unique at all. Measured over the 2,881
 * timestamped slugs: a brand+model+condition base collides 1,785 times (70
 * products all wanting `guess-iphone-15-pro-neu`), while a title base collides
 * 44 times. German characters are transliterated rather than deleted, so
 * "Kopfhörer" becomes "kopfhoerer" and not "kopfhrer".
 *
 * An existing slug is never rewritten on edit; re-slugging happens only
 * through scripts/migrate-slugs.mjs, which records the old value in
 * product_slug_history so the old URL keeps resolving via a 308.
 */

export type SlugSource = {
  brand?: string | null;
  model?: string | null;
  title?: string | null;
  subtitle?: string | null;
  condition?: string | null;
  variants?: Array<{ storage?: string | null }> | null;
};

const CONDITION_LABELS: Record<string, string> = {
  new: "neu",
  open_box: "openbox",
  used: "gebraucht",
};

/** German (and common Latin) characters spelled out rather than dropped. */
const TRANSLITERATION: Record<string, string> = {
  "ä": "ae", "ö": "oe", "ü": "ue", "ß": "ss",
  "à": "a", "á": "a", "â": "a", "ã": "a", "å": "a",
  "è": "e", "é": "e", "ê": "e", "ë": "e",
  "ì": "i", "í": "i", "î": "i", "ï": "i",
  "ò": "o", "ó": "o", "ô": "o", "õ": "o", "ø": "o",
  "ù": "u", "ú": "u", "û": "u",
  "ç": "c", "ñ": "n", "ý": "y",
};

/** Longest slug we will generate, trimmed on a word boundary. */
const MAX_BASE_LENGTH = 72;

/** Normalize arbitrary text into a URL-safe slug fragment. */
export const slugify = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[äöüßàáâãåèéêëìíîïòóôõøùúûçñý]/g, (char) => TRANSLITERATION[char] ?? char)
    // Anything still accented decomposes to its base letter.
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    // Separators become spaces first, so "Over-Ear/USB-C" does not fuse.
    .replace(/[^a-z0-9\s-]/g, " ")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

/** Pull a storage size (128GB, 256GB, 1TB…) out of text, if present. */
export const extractStorage = (parts: Array<string | null | undefined>): string | null => {
  for (const part of parts) {
    const match = part?.match(/\b(\d{1,4})\s*(gb|tb)\b/i);
    if (match) {
      const value = Number(match[1]);
      const unit = match[2].toLowerCase() === "tb" ? "tb" : "gb";
      return `${value}${unit}`;
    }
  }
  return null;
};

/** Trim to a length limit without cutting a word in half. */
const truncateOnWord = (slug: string, max: number): string => {
  if (slug.length <= max) return slug;
  const parts = slug.split("-");
  let result = "";
  for (const part of parts) {
    const candidate = result ? `${result}-${part}` : part;
    if (candidate.length > max) break;
    result = candidate;
  }
  return result || slug.slice(0, max).replace(/-$/, "");
};

/**
 * Build the stable base slug for a product.
 *
 * The title carries the distinguishing detail (design, colour, capacity), so
 * it is the base. The brand is prefixed only when the title does not already
 * name it, and the condition is appended so the same device sold new and used
 * do not fight for one URL.
 */
export const buildBaseSlug = (source: SlugSource): string => {
  const title = slugify(source.title ?? "");
  const brand = slugify(source.brand ?? "");
  const model = slugify(source.model ?? "");
  const condition = CONDITION_LABELS[source.condition ?? "new"] ?? "neu";

  // Fall back to brand/model when there is no usable title at all.
  const core = title || [brand, model].filter(Boolean).join("-");
  if (!core) return "produkt";

  const withBrand = brand && !core.startsWith(brand) ? `${brand}-${core}` : core;

  // Storage is usually already in the title; add it only when it is missing
  // and a variant declares one, so "iPhone 15 Pro" variants stay distinct.
  const storage = extractStorage([source.title, source.subtitle]) ? null : extractStorage((source.variants ?? []).map((variant) => variant.storage));
  const withStorage = storage ? `${withBrand}-${storage}` : withBrand;

  return `${truncateOnWord(withStorage, MAX_BASE_LENGTH)}-${condition}`;
};

/**
 * Make a base slug unique against every slug already in use (or claimed by
 * this session's earlier re-slugs), appending -2, -3… when it collides.
 */
export const uniquifySlug = (base: string, taken: Set<string>): string => {
  if (!taken.has(base)) return base;
  let index = 2;
  while (taken.has(`${base}-${index}`)) index += 1;
  return `${base}-${index}`;
};
