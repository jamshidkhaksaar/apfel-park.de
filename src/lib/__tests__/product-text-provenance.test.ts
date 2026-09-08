import { describe, expect, it } from 'vitest';
import { isAiGeneratedDescription, merchantDescriptionHash, readDescriptionAiHashes } from '../product-text-provenance';

describe('description provenance', () => {
  it('recognizes only exact known text, allowing feed whitespace normalization', () => {
    const hashes = [merchantDescriptionHash('Kapazität: 20.000 mAh. Für unterwegs.')];
    expect(isAiGeneratedDescription(' Kapazität: 20.000 mAh.\nFür unterwegs. ', hashes)).toBe(true);
    expect(isAiGeneratedDescription('Kapazität: 10.000 mAh. Für unterwegs.', hashes)).toBe(false);
  });
  it('does not guess the source of unknown or empty copy', () => {
    expect(isAiGeneratedDescription('Existing product text', undefined)).toBe(false);
    expect(isAiGeneratedDescription('', [merchantDescriptionHash('')])).toBe(false);
  });
  it('marks translations independently and retains known prior revisions', () => {
    const hashes = [merchantDescriptionHash('German text'), merchantDescriptionHash('English text')];
    expect(isAiGeneratedDescription('German text', hashes)).toBe(true);
    expect(isAiGeneratedDescription('English text', hashes)).toBe(true);
    expect(isAiGeneratedDescription('Manual replacement', hashes)).toBe(false);
  });
  it('rejects malformed metadata and never returns arbitrary metadata or secrets', () => {
    const valid = merchantDescriptionHash('Known copy');
    expect(readDescriptionAiHashes({ apiKey: 'private' })).toEqual([]);
    expect(readDescriptionAiHashes([valid, valid, 'private', null, 1, { hash: valid }, 'G'.repeat(64)])).toEqual([valid]);
  });
  it('bounds history and hashes the transmitted 5000-character text', () => {
    const hashes = Array.from({ length: 100 }, (_, index) => merchantDescriptionHash(`Revision ${index}`));
    expect(readDescriptionAiHashes(hashes)).toHaveLength(64);
    expect(merchantDescriptionHash('a'.repeat(5001))).toBe(merchantDescriptionHash('a'.repeat(5000)));
  });
});
