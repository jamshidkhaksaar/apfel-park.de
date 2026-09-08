import { createHash } from 'node:crypto';
import { normalizeAiTextFields, type AiTextField } from '@/lib/product-ai-fields';

/** Hash the same normalized, bounded text that the Merchant feed transmits. */
export const merchantDescriptionHash = (text: string): string => createHash('sha256')
  .update(text.replace(/\s+/g, ' ').trim().slice(0, 5000))
  .digest('hex');

/** Only public-text fingerprints leave import metadata. Never expose raw metadata. */
export const readDescriptionAiHashes = (value: unknown): string[] => Array.isArray(value)
  ? [...new Set(value.filter((hash): hash is string => typeof hash === 'string' && /^[a-f0-9]{64}$/.test(hash)))].slice(0, 64)
  : [];

/** A stale marker must not classify a replacement description as AI-created. */
export const isAiGeneratedDescription = (text: string, hashes: unknown): boolean =>
  Boolean(text.trim()) && readDescriptionAiHashes(hashes).includes(merchantDescriptionHash(text));

type TextValues = { title?: unknown; description?: unknown };
type TextProvenance = { titleAiHashes: string[]; descriptionAiHashes: string[] };
const record = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
const textValue = (value: unknown): string => typeof value === 'string' ? value : '';

export const knownAiTextFields = (metadata: unknown, text: TextValues): AiTextField[] => {
  const provenance = record(record(metadata).contentProvenance);
  return (['title', 'description'] as const).filter(field =>
    isAiGeneratedDescription(textValue(text[field]), provenance[`${field}AiHashes`]),
  );
};

/** Compute fingerprints server-side for the final reviewed text, never trust client hashes.
 * Existing AI lineage survives manual editing; empty/omitted flags cannot erase it.
 * Merge this fragment into contentProvenance while preserving unrelated metadata keys.
 */
export const buildAiTextProvenance = (
  metadata: unknown,
  previous: TextValues,
  next: TextValues,
  declaredFields: unknown,
): TextProvenance => {
  const provenance = record(record(metadata).contentProvenance);
  const marked = new Set([...knownAiTextFields(metadata, previous), ...normalizeAiTextFields(declaredFields)]);
  const hashes = (field: AiTextField): string[] => {
    const value = textValue(next[field]);
    return readDescriptionAiHashes([
      ...(marked.has(field) && value.trim() ? [merchantDescriptionHash(value)] : []),
      ...readDescriptionAiHashes(provenance[`${field}AiHashes`]),
    ]);
  };
  return { titleAiHashes: hashes('title'), descriptionAiHashes: hashes('description') };
};

export const aiIntakeTextProvenance = (de: TextValues, en: TextValues, fields: unknown): TextProvenance =>
  buildAiTextProvenance({ contentProvenance: buildAiTextProvenance(null, {}, de, fields) }, de, en, fields);
