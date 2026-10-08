import { lstat, readdir, realpath, stat } from 'node:fs/promises';
import path from 'node:path';

const publicFolders = new Set(['products', 'branding', 'hero']);
const imageExtension = /\.(webp|png|jpe?g|avif|gif)$/i;
const safeSegment = /^[a-zA-Z0-9_-][a-zA-Z0-9._-]*$/;
export class GalleryPathError extends Error {}

export type GalleryImage = { name: string; url: string; thumbnail: string; size: number; updatedAt: string };
export type UploadGallery = { folder: string; folders: { name: string; path: string }[]; images: GalleryImage[]; page: number; pages: number; total: number };

export const listUploadedImages = async (folder = 'products', search = '', requestedPage = 1): Promise<UploadGallery> => {
  const segments = folder ? folder.split('/') : [];
  if (segments.some(segment => !safeSegment.test(segment)) || segments.length > 12 || (segments.length && !publicFolders.has(segments[0]))) {
    throw new GalleryPathError('Invalid gallery folder');
  }
  const root = await realpath(/*turbopackIgnore: true*/ process.env.UPLOADS_DIR || '/srv/apfel-park/app/shared/uploads');
  for (let index = 1; index <= segments.length; index++) {
    const info = await lstat(/*turbopackIgnore: true*/ path.join(root, ...segments.slice(0, index)));
    if (info.isSymbolicLink()) throw new GalleryPathError('Invalid gallery folder');
  }
  const directory = await realpath(/*turbopackIgnore: true*/ path.join(root, ...segments));
  if (directory !== root && !directory.startsWith(`${root}${path.sep}`)) throw new GalleryPathError('Invalid gallery folder');
  const entries = await readdir(/*turbopackIgnore: true*/ directory, { withFileTypes: true });
  const folders = entries.filter(entry => entry.isDirectory() && safeSegment.test(entry.name) && (segments.length || publicFolders.has(entry.name)))
    .map(entry => ({ name: entry.name, path: [...segments, entry.name].join('/') })).sort((a, b) => a.name.localeCompare(b.name));
  const files = entries.filter(entry => entry.isFile() && safeSegment.test(entry.name) && imageExtension.test(entry.name));
  const names = new Set(files.map(entry => entry.name));
  // Show each upload once, selecting its display version rather than three sizes.
  const query = search.trim().slice(0, 100).toLowerCase();
  const visible = files.filter(entry => {
    const stem = entry.name.replace(/--(original|thumb|card)\.[^.]+$/i, '');
    return entry.name.toLowerCase().includes(query) && (stem === entry.name || !names.has(`${stem}--detail.webp`));
  }).sort((a, b) => b.name.localeCompare(a.name, 'en', { numeric: true }));
  const pages = Math.max(1, Math.ceil(visible.length / 48));
  const page = Math.min(pages, Math.max(1, Number.isSafeInteger(requestedPage) ? requestedPage : 1));
  const images = await Promise.all(visible.slice((page - 1) * 48, page * 48).map(async entry => {
    const info = await stat(/*turbopackIgnore: true*/ path.join(directory, entry.name));
    const thumbnail = entry.name.replace(/--detail\.webp$/i, '--thumb.webp');
    const url = (name: string) => `/uploads/${[...segments, name].map(encodeURIComponent).join('/')}`;
    return { name: entry.name, url: url(entry.name), thumbnail: url(names.has(thumbnail) ? thumbnail : entry.name), size: info.size, updatedAt: info.mtime.toISOString() };
  }));
  return { folder, folders, images, page, pages, total: visible.length };
};
