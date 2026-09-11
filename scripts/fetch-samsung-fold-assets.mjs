#!/usr/bin/env node
// Downloads the official Samsung Galaxy Z Fold8 / Z Fold8 Ultra 3D viewer
// assets (GLB models, HDR environment maps, per-color emissive screen maps and
// per-color loader posters) plus the Draco decoder that ships with three.
//
// The deployed site self-hosts these files from public/, so this only needs to
// run when refreshing the assets. Existing files are skipped unless --force.
//
//   node scripts/fetch-samsung-fold-assets.mjs [--force]

import { mkdir, writeFile, access, copyFile } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEST = path.join(ROOT, "public", "images", "samsung", "zfold8", "viewer");
const DRACO_SRC = path.join(ROOT, "node_modules", "three", "examples", "jsm", "libs", "draco", "gltf");

const CDN = "https://images.samsung.com/common/smartphones/compare/galaxy-z-fold8-flip8/viewer/models";
const DE = "https://images.samsung.com/de/smartphones/galaxy-z-fold8";
const DE_ULTRA = "https://images.samsung.com/de/smartphones/galaxy-z-fold8-ultra";

const FORCE = process.argv.includes("--force");

const FOLD8_COLORS = ["graphite", "cream", "lavender", "pistachio"];
const ULTRA_COLORS = ["graphite", "cream", "violet-shadow", "green-shadow"];

const HDRS = [
  "env-map-camera-display-z8",
  "env-logo-fold8",
  "env-metal-fold8",
  "env-hinge-fold8",
  "env-panel-fold8",
  "env-camera-fold8",
  "env-logo-fold8-ultra",
  "env-metal-fold8-ultra",
  "env-hinge-fold8-ultra",
  "env-panel-fold8-ultra",
  "env-camera-fold8-ultra",
];

const MODELS = [
  { dir: "galaxy-z-fold8", url: `${CDN}/galaxy-z-fold8/galaxy-z-fold8-cp.glb` },
  { dir: "galaxy-z-fold8-ultra", url: `${CDN}/galaxy-z-fold8-ultra/galaxy-z-fold8-ultra-cp.glb` },
];

// Official viewer material configs (per-finish colors, env maps, screen maps).
const VIEWER_CONFIGS = [
  {
    url: "https://www.samsung.com/samsung/resources/global/galaxy-z-fold8/common/viewer/product/galaxy-z-fold8.json",
    name: "galaxy-z-fold8.json",
  },
  {
    url: "https://www.samsung.com/samsung/resources/global/galaxy-z-fold8-ultra/common/viewer/product/galaxy-z-fold8-ultra.json",
    name: "galaxy-z-fold8-ultra.json",
  },
];

const files = [
  ...VIEWER_CONFIGS.map(({ url, name }) => ({ url, dest: path.join(DEST, "config", name) })),
];

for (const { dir, url } of MODELS) files.push({ url, dest: path.join(DEST, "models", `${dir}.glb`) });
for (const hdr of HDRS) files.push({ url: `${CDN}/hdr/${hdr}.hdr`, dest: path.join(DEST, "textures", "hdr", `${hdr}.hdr`) });

for (const color of FOLD8_COLORS) {
  for (const side of ["main", "front"]) {
    files.push({
      url: `${CDN}/galaxy-z-fold8/galaxy-z-fold8-${side}-${color}.jpg`,
      dest: path.join(DEST, "textures", "galaxy-z-fold8", `${side}-${color}.jpg`),
    });
  }
}
for (const color of ULTRA_COLORS) {
  for (const side of ["main", "front"]) {
    files.push({
      url: `${CDN}/galaxy-z-fold8-ultra/galaxy-z-fold8-ultra-${side}-${color}.jpg`,
      dest: path.join(DEST, "textures", "galaxy-z-fold8-ultra", `${side}-${color}.jpg`),
    });
  }
}

for (const color of FOLD8_COLORS) {
  files.push({
    url: `${DE}/images/galaxy-z-fold8-features-colors-viewer-initial-${color}.jpg`,
    dest: path.join(DEST, "posters", "galaxy-z-fold8", `${color}.jpg`),
  });
}
for (const color of ULTRA_COLORS) {
  files.push({
    url: `${DE_ULTRA}/images/galaxy-z-fold8-ultra-features-colors-viewer-initial-${color}.jpg`,
    dest: path.join(DEST, "posters", "galaxy-z-fold8-ultra", `${color}.jpg`),
  });
}

const DRACO_FILES = ["draco_decoder.js", "draco_decoder.wasm", "draco_wasm_wrapper.js"];

async function exists(file) {
  try {
    await access(file, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function download({ url, dest }) {
  if (!FORCE && (await exists(dest))) {
    return { url, dest, skipped: true };
  }
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; ApfelParkAssetFetcher/1.0)" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await mkdir(path.dirname(dest), { recursive: true });
  await writeFile(dest, buf);
  return { url, dest, bytes: buf.length };
}

console.log(`[assets] destination: ${path.relative(ROOT, DEST)}`);
let downloaded = 0;
let skipped = 0;

for (const file of files) {
  const result = await download(file);
  if (result.skipped) {
    skipped += 1;
    continue;
  }
  downloaded += 1;
  console.log(`[assets]   + ${path.relative(DEST, result.dest)} (${(result.bytes / 1024).toFixed(0)} KB)`);
}

// Draco decoder: three ships it; copy into public so CSP stays 'self'.
const dracoDest = path.join(DEST, "draco");
await mkdir(dracoDest, { recursive: true });
for (const name of DRACO_FILES) {
  const src = path.join(DRACO_SRC, name);
  if (!(await exists(src))) {
    // Some three versions only expose draco_decoder.js/.wasm, not the wrapper.
    console.warn(`[assets]   ! missing in three: ${name}`);
    continue;
  }
  await copyFile(src, path.join(dracoDest, name));
  console.log(`[assets]   + draco/${name}`);
}

console.log(`[assets] done: ${downloaded} downloaded, ${skipped} skipped`);
