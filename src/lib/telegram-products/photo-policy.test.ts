import { describe, expect, it, vi, afterEach } from 'vitest';
import sharp from 'sharp';
import { faithfulRetouchPrompt, photoVerdictPasses, safePhotoContext, telegramPhotoBlockers } from './photo-policy';
import { parseWorkReply, unsafeWorkText } from './chat';
import { composePhotoCover, verifyPhotoIdentity } from './photos';

vi.mock('@/lib/ai-provider-credentials', () => ({ resolveGeminiKey: async () => 'synthetic-key' }));
afterEach(() => vi.unstubAllGlobals());
const pass = { sameDevice: true, geometryPreserved: true, colorPreserved: true, conditionPreserved: true, screenPreserved: true, noArtifacts: true, confident: true, identityConflict: false };

describe('faithful studio policy', () => {
  it('requires every identity/condition check and rejects unknown or missing verdicts', () => {
    expect(photoVerdictPasses(pass)).toBe(true);
    for (const key of Object.keys(pass)) expect(photoVerdictPasses({ ...pass, [key]: !pass[key as keyof typeof pass] })).toBe(false);
    expect(photoVerdictPasses({ sameDevice: true })).toBe(false);
    expect(photoVerdictPasses(null)).toBe(false);
  });
  it('does not expose private numeric identifiers and forbids reconstruction', () => {
    const prompt = faithfulRetouchPrompt({ model: 'iPhone 17 Pro', feedback: 'IMEI: 490154203237518' });
    expect(prompt).toContain('iPhone 17 Pro');
    expect(prompt).not.toContain('490154203237518');
    expect(prompt).toContain('Never add wallpaper');
    expect(prompt).toContain('Never erase scratches');
    expect(safePhotoContext({ model: 'x', color: 'Silver' })).toEqual({ model: 'x', color: 'Silver' });
  });
  it('blocks linked legacy images but does not block unrelated historic evidence', () => {
    const doc = { entries: [{ photos: [{ url: '/uploads/cover.webp' }] }] };
    expect(telegramPhotoBlockers(doc, [{ publicUrl: '/uploads/cover.webp', sourceType: 'ai_composed_legacy', photoPolicyVersion: 0 }], 'en')).toHaveLength(1);
    expect(telegramPhotoBlockers(doc, [{ publicUrl: '/uploads/old.webp', sourceType: 'ai_composed_legacy' }], 'en')).toEqual([]);
    expect(telegramPhotoBlockers(doc, [{ publicUrl: '/uploads/cover.webp', sourceType: 'composed_photos', photoPolicyVersion: 1 }], 'de')).toEqual([]);
  });
  it('fails closed on changed geometry and malformed provider replies', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify({ ...pass, geometryPreserved: false }) }] } }] })));
    await expect(verifyPhotoIdentity(Buffer.from('safe-source'), Buffer.from('safe-edit'), { model: 'iPhone 17 Pro' })).rejects.toThrow('photo_identity_rejected');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: 'not json' }] } }] })));
    await expect(verifyPhotoIdentity(Buffer.from('safe-source'), Buffer.from('safe-edit'), {})).rejects.toThrow('photo_quality_unavailable');
  });
  it('composes actual source pixels without calling an image model', async () => {
    const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
    const solid = (background: string) => sharp({ create: { width: 10, height: 20, channels: 3, background } }).png().toBuffer();
    const cover = await composePhotoCover(await solid('#ff0000'), await solid('#0000ff'));
    const { data, info } = await sharp(cover).raw().toBuffer({ resolveWithObject: true });
    const pixel = (x: number, y: number) => [...data.subarray((y * info.width + x) * 3, (y * info.width + x) * 3 + 3)];
    expect(info.width).toBe(1500); expect(info.height).toBe(1500);
    expect(pixel(300, 750)).toEqual([255, 0, 0]); expect(pixel(1000, 750)).toEqual([0, 0, 255]);
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('work-only chat output boundary', () => {
  it('rejects off-topic and sensitive model output', () => {
    expect(parseWorkReply({ inScope: false, reply: 'A joke' }, 'en').reply).not.toContain('A joke');
    expect(parseWorkReply({ inScope: true, reply: 'IMEI: 490154203237518' }, 'en').reply).not.toContain('490154203237518');
    expect(unsafeWorkText('password: synthetic-secret')).toBe(true);
    expect(unsafeWorkText('How can I fix this product photo?')).toBe(false);
  });
  it('returns a proposal, never an arbitrary model tool or product update', () => {
    expect(parseWorkReply({ inScope: true, reply: 'Please review the photo.', photoCorrection: 'Keep the same camera panel.', action: 'publish', price: 1 }, 'en')).toEqual({ reply: 'Please review the photo.', feedback: 'Keep the same camera panel.' });
  });
});
