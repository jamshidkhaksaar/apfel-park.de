import { describe, expect, it } from 'vitest';
import { aiIntakeTextProvenance, buildAiTextProvenance, knownAiTextFields, isAiGeneratedDescription, merchantDescriptionHash, readDescriptionAiHashes } from '../product-text-provenance';
import { appliedResearchTextFields, normalizeAiTextFields } from '../product-ai-fields';

describe('description provenance', () => {
  it('marks only text returned by applied research and retains edited AI lineage', () => {
    expect(appliedResearchTextFields([], { title: 'AI title', description: '' })).toEqual(['title']);
    expect(appliedResearchTextFields(['description'], { title: 'AI title' })).toEqual(['title', 'description']);
    expect(normalizeAiTextFields(['stock', 'mpn', 'title', 'title'])).toEqual(['title']);
    expect(normalizeAiTextFields('description')).toEqual([]);
  });
  it('hashes reviewed edits rather than unreviewed research and does not trust submitted hashes', () => {
    const next = { title: 'Reviewed title', description: 'Reviewed German text' };
    const metadata = { contentProvenance: buildAiTextProvenance(null, {}, next, ['title', 'description']) };
    expect(knownAiTextFields(metadata, next)).toEqual(['title', 'description']);
    expect(knownAiTextFields(metadata, { title: 'Raw AI result' })).toEqual([]);
    expect(buildAiTextProvenance(null, {}, next, { descriptionAiHashes: ['injected'] })).toEqual({ titleAiHashes: [], descriptionAiHashes: [] });
  });
  it('carries existing AI origin through a manual edit even when the client omits flags', () => {
    const before = { title: 'Manual title', description: 'Known AI description' };
    const metadata = { contentProvenance: buildAiTextProvenance(null, {}, before, ['description']), unrelated: 'kept' };
    const copy = JSON.stringify(metadata);
    const next = { title: 'Manual title edited', description: 'AI description with staff corrections' };
    const provenance = buildAiTextProvenance(metadata, before, next, []);
    expect(knownAiTextFields({ contentProvenance: provenance }, next)).toEqual(['description']);
    expect(provenance.descriptionAiHashes).toContain(merchantDescriptionHash(before.description));
    expect(JSON.stringify(metadata)).toBe(copy);
  });
  it('does not carry stale or different-field markers onto manual copy', () => {
    const metadata = { contentProvenance: { descriptionAiHashes: [merchantDescriptionHash('Older text')] } };
    const result = buildAiTextProvenance(metadata, { description: 'Manual replacement' }, { title: 'Older text', description: 'New manual text' }, []);
    expect(knownAiTextFields({ contentProvenance: result }, { title: 'Older text', description: 'New manual text' })).toEqual([]);
  });
  it('records bilingual AI intake copy without treating manual/test intake as generated', () => {
    const de = { title: 'Deutscher Titel', description: 'Deutscher Text' };
    const en = { title: 'English title', description: 'English text' };
    const provenance = aiIntakeTextProvenance(de, en, ['title', 'description']);
    expect(knownAiTextFields({ contentProvenance: provenance }, de)).toEqual(['title', 'description']);
    expect(knownAiTextFields({ contentProvenance: provenance }, en)).toEqual(['title', 'description']);
    expect(aiIntakeTextProvenance(de, en, [])).toEqual({ titleAiHashes: [], descriptionAiHashes: [] });
  });
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
