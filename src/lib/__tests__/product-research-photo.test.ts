import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const files = vi.hoisted(() => ({ readFile: vi.fn(), realpath: vi.fn() }));
vi.mock('node:fs/promises', () => ({ readFile: files.readFile, realpath: files.realpath }));
import { prepareResearchPhoto } from '../product-research-photo';

let raw: Buffer;
let redacted: Buffer;
beforeEach(async () => {
  vi.stubEnv('APFEL_INTAKE_VISION_TOKEN', 'synthetic-private-token-for-local-tests-only');
  raw = await sharp({ create: { width: 40, height: 40, channels: 3, background: 'white' } }).png().toBuffer();
  redacted = await sharp({ create: { width: 40, height: 40, channels: 3, background: 'black' } }).webp().toBuffer();
  files.readFile.mockReset().mockResolvedValue(redacted);
  files.realpath.mockReset().mockImplementation(async value => value);
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
const photo = () => new File([new Uint8Array(raw)], 'about.png', { type: 'image/png' });
const response = (options: RequestInit, extra: Record<string, unknown> = {}) => {
  const run = (options.body as FormData).get('run_id');
  return Response.json({ privacyScanPassed: true, modelName: 'iPhone', redactedPath: `/srv/n8n/media/intake/${run}/about.webp`, redactedSha256: createHash('sha256').update(redacted).digest('hex'), conflicts: [], ...extra });
};

describe('research photo privacy boundary', () => {
  it('sends raw bytes only to localhost and returns only the checked derivative', async () => {
    const fetcher = vi.fn(async (_url: string, options: RequestInit) => response(options));
    vi.stubGlobal('fetch', fetcher);
    const result = await prepareResearchPhoto(photo(), 'about_screen');
    expect(fetcher.mock.calls[0][0]).toBe('http://127.0.0.1:8730/extract');
    expect(result.data).toBe(redacted.toString('base64'));
    expect(result.data).not.toBe(raw.toString('base64'));
    expect(JSON.stringify(result)).not.toContain('/srv/');
  });
  it('rejects failed privacy checks before reading or forwarding any derivative', async () => {
    vi.stubGlobal('fetch', vi.fn(async (_url: string, options: RequestInit) => response(options, { privacyScanPassed: false })));
    await expect(prepareResearchPhoto(photo(), 'about_screen')).rejects.toThrow('photo_privacy_failed');
    expect(files.readFile).not.toHaveBeenCalled();
  });
  it('rejects mismatched file hashes and paths outside the generated run', async () => {
    vi.stubGlobal('fetch', vi.fn(async (_url: string, options: RequestInit) => response(options, { redactedSha256: '0'.repeat(64) })));
    await expect(prepareResearchPhoto(photo(), 'about_screen')).rejects.toThrow('photo_privacy_failed');
    files.realpath.mockResolvedValue('/etc/passwd');
    await expect(prepareResearchPhoto(photo(), 'about_screen')).rejects.toThrow('photo_privacy_failed');
  });
  it('does not transmit identity or invoice documents rejected by the local service', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ detail: 'extraction failed: NonDeviceDocument' }, { status: 422 })));
    await expect(prepareResearchPhoto(photo(), 'barcode_label')).rejects.toThrow('photo_wrong_document');
  });
  it('does not accept unknown photos without positive device evidence', async () => {
    vi.stubGlobal('fetch', vi.fn(async (_url: string, options: RequestInit) => response(options, { modelName: null })));
    await expect(prepareResearchPhoto(photo(), 'about_screen')).rejects.toThrow('photo_device_evidence_missing');
  });
});
