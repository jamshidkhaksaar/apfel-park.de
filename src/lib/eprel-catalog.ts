type KnownEprelModelRule = {
  brand: string;
  hardwareModel: string;
  match: RegExp;
  exclude?: RegExp;
};

/**
 * Verified marketing-name -> EU manufacturer EPREL modelIdentifier rules.
 * Ordered most specific first; `exclude` prevents base models swallowing Pro/Max/Plus.
 */
const KNOWN_EU_HARDWARE_RULES: KnownEprelModelRule[] = [
  { brand: 'apple', hardwareModel: 'A3526', match: /\biphone\s*17\s*pro\s*max\b/i },
  { brand: 'apple', hardwareModel: 'A3523', match: /\biphone\s*17\s*pro\b/i, exclude: /\bmax\b/i },
  { brand: 'apple', hardwareModel: 'A3517', match: /\biphone\s*(?:17\s*)?air\b/i },
  { brand: 'apple', hardwareModel: 'A3520', match: /\biphone\s*17\b/i, exclude: /\b(?:pro|max|air|plus|mini|e)\b/i },
  { brand: 'apple', hardwareModel: 'A3409', match: /\biphone\s*16e\b/i },
  { brand: 'apple', hardwareModel: 'A3296', match: /\biphone\s*16\s*pro\s*max\b/i },
  { brand: 'apple', hardwareModel: 'A3293', match: /\biphone\s*16\s*pro\b/i, exclude: /\bmax\b/i },
  { brand: 'apple', hardwareModel: 'A3290', match: /\biphone\s*16\s*plus\b/i },
  { brand: 'apple', hardwareModel: 'A3287', match: /\biphone\s*16\b/i, exclude: /\b(?:pro|max|plus|mini|e)\b/i },
  { brand: 'apple', hardwareModel: 'A3094', match: /\biphone\s*15\s*plus\b/i },
  { brand: 'apple', hardwareModel: 'A3090', match: /\biphone\s*15\b/i, exclude: /\b(?:pro|max|plus|mini)\b/i },

  { brand: 'samsung', hardwareModel: 'SM-S938B', match: /\bgalaxy\s*s25\s*ultra\b/i },
  { brand: 'samsung', hardwareModel: 'SM-S936B', match: /\bgalaxy\s*s25\s*(?:\+|plus)\b/i },
  { brand: 'samsung', hardwareModel: 'SM-S731B', match: /\bgalaxy\s*s25\s*fe\b/i },
  { brand: 'samsung', hardwareModel: 'SM-S931B', match: /\bgalaxy\s*s25\b/i, exclude: /\b(?:ultra|fe|plus|edge|\+)\b/i },
  { brand: 'samsung', hardwareModel: 'SM-F966B', match: /\bgalaxy\s*z\s*fold\s*7\b/i },
  { brand: 'samsung', hardwareModel: 'SM-F766B', match: /\bgalaxy\s*z\s*flip\s*7\b/i },
  { brand: 'samsung', hardwareModel: 'SM-A576B', match: /\bgalaxy\s*a57\b/i },
  { brand: 'samsung', hardwareModel: 'SM-A566B', match: /\bgalaxy\s*a56\b/i },
  { brand: 'samsung', hardwareModel: 'SM-A366B', match: /\bgalaxy\s*a36\b/i },
  { brand: 'samsung', hardwareModel: 'SM-A266B', match: /\bgalaxy\s*a26\b/i },
  { brand: 'samsung', hardwareModel: 'SM-A176B', match: /\bgalaxy\s*a17\b/i, exclude: /\b4g\b/i },
  { brand: 'samsung', hardwareModel: 'SM-A166B', match: /\bgalaxy\s*a16\b/i, exclude: /\b4g\b/i },
  { brand: 'samsung', hardwareModel: 'SM-A165F', match: /\bgalaxy\s*a16\s*4g\b/i },
];

export const resolveKnownEuHardwareModel = (brand: string, model: string): string | null => {
  const b = brand.trim().toLowerCase();
  const normalized = `${brand} ${model}`.toLowerCase().replace(/[^a-z0-9+]+/g, ' ').replace(/\s+/g, ' ').trim();
  const match = KNOWN_EU_HARDWARE_RULES.find(
    rule => (b ? rule.brand === b || b.includes(rule.brand) : true)
      && rule.match.test(normalized)
      && !(rule.exclude && rule.exclude.test(normalized)),
  );
  return match?.hardwareModel ?? null;
};
