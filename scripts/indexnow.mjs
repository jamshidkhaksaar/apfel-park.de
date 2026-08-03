#!/usr/bin/env node
/**
 * IndexNow submitter — tells Bing, Yandex, Seznam and Naver that URLs changed.
 *
 * The verification key file has been sitting in public/ since July, correctly
 * served, but nothing ever submitted anything to it. This closes that gap.
 *
 *   node scripts/indexnow.mjs                  submit every sitemap URL (skips if unchanged)
 *   node scripts/indexnow.mjs --force          submit even if the sitemap is unchanged
 *   node scripts/indexnow.mjs --dry-run        show what would be sent, send nothing
 *   node scripts/indexnow.mjs <url> [url...]   submit specific URLs only
 *
 * api.indexnow.org fans out to every participating engine, so one POST covers
 * all of them. Google does not participate — it has its own crawl scheduling.
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const HOST = process.env.INDEXNOW_HOST ?? "apfel-park.de";
const ORIGIN = `https://${HOST}`;
const ENDPOINT = "https://api.indexnow.org/indexnow";
const STATE = process.env.INDEXNOW_STATE ?? join(ROOT, ".indexnow-state.json");
const MAX_URLS = 10000; // IndexNow per-request limit

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const force = args.includes("--force");
const explicitUrls = args.filter((a) => a.startsWith("http"));

/** The key is the filename of the 32-hex .txt file in public/. */
const findKey = () => {
  const match = readdirSync(join(ROOT, "public")).find((f) => /^[0-9a-f]{32}\.txt$/.test(f));
  if (!match) throw new Error("no IndexNow key file (32-hex .txt) found in public/");
  const key = match.replace(/\.txt$/, "");
  const contents = readFileSync(join(ROOT, "public", match), "utf8").trim();
  if (contents !== key) {
    throw new Error(`key file contents (${contents}) must equal its filename (${key})`);
  }
  return key;
};

const sitemapUrls = async () => {
  const res = await fetch(`${ORIGIN}/sitemap.xml`);
  if (!res.ok) throw new Error(`sitemap.xml returned ${res.status}`);
  const xml = await res.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((m) => m[1].trim())
    .filter((u) => u.startsWith(ORIGIN));
};

const key = findKey();
const urls = explicitUrls.length ? explicitUrls : [...new Set(await sitemapUrls())];

if (urls.length === 0) {
  console.error("no URLs to submit");
  process.exit(1);
}
if (urls.length > MAX_URLS) {
  console.error(`${urls.length} URLs exceeds the ${MAX_URLS} per-request limit`);
  process.exit(1);
}

// Resubmitting an unchanged sitemap on every deploy is pointless noise, so
// fingerprint it and skip when nothing moved.
const fingerprint = createHash("sha256").update(urls.slice().sort().join("\n")).digest("hex");
if (!explicitUrls.length && !force && existsSync(STATE)) {
  try {
    const previous = JSON.parse(readFileSync(STATE, "utf8"));
    if (previous.fingerprint === fingerprint) {
      console.log(`unchanged since ${previous.submittedAt} (${urls.length} URLs) — skipping`);
      console.log("use --force to submit anyway");
      process.exit(0);
    }
  } catch {
    // Unreadable state file is not a reason to skip submitting.
  }
}

const payload = {
  host: HOST,
  key,
  keyLocation: `${ORIGIN}/${key}.txt`,
  urlList: urls,
};

console.log(`IndexNow: ${urls.length} URLs, key ${key.slice(0, 8)}…`);
if (dryRun) {
  console.log("--dry-run, nothing sent. First 5:");
  for (const u of urls.slice(0, 5)) console.log("  " + u);
  process.exit(0);
}

const res = await fetch(ENDPOINT, {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify(payload),
});
const body = await res.text().catch(() => "");

// 200 accepted, 202 accepted pending key validation — both are success.
if (res.status === 200 || res.status === 202) {
  console.log(`submitted OK (HTTP ${res.status})`);
  if (!explicitUrls.length) {
    writeFileSync(STATE, JSON.stringify({ fingerprint, count: urls.length, submittedAt: new Date().toISOString() }, null, 2));
  }
  process.exit(0);
}

const reasons = {
  400: "bad request — malformed payload",
  403: "key not valid — check the key file is reachable at keyLocation",
  422: "URLs do not belong to the host, or the key does not match",
  429: "rate limited — too many submissions",
};
console.error(`FAILED: HTTP ${res.status} ${reasons[res.status] ?? ""}`);
if (body) console.error(body.slice(0, 400));
process.exit(1);
