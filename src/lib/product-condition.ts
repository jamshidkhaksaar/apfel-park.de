import type { Locale } from "@/lib/i18n";

type LocalizedConditionNote = {
  de?: string | null;
  en?: string | null;
};

const clean = (value: string | null | undefined): string => value?.trim() ?? "";

const PLACEHOLDER_LINE = /^\s*(?:none|null|undefined|n\/a|-+)\s*$/i;

/**
 * Some imported condition notes contain empty template values ("none") on
 * their own lines. Customers must never see them, so they are dropped
 * wherever a note is shown; real text on the same note stays as written.
 */
export const stripPlaceholderLines = (value: string | null | undefined): string =>
  clean(value).split(/\r?\n/).filter((line) => !PLACEHOLDER_LINE.test(line)).join("\n").trim();

/**
 * Imported products can carry translated condition notes. Once an admin edits
 * the canonical note, that manual value must win over stale import metadata.
 * Matching imported notes still retain their locale-specific translation.
 */
export const resolveProductConditionNote = (
  localized: LocalizedConditionNote | null | undefined,
  locale: Locale,
  canonical: string | null | undefined,
): string => {
  const canonicalNote = clean(canonical);
  const german = clean(localized?.de);
  const english = clean(localized?.en);
  const translationStillMatches = !canonicalNote || canonicalNote === german || canonicalNote === english;

  if (canonicalNote && !translationStillMatches) return stripPlaceholderLines(canonicalNote);
  return stripPlaceholderLines((locale === "de" ? german || english : english || german) || canonicalNote);
};

export const conditionDetailsChanged = (
  existing: { condition?: string | null; conditionNote?: string | null },
  next: { condition?: string | null; conditionNote?: string | null },
): boolean => clean(existing.condition) !== clean(next.condition)
  || clean(existing.conditionNote) !== clean(next.conditionNote);
