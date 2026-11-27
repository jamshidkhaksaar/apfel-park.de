import { existsSync } from 'node:fs';
import { mkdir, realpath, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { inflateRawSync } from 'node:zlib';
import { EPREL_PRODUCT_GROUP, eprelAssetRoutes, type EprelAssetRoutes } from './eprel';

const EPREL_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36',
  Accept: '*/*',
  Referer: `https://eprel.ec.europa.eu/screen/product/${EPREL_PRODUCT_GROUP}`,
};

const SHARED_PARENT = '/srv/apfel-park/app/shared';

export const resolveEprelAssetsDir = (): string => {
  const configured = process.env.EPREL_ASSETS_DIR?.trim();
  if (configured) return configured;
  if (existsSync(/*turbopackIgnore: true*/ SHARED_PARENT)) {
    return path.join(/*turbopackIgnore: true*/ SHARED_PARENT, 'energy-labels');
  }
  return path.join(/*turbopackIgnore: true*/ process.cwd(), 'public', 'energy-labels');
};

export const resolveEprelReadDirs = (): string[] => {
  const dirs = [
    resolveEprelAssetsDir(),
    path.join(/*turbopackIgnore: true*/ process.cwd(), 'public', 'energy-labels'),
  ];
  return Array.from(new Set(dirs.map(dir => path.resolve(/*turbopackIgnore: true*/ dir))));
};

export const findEprelAssetFile = async (fileName: string): Promise<string | null> => {
  if (!/^[a-zA-Z0-9_-][a-zA-Z0-9._-]*$/.test(fileName)) return null;
  for (const dir of resolveEprelReadDirs()) {
    try {
      const root = await realpath(/*turbopackIgnore: true*/ dir);
      const target = await realpath(/*turbopackIgnore: true*/ path.join(/*turbopackIgnore: true*/ root, fileName));
      if (!target.startsWith(`${root}${path.sep}`)) continue;
      const info = await stat(/*turbopackIgnore: true*/ target);
      if (info.isFile() && info.size > 0) return target;
    } catch {
      // Check next directory.
    }
  }
  return null;
};

/** Parse ZIP Central Directory so Java/Spring streams with data descriptors decode cleanly. */
export const extractZipMember = (zipBuffer: Buffer, memberName: string): Buffer | null => {
  if (zipBuffer.length < 22) return null;
  const searchStart = Math.max(0, zipBuffer.length - 65558);
  let eocdOffset = -1;
  for (let i = zipBuffer.length - 22; i >= searchStart; i -= 1) {
    if (zipBuffer.readUInt32LE(i) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset < 0) return null;

  const totalEntries = zipBuffer.readUInt16LE(eocdOffset + 10);
  const cdOffset = zipBuffer.readUInt32LE(eocdOffset + 16);
  let cursor = cdOffset;
  const targetLower = memberName.toLowerCase();

  for (let i = 0; i < totalEntries && cursor + 46 <= zipBuffer.length; i += 1) {
    if (zipBuffer.readUInt32LE(cursor) !== 0x02014b50) break;
    const method = zipBuffer.readUInt16LE(cursor + 10);
    const compressedSize = zipBuffer.readUInt32LE(cursor + 20);
    const fileNameLen = zipBuffer.readUInt16LE(cursor + 28);
    const extraLen = zipBuffer.readUInt16LE(cursor + 30);
    const commentLen = zipBuffer.readUInt16LE(cursor + 32);
    const localHeaderOffset = zipBuffer.readUInt32LE(cursor + 42);
    const entryName = zipBuffer.subarray(cursor + 46, cursor + 46 + fileNameLen).toString('utf8');
    cursor += 46 + fileNameLen + extraLen + commentLen;

    const baseName = path.posix.basename(entryName).toLowerCase();
    if (entryName.toLowerCase() !== targetLower && baseName !== targetLower) continue;

    if (localHeaderOffset + 30 > zipBuffer.length || zipBuffer.readUInt32LE(localHeaderOffset) !== 0x04034b50) {
      return null;
    }
    const localNameLen = zipBuffer.readUInt16LE(localHeaderOffset + 26);
    const localExtraLen = zipBuffer.readUInt16LE(localHeaderOffset + 28);
    const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen;
    const dataEnd = dataStart + compressedSize;
    if (dataEnd > zipBuffer.length) return null;

    const compressed = zipBuffer.subarray(dataStart, dataEnd);
    if (method === 0) return Buffer.from(compressed);
    if (method === 8) return inflateRawSync(compressed);
    return null;
  }
  return null;
};

const fetchZipBuffer = async (url: string, signal?: AbortSignal): Promise<Buffer | null> => {
  try {
    const response = await fetch(url, {
      headers: EPREL_HEADERS,
      redirect: 'follow',
      signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(10_000)]) : AbortSignal.timeout(10_000),
    });
    if (!response.ok) return null;
    const bytes = Buffer.from(await response.arrayBuffer());
    return bytes.length > 0 && bytes.length <= 12 * 1024 * 1024 ? bytes : null;
  } catch {
    return null;
  }
};

/**
 * Ensures Label_<reg>.png and Fiche_<reg>_{DE,EN}.pdf exist locally by mirroring
 * official EPREL ZIP payloads when absent from static and shared directories.
 */
export const mirrorEprelRegistrationAssets = async (
  registrationNumber: string,
  signal?: AbortSignal,
): Promise<Partial<EprelAssetRoutes>> => {
  const routes = eprelAssetRoutes(registrationNumber);
  const labelName = `Label_${registrationNumber}.png`;
  const ficheDeName = `Fiche_${registrationNumber}_DE.pdf`;
  const ficheEnName = `Fiche_${registrationNumber}_EN.pdf`;

  const resolved: Partial<EprelAssetRoutes> = {};
  if (await findEprelAssetFile(labelName)) resolved.labelImage = routes.labelImage;
  if (await findEprelAssetFile(ficheDeName)) resolved.ficheDe = routes.ficheDe;
  if (await findEprelAssetFile(ficheEnName)) resolved.ficheEn = routes.ficheEn;

  if (resolved.labelImage && resolved.ficheDe && resolved.ficheEn) {
    return resolved;
  }

  const targetDir = resolveEprelAssetsDir();
  if (!resolved.labelImage) {
    const labelsZip = await fetchZipBuffer(
      `https://eprel.ec.europa.eu/api/products/${EPREL_PRODUCT_GROUP}/${encodeURIComponent(registrationNumber)}/labels`,
      signal,
    );
    if (labelsZip) {
      const png = extractZipMember(labelsZip, labelName);
      if (png && png.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
        await mkdir(/*turbopackIgnore: true*/ targetDir, { recursive: true });
        await writeFile(/*turbopackIgnore: true*/ path.join(/*turbopackIgnore: true*/ targetDir, labelName), png);
        resolved.labelImage = routes.labelImage;
      }
    }
  }

  if (!resolved.ficheDe || !resolved.ficheEn) {
    const fichesZip = await fetchZipBuffer(
      `https://eprel.ec.europa.eu/api/products/${EPREL_PRODUCT_GROUP}/${encodeURIComponent(registrationNumber)}/fiches`,
      signal,
    );
    if (fichesZip) {
      await mkdir(/*turbopackIgnore: true*/ targetDir, { recursive: true });
      if (!resolved.ficheDe) {
        const pdfDe = extractZipMember(fichesZip, ficheDeName);
        if (pdfDe && pdfDe.subarray(0, 4).toString('ascii') === '%PDF') {
          await writeFile(/*turbopackIgnore: true*/ path.join(/*turbopackIgnore: true*/ targetDir, ficheDeName), pdfDe);
          resolved.ficheDe = routes.ficheDe;
        }
      }
      if (!resolved.ficheEn) {
        const pdfEn = extractZipMember(fichesZip, ficheEnName);
        if (pdfEn && pdfEn.subarray(0, 4).toString('ascii') === '%PDF') {
          await writeFile(/*turbopackIgnore: true*/ path.join(/*turbopackIgnore: true*/ targetDir, ficheEnName), pdfEn);
          resolved.ficheEn = routes.ficheEn;
        }
      }
    }
  }

  return resolved;
};
