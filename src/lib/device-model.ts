/**
 * Extracts the phone/tablet model a product title refers to, so cross-sell can
 * match accessories to devices ("GUESS ... iPhone 15 Pro Max Hardcase" belongs
 * with the iPhone 15 Pro Max). Returns lowercase needles for ILIKE matching.
 * Spacing variants ("Z Fold7" / "Z Fold 7") are both returned because supplier
 * titles are inconsistent about them.
 */

type ModelMatch = {
  needle: string;
  variants?: string[];
};

const collapse = (value: string) => value.toLowerCase().replace(/\s+/g, " ").trim();

const MODEL_PATTERNS: Array<(text: string) => ModelMatch | null> = [
  (text) => {
    const match = /\biphone\s*(?:(se|air|xs\s*max|xs|xr|x)\b|(\d{1,2})\s*(pro\s*max|pro|plus|mini|air|e)?\b)/i.exec(text);
    if (!match) return null;
    if (match[1]) return { needle: collapse(`iphone ${match[1]}`) };
    const suffix = match[3] ? ` ${match[3]}` : "";
    return { needle: collapse(`iphone ${match[2]}${suffix}`) };
  },
  (text) => {
    const match = /\b(?:galaxy\s*)?z\s*(fold|flip)\s*(\d+)\b/i.exec(text);
    if (!match) return null;
    const kind = match[1].toLowerCase();
    const generation = match[2];
    return { needle: `z ${kind}${generation}`, variants: [`z ${kind}${generation}`, `z ${kind} ${generation}`] };
  },
  (text) => {
    const match = /\bgalaxy\s*([asm]\d{1,3})\s*(ultra|plus|fe)?\b/i.exec(text);
    if (!match) return null;
    const suffix = match[2] ? ` ${match[2]}` : "";
    return { needle: collapse(`galaxy ${match[1]}${suffix}`) };
  },
  (text) => {
    // Supplier titles often skip "Galaxy" ("BMW ... S23 Ultra S918"). Only
    // match when a series suffix follows, otherwise part numbers false-hit.
    const match = /\bs(\d{2})\s+(ultra|plus|fe)\b/i.exec(text);
    if (!match) return null;
    return { needle: collapse(`s${match[1]} ${match[2]}`) };
  },
  (text) => {
    const match = /\bpixel\s*(\d+a?)\s*(pro\s*xl|pro|xl)?\b/i.exec(text);
    if (!match) return null;
    const suffix = match[2] ? ` ${match[2]}` : "";
    return { needle: collapse(`pixel ${match[1]}${suffix}`) };
  },
  (text) => {
    const match = /\bredmi\s*(note\s*)?(\d+[a-z]*)\b/i.exec(text);
    if (!match) return null;
    const note = match[1] ? "note " : "";
    return { needle: collapse(`redmi ${note}${match[2]}`) };
  },
];

export const deviceModelNeedles = (text: string): string[] => {
  for (const pattern of MODEL_PATTERNS) {
    const match = pattern(text);
    if (match) {
      const variants = match.variants ?? [match.needle];
      return [...new Set(variants.map(collapse))];
    }
  }
  return [];
};
