#!/usr/bin/env node
// Downloads official Google Pixel 11 / Pixel 11 Pro Fold marketing assets
// (product renders from the Google Store image CDN and official product films
// from Google's mannequin video CDN) and rehosts them under public/.
//
//   node scripts/fetch-google-pixel-assets.mjs [--force]

import { mkdir, writeFile, access } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const IMG_DIR = path.join(ROOT, "public", "images", "google", "pixel11", "official");
const VID_DIR = path.join(ROOT, "public", "images", "google", "pixel11", "videos");
const FORCE = process.argv.includes("--force");

const LH3 = "https://lh3.googleusercontent.com";
const GC = "https://storage.googleapis.com/mannequin/blobs";

// Official Pixel 11 product renders (back + lifestyle per finish) plus shared details.
const IMAGES = [
  ["pixel11-frost-back", "-rNwCgNL31Qy9wdOLGEY4EFC6saOXr484sZJ-vawV4yqdy_cx2QUBpHo0acdJOqXlA04VJ7WJh-TQC0Gj6nB6dfzI6ADTxMJhA"],
  ["pixel11-hibiscus-back", "4bzRa_Ocxz_KEYDYssz2aemg5RJ6pJd0fRL-QGT-Hh0eDzl4W4ypX6sHyRQWOCqo_uq_iJViaYTrh7YghuX_rksnfXuTMy29Us0"],
  ["pixel11-pistachio-back", "qleB_N3bI1Cjer4jrFbwc9Q5gJv6eWZj5WvYrqEAt05zYSNUDtZanJOyUkpjWzvyYMK-H5bj19e5kr2x0wCMfhUcQJ-rbIP-AII"],
  ["pixel11-obsidian-back", "oAswswQLJ-27j8fjMpirpuIuTfGvyDTzv7H0hmd5QiAkk3__9TGUU1rjn2-_jpyhhmzJsvL0W2Y-6RnJWGljIUIXodMQXv45OWkJ"],
  ["pixel11-frost-person", "2M8zi_4uHV65eLldy_tT2CVvMSxMUDopPTx2A9IYW6bJdUgg_0WpNtbaZe-QsJpaw6iPqv789MEukIyMYbYb5He6nSg5YbKBvnc"],
  ["pixel11-hibiscus-person", "zUFC_Ta9pAH2Hwv4ME1ciJ6fAOuZi2NGn-1Z4CmrWXm8QZVkiBcinDY_uMojZy8wcyamH20PRCboYsV8mNvbOWUsi10qOob3mys"],
  ["pixel11-pistachio-person", "yZ4zn__LTZvpNYMJTlEQusBhDvXqoqNezjkr44-rwKFS_lx9cpX2BMSnPPPD8VwufhlnmIrUZRHrUb1ZvxulsSxI5t92qRPulh4"],
  ["pixel11-obsidian-person", "IpZopejCFxqJq8Y64ls_wEizW6SWiKp3yoJnkPh2VvVT_aPxIwyxber6qLb3mxXbXpo9KYObk7vBmVJNKuuFx-qKYqtRUUl7DV4"],
  ["pixel11-display", "z7pJxoc0ygatouQLnmgInOrOBSS-ys4wYuCAEfQrM6oSIVujA70vIISJIyc6XAHQizwBnmOTN7oJOqAuy5rDYBbER4x5L7ujxCI"],
  ["pixel11-camera", "SG3Y21BmqLcu5KLmxoCRX8eQnzUAZFzK_X89IQxoSGlGZyBLl_mZ6G0bIC_zwR337aY_CpIzRVf0jIFMCB-5Cl2OrtWQabt65x4"],
  ["pixel11-duo", "KA86CCMWpqDNDWOhTCjUvzAU1bAMvoD5u_HSZp-6eGi4B3TbH6Gh6zDAgi-5ziBBKOJJ7rYIhgO2JOKhPypErL84zyv-l3lYgqI"],
  ["fold-olive-open", "Xh6cISTorb5eBgVy5NIAtfdvvX-jh1rvQYwOazsGF88t5Un8n3BPgsjoNJNSYTh0UuQxT9pW3oUle6VXTrEizbB2MuM6olZTyCY5"],
  ["fold-olive-edge", "S8YgKKrQ5NgZY-d9YHb4J4I1fXxfovCwmjDwlcwjY5eAoLaJOMGrabBOAv_LhKFUiLzzb0X538l5q4OhmQ9Ya4PHPdFC9ThKfjo"],
  ["fold-olive-back", "gK1n_Z1la-OycknMFvg1snzEx0ZMgENdUh6LzRAoMyjA3M3aEnEUu_AFEGIZgx2WbCyzC9Ip9j0rCHA8K3rYDNBv1uExQqvUzA"],
  ["fold-obsidian-open", "I8m_saqyFUDEmh_omURJFbfdofU25wuOkgriA7E2VHcjmpts0whgAFCw4AaxvvVLlZRA4I-DHsHoBUt2kGEBwP4RDIs0g7-g9w"],
  ["fold-obsidian-back", "D725VJikknf9eus3uh30sFlxbYNwNl3_34cJFo-Awsr03ov9zYbdwV9F87A3w9DsmMsIbEF9cY8hBWxVDAr9jkpaFhnhvD1hcbs"],
  ["fold-side", "l7m6pC-VAJPQftMzGnMkbNk0L7i4YbYY0e3SBxbLy0dGfwEHNjIHUJQStMdN5Px2mhVpAEeKPb78YLCsDqSE90kIOXrd3K6gdDLD"],
];

// Official product films (6s loops) from Google's CDN.
const VIDEOS = [
  ["pixel11-hero", "b5887dc3-1e88-4fc6-ba44-0085584db616.mp4"],
  ["pixel11-colors", "f2f5f6e7-0aa9-4afd-b43e-21a95a39356d.mp4"],
  ["pixel11-gemini", "1c88baa7-6169-4f4a-b557-43b468b0b3cf.mp4"],
  ["fold-hero", "d88335bb-311f-45c2-b29d-c3bb9c868e52.mp4"],
  ["fold-colors", "992707b0-89a2-428e-be40-20c37c8f6cc4.mp4"],
];

async function exists(file) {
  try { await access(file, constants.F_OK); return true; } catch { return false; }
}

async function download(url, dest, extFallback) {
  if (!FORCE && (await exists(dest))) return { skipped: true, dest };
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; ApfelParkAssetFetcher/1.0)" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  let finalDest = dest;
  if (extFallback === "jpg") {
    const type = res.headers.get("content-type") || "";
    const ext = type.includes("webp") ? "webp" : type.includes("png") ? "png" : "jpg";
    finalDest = dest.replace(/\.[a-z]+$/i, `.${ext}`);
  }
  await mkdir(path.dirname(finalDest), { recursive: true });
  await writeFile(finalDest, buf);
  return { bytes: buf.length, dest: finalDest };
}

const map = {};
for (const [name, id] of IMAGES) {
  const result = await download(`${LH3}/${id}=w2000`, path.join(IMG_DIR, `${name}.jpg`), "jpg");
  map[name] = path.basename(result.dest);
  console.log(`[assets] ${result.skipped ? "skip" : "  + "} official/${result.dest.split("/").pop()}${result.bytes ? ` (${(result.bytes / 1024).toFixed(0)} KB)` : ""}`);
}
for (const [name, file] of VIDEOS) {
  const result = await download(`${GC}/${file}`, path.join(VID_DIR, `${name}.mp4`), "mp4");
  map[name] = path.basename(result.dest);
  console.log(`[assets] ${result.skipped ? "skip" : "  + "} videos/${result.dest.split("/").pop()}${result.bytes ? ` (${(result.bytes / 1024).toFixed(0)} KB)` : ""}`);
}
console.log("\n[assets] image filename map:");
console.log(JSON.stringify(map, null, 2));
