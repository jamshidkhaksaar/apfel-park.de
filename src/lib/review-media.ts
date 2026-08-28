import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const uploadsRoot = process.env.UPLOADS_DIR || "/srv/apfel-park/app/shared/uploads";
const privateRoot = process.env.REVIEW_MEDIA_PRIVATE_DIR || path.join(path.dirname(uploadsRoot), "private", "review-media");
const publicRoot = path.join(uploadsRoot, "reviews");
const publicPattern = /^\/uploads\/reviews\/([0-9a-f-]{36}\.webp)$/i;

export const isPendingReviewAsset = (value: string) => /^[0-9a-f-]{36}\.webp$/i.test(value);

export const storePendingReviewImage = async (file: File) => {
  const id = `${randomUUID()}.webp`;
  const output = await sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 24_000_000 })
    .rotate().resize(1600, 1600, { fit: "inside", withoutEnlargement: true }).webp({ quality: 86 }).toBuffer();
  await mkdir(privateRoot, { recursive: true, mode: 0o750 });
  await writeFile(path.join(privateRoot, id), output, { mode: 0o640 });
  return id;
};

export const readPendingReviewImage = (id: string) => {
  if (!isPendingReviewAsset(id)) throw new Error("invalid_asset");
  return readFile(path.join(privateRoot, id));
};

export const rollbackPromotedReviewMedia = async (moved: string[]) => {
  await mkdir(privateRoot, { recursive: true, mode: 0o750 });
  for (const id of [...moved].reverse()) await rename(path.join(publicRoot, id), path.join(privateRoot, id));
};

export const rollbackDemotedReviewMedia = async (moved: string[]) => {
  await mkdir(publicRoot, { recursive: true, mode: 0o755 });
  for (const id of [...moved].reverse()) await rename(path.join(privateRoot, id), path.join(publicRoot, id));
};

export const promoteReviewMedia = async (values: string[]): Promise<{ values: string[]; moved: string[] }> => {
  await mkdir(publicRoot, { recursive: true, mode: 0o755 });
  const next: string[] = [];
  const moved: string[] = [];
  try {
    for (const value of values) {
      const publicMatch = publicPattern.exec(value);
      if (publicMatch) { next.push(value); continue; }
      if (!isPendingReviewAsset(value)) continue;
      await rename(path.join(privateRoot, value), path.join(publicRoot, value));
      moved.push(value);
      next.push(`/uploads/reviews/${value}`);
    }
    return { values: next, moved };
  } catch (error) {
    await rollbackPromotedReviewMedia(moved).catch(() => undefined);
    throw error;
  }
};

export const demoteReviewMedia = async (values: string[]): Promise<{ values: string[]; moved: string[] }> => {
  await mkdir(privateRoot, { recursive: true, mode: 0o750 });
  const next: string[] = [];
  const moved: string[] = [];
  try {
    for (const value of values) {
      if (isPendingReviewAsset(value)) { next.push(value); continue; }
      const match = publicPattern.exec(value);
      if (!match) continue;
      const id = match[1];
      await rename(path.join(publicRoot, id), path.join(privateRoot, id));
      moved.push(id);
      next.push(id);
    }
    return { values: next, moved };
  } catch (error) {
    await rollbackDemotedReviewMedia(moved).catch(() => undefined);
    throw error;
  }
};

export const deleteReviewMedia = async (values: string[]) => {
  for (const value of values) {
    if (isPendingReviewAsset(value)) await rm(path.join(privateRoot, value), { force: true });
    else {
      const match = publicPattern.exec(value);
      if (match) await rm(path.join(publicRoot, match[1]), { force: true });
    }
  }
};
