const GTIN_LENGTHS = new Set([8, 12, 13, 14]);

/**
 * Normalizes a barcode entered with spaces or dashes. Any other character is
 * rejected so a mistyped manufacturer identifier never reaches Google.
 */
export const normalizeGtin = (value: string | null | undefined): string | null => {
  const raw = value?.trim() ?? '';
  if (!raw) return null;
  if (!/^[\d\s-]+$/.test(raw)) return null;

  const digits = raw.replace(/[\s-]/g, '');
  return GTIN_LENGTHS.has(digits.length) ? digits : null;
};

export const isValidGtin = (value: string | null | undefined): boolean => {
  const digits = normalizeGtin(value);
  if (!digits) return false;

  const checkDigit = Number(digits.at(-1));
  const body = digits.slice(0, -1);
  const sum = [...body]
    .reverse()
    .reduce((total, digit, index) => total + Number(digit) * (index % 2 === 0 ? 3 : 1), 0);

  return (10 - (sum % 10)) % 10 === checkDigit;
};

export const validatedGtin = (value: string | null | undefined): string | null => {
  const normalized = normalizeGtin(value);
  return normalized && isValidGtin(normalized) ? normalized : null;
};
