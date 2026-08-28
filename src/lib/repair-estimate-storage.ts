import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const privateRoot = path.resolve(
  /*turbopackIgnore: true*/ process.env.PRIVATE_STORAGE_DIR || '/srv/apfel-park/app/shared/private',
);

const resolvePrivatePath = (relativePath: string): string => {
  const normalized = relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
  const resolved = path.resolve(/*turbopackIgnore: true*/ privateRoot, normalized);
  if (resolved !== privateRoot && !resolved.startsWith(`${privateRoot}${path.sep}`)) {
    throw new Error('Invalid private storage path');
  }
  return resolved;
};

export const writeEstimatePdf = async (
  estimateId: string,
  revision: number,
  content: Uint8Array,
  documentKey = `revision-${revision}`,
): Promise<string> => {
  const safeKey = documentKey.replace(/[^a-zA-Z0-9-]/g, '');
  const relativePath = path.posix.join('repair-estimates', estimateId, `${safeKey}.pdf`);
  const targetPath = resolvePrivatePath(relativePath);
  await mkdir(/*turbopackIgnore: true*/ path.dirname(targetPath), { recursive: true, mode: 0o700 });
  await writeFile(/*turbopackIgnore: true*/ targetPath, content, { mode: 0o600 });
  return relativePath;
};

export const readEstimatePdf = async (relativePath: string): Promise<Buffer> =>
  readFile(/*turbopackIgnore: true*/ resolvePrivatePath(relativePath));

export const removeEstimatePdf = async (relativePath: string): Promise<void> => {
  await rm(/*turbopackIgnore: true*/ resolvePrivatePath(relativePath), { force: true });
};
