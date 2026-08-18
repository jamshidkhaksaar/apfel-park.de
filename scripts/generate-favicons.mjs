import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const projectRoot = process.cwd();
const source = path.join(projectRoot, "public", "branding", "apfel-park-icon.png");
const appDir = path.join(projectRoot, "src", "app");
const publicDir = path.join(projectRoot, "public");

const sourceMetadata = await sharp(source).metadata();
if (!sourceMetadata.width || !sourceMetadata.height) {
  throw new Error("Unable to read the Apfel Park icon dimensions.");
}

// The generated brand master deliberately has generous presentation space.
// Favicons need a tighter optical crop so the gold mark remains recognizable
// at 16 px while retaining enough room for Google/Apple circular masks.
const cropSize = Math.floor(Math.min(sourceMetadata.width, sourceMetadata.height) * 0.834);
const cropLeft = Math.floor((sourceMetadata.width - cropSize) / 2);
const cropTop = Math.floor((sourceMetadata.height - cropSize) * 0.34);

const pngAt = (size) =>
  sharp(source)
    .extract({ left: cropLeft, top: cropTop, width: cropSize, height: cropSize })
    .resize(size, size, { fit: "cover", position: "centre" })
    .ensureAlpha(1)
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();

const buildIco = async (sizes) => {
  const images = await Promise.all(sizes.map((size) => pngAt(size)));
  const headerSize = 6 + images.length * 16;
  const header = Buffer.alloc(headerSize);

  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  let offset = headerSize;
  images.forEach((image, index) => {
    const size = sizes[index];
    const entryOffset = 6 + index * 16;
    header.writeUInt8(size === 256 ? 0 : size, entryOffset);
    header.writeUInt8(size === 256 ? 0 : size, entryOffset + 1);
    header.writeUInt8(0, entryOffset + 2);
    header.writeUInt8(0, entryOffset + 3);
    header.writeUInt16LE(1, entryOffset + 4);
    header.writeUInt16LE(32, entryOffset + 6);
    header.writeUInt32LE(image.length, entryOffset + 8);
    header.writeUInt32LE(offset, entryOffset + 12);
    offset += image.length;
  });

  return Buffer.concat([header, ...images]);
};

await mkdir(appDir, { recursive: true });

const [icon512, icon192, appleTouch, favicon] = await Promise.all([
  pngAt(512),
  pngAt(192),
  pngAt(180),
  buildIco([16, 32, 48]),
]);

await Promise.all([
  writeFile(path.join(appDir, "icon.png"), icon512),
  writeFile(path.join(appDir, "apple-icon.png"), appleTouch),
  writeFile(path.join(appDir, "favicon.ico"), favicon),
  writeFile(path.join(publicDir, "favicon.ico"), favicon),
  writeFile(path.join(publicDir, "icon-192.png"), icon192),
  writeFile(path.join(publicDir, "icon-512.png"), icon512),
]);

console.log("Generated favicon.ico (16/32/48), icon.png (512), apple-icon.png (180), and public PNG variants.");
