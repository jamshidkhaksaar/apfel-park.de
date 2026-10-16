import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { afterEach, describe, expect, it, vi } from 'vitest';
const fixture = vi.hoisted(() => ({
  path: '',
  bytes: Buffer.alloc(0),
  query: vi.fn(),
}));
vi.mock('node:fs/promises', async (original) => ({
  ...(await original<typeof import('node:fs/promises')>()),
  realpath: async (value: string) => value,
  readFile: async (value: string) => {
    if (value === fixture.path) return fixture.bytes;
    throw new Error('unrecognized fixture path');
  },
}));
vi.mock('@/lib/db', () => ({ query: fixture.query, withTransaction: vi.fn() }));
vi.mock('@/lib/ai-provider-credentials', () => ({
  resolveGeminiKey: async () => 'synthetic-gemini-key',
}));
const { prepareTelegramPhoto, studioPhoto } = await import('./photos');
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});
describe('Telegram photo privacy and image API contract', () => {
  it('fails closed before external image work if local privacy scanning fails', async () => {
    vi.stubEnv('APFEL_INTAKE_VISION_TOKEN', 'x'.repeat(40));
    const fetch = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ privacyScanPassed: false }), {
          status: 200,
        }),
      );
    vi.stubGlobal('fetch', fetch);
    await expect(
      prepareTelegramPhoto(Buffer.from('synthetic raw pixels'), 'device'),
    ).rejects.toThrow('photo_privacy_failed');
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0][0]).toBe('http://127.0.0.1:8730/extract');
  });
  it('requires the exact run directory and matching derivative hash', async () => {
    vi.stubEnv('APFEL_INTAKE_VISION_TOKEN', 'x'.repeat(40));
    fixture.bytes = await sharp({
      create: { width: 20, height: 20, channels: 3, background: '#ccaa88' },
    })
      .webp()
      .toBuffer();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, request: RequestInit) => {
        const run = (request.body as FormData).get('run_id');
        fixture.path = `/srv/n8n/media/intake/${run}/condition_photo.webp`;
        return Response.json({
          privacyScanPassed: true,
          publishPath: fixture.path,
          publishSha256: createHash('sha256')
            .update(fixture.bytes)
            .digest('hex'),
        });
      }),
    );
    expect(
      (
        await prepareTelegramPhoto(
          Buffer.from('synthetic raw pixels'),
          'device',
        )
      ).bytes,
    ).toEqual(fixture.bytes);
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          Response.json({
            privacyScanPassed: true,
            publishPath: '/tmp/outside.webp',
            publishSha256: 'a'.repeat(64),
          }),
        ),
    );
    await expect(
      prepareTelegramPhoto(Buffer.from('raw'), 'device'),
    ).rejects.toThrow('photo_privacy_failed');
  });
  it('uses the documented image-edit request with only the prepared image and no conversation storage', async () => {
    const safe = await sharp({
      create: { width: 40, height: 40, channels: 3, background: '#aaaaaa' },
    })
      .webp()
      .toBuffer();
    fixture.query.mockResolvedValue({
      rows: [{ image_model: 'gemini-nano-banana-2.1' }],
    });
    const fetch = vi
      .fn()
      .mockResolvedValue(
        Response.json({ output_image: { data: safe.toString('base64') } }),
      );
    vi.stubGlobal('fetch', fetch);
    expect((await sharp(await studioPhoto(safe)).metadata()).format).toBe(
      'webp',
    );
    const [url, request] = fetch.mock.calls[0];
    expect(url).toBe(
      'https://generativelanguage.googleapis.com/v1beta/interactions',
    );
    const body = JSON.parse(request.body);
    expect(body.store).toBe(false);
    expect(body.input[1]).toEqual({
      type: 'image',
      mime_type: 'image/webp',
      data: safe.toString('base64'),
    });
    expect(body.input[0].text).toContain('scratches');
    expect(url).not.toContain('synthetic-gemini-key');
  });
});
