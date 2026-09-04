import { lstat, realpath, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { isSecureSvg } from "./security";

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
  await mkdir(/*turbopackIgnore: true*/ dirPath, { recursive: true });
};

const sanitizeFileName = (fileName: string): string => {
  const normalized = fileName.toLowerCase().replace(/[^a-z0-9.-]/g, "-");
  return normalized.replace(/-+/g, "-");
};

const buildPublicUrl = (segments: string[]): string => `/${segments.join("/")}`;

export const resolveUploadPath = (urlPath: string): string | null => {
  if (!urlPath.startsWith("/uploads/")) return null;
  const relativePath = urlPath.replace(/^\/uploads\//, "");
  const resolved = path.resolve(/*turbopackIgnore: true*/ uploadsRoot, relativePath);
  const root = path.resolve(/*turbopackIgnore: true*/ uploadsRoot);
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) return null;
  return resolved;
};

const writeUpload = async (
  directory: string,
  fileName: string,
  content: ArrayBuffer | Uint8Array,
): Promise<string> => {
  const targetDir = path.join(/*turbopackIgnore: true*/ uploadsRoot, directory);
  await ensureDir(targetDir);
  const targetPath = path.join(/*turbopackIgnore: true*/ targetDir, fileName);
  const buffer = content instanceof Uint8Array ? content : Buffer.from(content);
  await writeFile(/*turbopackIgnore: true*/ targetPath, buffer);
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
  const targetDir = path.join(/*turbopackIgnore: true*/ uploadsRoot, directory);
  await ensureDir(targetDir);
  const targetPath = path.join(/*turbopackIgnore: true*/ targetDir, fileName);

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

  await writeFile(/*turbopackIgnore: true*/ targetPath, optimizedBuffer);

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
  let buffer = Buffer.from(await file.arrayBuffer());
  const declaredSvg = file.type === "image/svg+xml" || ext === ".svg";
  if ((declaredSvg || buffer.toString("utf8", 0, 256).trimStart().startsWith("<")) && !isSecureSvg(buffer.toString("utf8"))) {
    throw new Error("Unsafe SVG content detected");
  }
  const metadata = await sharp(buffer, { failOn: "warning", limitInputPixels: 25_000_000 }).metadata();
  const svg = declaredSvg || metadata.format === "svg";
  if (svg) {
    if (!isSecureSvg(buffer.toString("utf8"))) throw new Error("Unsafe SVG content detected");
    // Never publish active XML, including the original, even with a spoofed MIME.
    buffer = Buffer.from(await sharp(buffer, { failOn: "warning", limitInputPixels: 25_000_000 })
      .resize({ width: 1400, height: 1400, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 90 }).toBuffer());
  }
  const originalFileName = `${timePrefix}--original${svg ? ".webp" : ext || ".bin"}`;
  const originalUrl = await writeUpload("products", originalFileName, buffer);

  if (!svg && !rasterMimeTypes.has(file.type)) {
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
  const segments = url.slice("/uploads/".length).split("/");
  // Upload names are generated from this alphabet. Never URL-decode stored paths.
  if (segments.some((segment) => !/^[a-zA-Z0-9_-][a-zA-Z0-9._-]*$/.test(segment))) return;
  const root = await realpath(/*turbopackIgnore: true*/ uploadsRoot).catch(() => null);
  if (!root) return;
  let directory = root;
  for (const segment of segments.slice(0, -1)) {
    directory = path.join(/*turbopackIgnore: true*/ directory, segment);
    const stat = await lstat(/*turbopackIgnore: true*/ directory).catch(() => null);
    if (!stat?.isDirectory() || stat.isSymbolicLink()) return;
  }
  const fileName = segments[segments.length - 1];
  const targetPath = path.join(/*turbopackIgnore: true*/ directory, fileName);
  const targetStat = await lstat(/*turbopackIgnore: true*/ targetPath).catch(() => null);
  if (targetStat && (!targetStat.isFile() || targetStat.isSymbolicLink())) return;
  const canonicalDirectory = await realpath(/*turbopackIgnore: true*/ directory);
  if (canonicalDirectory !== root && !canonicalDirectory.startsWith(`${root}${path.sep}`)) return;
  const familyMatch = /^(.*)--(?:original\.(?:png|jpe?g|webp|svg|bin)|(?:thumb|card|detail)\.webp)$/.exec(fileName);
  const familyStem = familyMatch?.[1];

  if (!familyStem) {
    await rm(/*turbopackIgnore: true*/ targetPath, { force: true });
    return;
  }

  const suffixes = ["original.png", "original.jpg", "original.jpeg", "original.webp", "original.svg", "original.bin", "thumb.webp", "card.webp", "detail.webp"];
  const entries = await readdir(/*turbopackIgnore: true*/ directory).catch(() => []);
  for (const entry of entries) {
    if (!suffixes.some((suffix) => entry === `${familyStem}--${suffix}`)) continue;
    const candidate = path.join(/*turbopackIgnore: true*/ directory, entry);
    const stat = await lstat(/*turbopackIgnore: true*/ candidate).catch(() => null);
    if (!stat?.isFile() || stat.isSymbolicLink()) continue;
    await rm(/*turbopackIgnore: true*/ candidate, { force: true });
  }
};
