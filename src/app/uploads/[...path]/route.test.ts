import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GET } from './route';

let directory: string;
const get = (...segments: string[]) => GET(new Request('http://localhost/uploads/test'), {
  params: Promise.resolve({ path: segments }),
});

beforeEach(async () => {
  directory = await mkdtemp(path.join(os.tmpdir(), 'apfel-uploads-'));
  vi.stubEnv('UPLOADS_DIR', path.join(directory, 'uploads'));
  await mkdir(path.join(directory, 'uploads/products'), { recursive: true });
});

afterEach(async () => {
  vi.unstubAllEnvs();
  await rm(directory, { recursive: true, force: true });
});

describe('runtime upload image serving', () => {
  it.each(['webp', 'png', 'jpeg'] as const)('serves a %s image created after an earlier miss', async (format) => {
    const name = `new-upload.${format}`;
    expect((await get('products', name)).status).toBe(404);
    const bytes = await sharp({ create: { width: 8, height: 8, channels: 3, background: '#abcdef' } })
      .toFormat(format).toBuffer();
    await writeFile(path.join(directory, 'uploads/products', name), bytes);
    const response = await get('products', name);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe(`image/${format}`);
    expect(Buffer.from(await response.arrayBuffer())).toEqual(bytes);
  });

  it.each([['..', 'secret.webp'], ['products', '../secret.webp'], ['products', '%2e%2e.webp'], ['products', 'bad\\name.webp'], ['.env'], ['products', 'active.html'], ['products', 'active.svg']])('rejects unsafe paths and non-raster files: %j', async (...segments) => {
    expect((await get(...segments)).status).toBe(404);
  });

  it('rejects symlinks outside the uploads root and directories with image extensions', async () => {
    await writeFile(path.join(directory, 'secret.webp'), 'private');
    await symlink(path.join(directory, 'secret.webp'), path.join(directory, 'uploads/products/link.webp'));
    await symlink(directory, path.join(directory, 'uploads/escape'));
    await mkdir(path.join(directory, 'uploads/products/folder.webp'));
    expect((await get('products', 'link.webp')).status).toBe(404);
    expect((await get('escape', 'secret.webp')).status).toBe(404);
    expect((await get('products', 'folder.webp')).status).toBe(404);
  });
});
