import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { mkdtemp, mkdir, writeFile, readFile, rm, symlink, lstat } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import sharp from 'sharp';

// Observe destructive calls while still exercising the real temporary filesystem.
vi.mock('node:fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs/promises')>();
  return { ...actual, rm: vi.fn(actual.rm) };
});

let fixture: string;
let root: string;
let deleteBlobByUrl: typeof import('../blob').deleteBlobByUrl;
beforeEach(async () => {
  fixture = await mkdtemp(path.join(os.tmpdir(), 'apfel-containment-'));
  root = path.join(fixture, 'uploads');
  await mkdir(path.join(root, 'products'), { recursive: true });
  vi.stubEnv('UPLOADS_DIR', root);
  vi.resetModules();
  ({ deleteBlobByUrl } = await import('../blob'));
});
afterEach(async () => {
  vi.unstubAllEnvs();
  await rm(fixture, { recursive: true, force: true });
});

it.each([
  '/uploads/../outside.txt', '/uploads/products/../../outside.txt',
  '/uploads/products/../victim.txt', '/uploads/products/./victim.txt',
  '/uploads/%2e%2e/outside.txt', '/uploads/%252e%252e/outside.txt',
  '/uploads/products%2fvictim.txt', '/uploads/products\\victim.txt',
  '/uploads//products/victim.txt', '/uploads/products/victim.txt?x=1',
])('does not delete for malformed path %s', async (url) => {
  await writeFile(path.join(fixture, 'outside.txt'), 'outside');
  await writeFile(path.join(root, 'victim.txt'), 'root');
  await writeFile(path.join(root, 'products/victim.txt'), 'product');
  vi.clearAllMocks();
  await deleteBlobByUrl(url);
  expect(rm).not.toHaveBeenCalled();
  expect(await readFile(path.join(fixture, 'outside.txt'), 'utf8')).toBe('outside');
  expect(await readFile(path.join(root, 'victim.txt'), 'utf8')).toBe('root');
  expect(await readFile(path.join(root, 'products/victim.txt'), 'utf8')).toBe('product');
});

it('cleans an image family even when the requested member is already absent', async () => {
  await writeFile(path.join(root, 'products/1700-phone--thumb.webp'), 'thumb');
  await deleteBlobByUrl('/uploads/products/1700-phone--original.jpg');
  await expect(lstat(path.join(root, 'products/1700-phone--thumb.webp'))).rejects.toThrow();
});

it('deletes only exact known image family members, preserving prefix neighbours and symlinks', async () => {
  const members = ['1700-phone--original.jpg', '1700-phone--thumb.webp', '1700-phone--card.webp', '1700-phone--detail.webp'];
  const neighbours = ['1700-phone--notes.txt', '1700-phone--other--thumb.webp', '1700-phone--original.txt', '1700-phone2--thumb.webp'];
  for (const name of [...members, ...neighbours]) await writeFile(path.join(root, 'products', name), name);
  await symlink(path.join(fixture, 'absent'), path.join(root, 'products/1700-phone--original.png'));
  await deleteBlobByUrl('/uploads/products/1700-phone--card.webp');
  for (const name of members) await expect(lstat(path.join(root, 'products', name))).rejects.toThrow();
  for (const name of neighbours) expect(await readFile(path.join(root, 'products', name), 'utf8')).toBe(name);
  expect((await lstat(path.join(root, 'products/1700-phone--original.png'))).isSymbolicLink()).toBe(true);
});

it.each(['original', 'thumb', 'card', 'detail'] as const)(
  'removes the extensionless upload family via its %s URL without deleting neighbours',
  async (member) => {
    const { uploadProductImage } = await import('../blob');
    const png = await sharp({
      create: { width: 2, height: 2, channels: 4, background: '#ff0000' },
    }).png().toBuffer();
    const result = await uploadProductImage(new File([new Uint8Array(png)], 'photo', { type: 'image/png' }));
    expect(result.originalUrl).toMatch(/--original\.bin$/);
    const urls = [result.originalUrl, ...Object.values(result.variants).map((variant) => variant.url)];
    expect(new Set(urls).size).toBe(4);
    const filePath = (url: string) => path.join(root, url.slice('/uploads/'.length));
    for (const url of urls) expect((await lstat(filePath(url))).isFile()).toBe(true);
    expect(await readFile(filePath(result.originalUrl))).toEqual(png);

    const stem = path.basename(result.originalUrl).replace(/--original\.bin$/, '');
    const neighbours = [
      `${stem}--original.txt`, `${stem}--original.bin.bak`, `${stem}--notes.bin`,
      `${stem}--thumb.bin`, `${stem}--other--original.bin`, `${stem}2--thumb.webp`,
    ];
    for (const name of neighbours) await writeFile(path.join(root, 'products', name), name);

    await deleteBlobByUrl(member === 'original' ? result.originalUrl : result.variants[member].url);

    for (const url of urls) await expect(lstat(filePath(url))).rejects.toMatchObject({ code: 'ENOENT' });
    for (const name of neighbours) expect(await readFile(path.join(root, 'products', name), 'utf8')).toBe(name);
  },
);

it('rejects symlink directories and symlink files without unlinking them', async () => {
  const outside = path.join(fixture, 'outside');
  await mkdir(outside);
  await writeFile(path.join(outside, 'victim.txt'), 'outside');
  await symlink(outside, path.join(root, 'linked'));
  await symlink(path.join(outside, 'victim.txt'), path.join(root, 'products/link.txt'));
  vi.clearAllMocks();
  await deleteBlobByUrl('/uploads/linked/victim.txt');
  await deleteBlobByUrl('/uploads/products/link.txt');
  expect(rm).not.toHaveBeenCalled();
  expect(await readFile(path.join(outside, 'victim.txt'), 'utf8')).toBe('outside');
  expect((await lstat(path.join(root, 'products/link.txt'))).isSymbolicLink()).toBe(true);
});
