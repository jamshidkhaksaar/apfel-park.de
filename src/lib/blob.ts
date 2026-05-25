import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const uploadsRoot = process.env.UPLOADS_DIR || "/srv/apfel-park/app/shared/uploads";
const rasterMimeTypes = new Set(["image/png", "image/jpeg", "image/webp"]);

type ProductImageVariantKey = "thumb" | "card" | "detail";

type ProductImageVariant = {
  url: string;
  width: number;
  height: number;
  format: "webp";
};

export type ProductImageUploadResult = {
  url: string;
  originalUrl: string;
  variants: Record<ProductImageVariantKey, ProductImageVariant>;
};

export type HeroMediaUploadResult = {
  url: string;
  originalFileName: string;
};

const ensureDir = async (dirPath: string) => {
  await mkdir(dirPath, { recursive: true });
};

const sanitizeFileName = (fileName: string): string => {
  const normalized = fileName.toLowerCase().replace(/[^a-z0-9.-]/g, "-");
  return normalized.replace(/-+/g, "-");
};

const buildPublicUrl = (segments: string[]): string => `/${segments.join("/")}`;

const writeUpload = async (
  directory: string,
  fileName: string,
  content: ArrayBuffer | Uint8Array,
): Promise<string> => {
  const targetDir = path.join(uploadsRoot, directory);
  await ensureDir(targetDir);
  const targetPath = path.join(targetDir, fileName);
  const buffer = content instanceof Uint8Array ? content : Buffer.from(content);
  await writeFile(targetPath, buffer);
  return buildPublicUrl(["uploads", directory, fileName]);
};

const splitName = (fileName: string) => {
  const parsed = path.parse(fileName);
  return {
    ext: parsed.ext.toLowerCase(),
    base: parsed.name || "product-image",
  };
};

const createRasterVariant = async (
  inputBuffer: Buffer,
  directory: string,
  baseStem: string,
  variant: ProductImageVariantKey,
  width: number,
) => {
  const fileName = `${baseStem}--${variant}.webp`;
  const targetDir = path.join(uploadsRoot, directory);
  await ensureDir(targetDir);
  const targetPath = path.join(targetDir, fileName);

  const transformer = sharp(inputBuffer, { failOn: "warning" }).rotate().resize({
    width,
    withoutEnlargement: true,
    fit: "inside",
  });

  const metadata = await transformer.metadata();
  const optimizedBuffer = await transformer.webp({
    quality: 84,
    effort: 6,
  }).toBuffer();

  await writeFile(targetPath, optimizedBuffer);

  return {
    url: buildPublicUrl(["uploads", directory, fileName]),
    width: metadata.width && metadata.width < width ? metadata.width : width,
    height: metadata.height ?? width,
    format: "webp" as const,
  };
};

export const uploadProductImage = async (file: File): Promise<ProductImageUploadResult> => {
  const safeFileName = sanitizeFileName(file.name || "product-image");
  const { ext, base } = splitName(safeFileName);
  const timePrefix = `${Date.now()}-${base}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const originalFileName = `${timePrefix}--original${ext || ".bin"}`;
  const originalUrl = await writeUpload("products", originalFileName, buffer);

  if (!rasterMimeTypes.has(file.type)) {
    const passthroughVariant = {
      url: originalUrl,
      width: 0,
      height: 0,
      format: "webp" as const,
    };

    return {
      url: originalUrl,
      originalUrl,
      variants: {
        thumb: passthroughVariant,
        card: passthroughVariant,
        detail: passthroughVariant,
      },
    };
  }

  const [thumb, card, detail] = await Promise.all([
    createRasterVariant(buffer, "products", timePrefix, "thumb", 320),
    createRasterVariant(buffer, "products", timePrefix, "card", 640),
    createRasterVariant(buffer, "products", timePrefix, "detail", 1400),
  ]);

  return {
    url: detail.url,
    originalUrl,
    variants: {
      thumb,
      card,
      detail,
    },
  };
};

export const uploadBrandingAsset = async (
  fileName: string,
  content: Uint8Array,
): Promise<string> => writeUpload("branding", fileName, content);

export const uploadHeroAsset = async (
  file: File,
  kind: "video" | "poster" | "mobile",
): Promise<HeroMediaUploadResult> => {
  const safeFileName = sanitizeFileName(file.name || `hero-${kind}`);
  const { ext, base } = splitName(safeFileName);
  const timePrefix = `${Date.now()}-${base}`;
  const fileName = `${timePrefix}--${kind}${ext || (kind === "video" ? ".mp4" : ".jpg")}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const url = await writeUpload("hero", fileName, buffer);

  return {
    url,
    originalFileName: fileName,
  };
};

export type RepairDeviceImageUploadResult = {
  url: string;
  thumbUrl: string;
};

export const uploadRepairDeviceImage = async (file: File): Promise<RepairDeviceImageUploadResult> => {
  const safeFileName = sanitizeFileName(file.name || "device");
  const { ext, base } = splitName(safeFileName);
  const timePrefix = `${Date.now()}-${base}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  if (!rasterMimeTypes.has(file.type)) {
    const url = await writeUpload("repairs", `${timePrefix}--original${ext || ".bin"}`, buffer);
    return { url, thumbUrl: url };
  }

  const [thumb, card] = await Promise.all([
    createRasterVariant(buffer, "repairs", timePrefix, "thumb", 320),
    createRasterVariant(buffer, "repairs", timePrefix, "card", 640),
  ]);

  return { url: card.url, thumbUrl: thumb.url };
};

export const uploadRepairBrandLogo = async (file: File): Promise<{ url: string }> => {
  const safeFileName = sanitizeFileName(file.name || "brand");
  const { base } = splitName(safeFileName);
  const timePrefix = `${Date.now()}-${base}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  if (!rasterMimeTypes.has(file.type)) {
    // SVG or other — store as-is
    const ext = safeFileName.includes(".") ? safeFileName.slice(safeFileName.lastIndexOf(".")) : ".bin";
    const url = await writeUpload("repairs/brands", `${timePrefix}${ext}`, buffer);
    return { url };
  }

  const logoBuffer = await sharp(buffer)
    .resize(256, 256, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 90 })
    .toBuffer();

  const url = await writeUpload("repairs/brands", `${timePrefix}--logo.webp`, logoBuffer);
  return { url };
};

export const deleteBlobByUrl = async (url: string): Promise<void> => {
  if (!url.startsWith("/uploads/")) return;
  const relativePath = url.replace(/^\/uploads\//, "");
  const targetPath = path.join(uploadsRoot, relativePath);
  const directory = path.dirname(targetPath);
  const fileName = path.basename(targetPath);
  const familyStem = fileName.replace(/--(?:original|thumb|card|detail)\.[^.]+$/i, "");

  if (!familyStem || familyStem === fileName) {
    await rm(targetPath, { force: true });
    return;
  }

  const entries = await readdir(directory).catch(() => []);
  await Promise.all(
    entries
      .filter((entry) => entry.startsWith(`${familyStem}--`))
      .map((entry) => rm(path.join(directory, entry), { force: true })),
  );
};
