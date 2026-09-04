import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import sharp from 'sharp';
let root: string;
let uploadProductImage: typeof import('../blob').uploadProductImage;
beforeEach(async () => {
  root = await mkdtemp(path.join(os.tmpdir(), 'apfel-svg-'));
  vi.stubEnv('UPLOADS_DIR', root);
  vi.resetModules();
  ({ uploadProductImage } = await import('../blob'));
});
afterEach(async () => {
  vi.unstubAllEnvs();
  await rm(root, { recursive: true, force: true });
});
const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="red" /></svg>';
it.each([['logo.svg', 'image/svg+xml'], ['spoof.png', 'image/png']])('never publishes original SVG bytes for %s', async (name, type) => {
  const result = await uploadProductImage(new File([svg], name, { type }));
  expect(result.originalUrl).toMatch(/--original\.webp$/);
  for (const url of [result.originalUrl, ...Object.values(result.variants).map((variant) => variant.url)]) {
    const buffer = await readFile(path.join(root, url.slice('/uploads/'.length)));
    expect((await sharp(buffer).metadata()).format).toBe('webp');
  }
  expect(await readdir(path.join(root, 'products'))).toHaveLength(4);
});
it('preserves normal PNG originals and produces WebP variants', async () => {
  const png = await sharp({ create: { width: 40, height: 30, channels: 4, background: '#ff0000' } }).png().toBuffer();
  const result = await uploadProductImage(new File([new Uint8Array(png)], 'phone.png', { type: 'image/png' }));
  expect(result.originalUrl).toMatch(/--original\.png$/);
  expect(await readFile(path.join(root, result.originalUrl.slice('/uploads/'.length)))).toEqual(png);
  for (const variant of Object.values(result.variants)) {
    expect((await sharp(await readFile(path.join(root, variant.url.slice('/uploads/'.length)))).metadata()).format).toBe('webp');
  }
});

it('rejects active SVG before creating any public file', async () => {
  const active = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:s="http://www.w3.org/2000/svg"><s:script>alert(1)</s:script></svg>';
  await expect(uploadProductImage(new File([active], 'active.svg', { type: 'image/svg+xml' }))).rejects.toThrow();
  expect(await readdir(root)).toEqual([]);
});
