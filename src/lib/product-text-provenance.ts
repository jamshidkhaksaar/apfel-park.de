import { createHash } from 'node:crypto';

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
