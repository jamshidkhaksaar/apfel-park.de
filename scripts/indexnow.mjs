#!/usr/bin/env node
/**
 * IndexNow submitter — tells Bing, Yandex, Seznam and Naver that URLs changed.
 *
 * The verification key file has been sitting in public/ since July, correctly
 * served, but nothing ever submitted anything to it. This closes that gap.
 *
 *   node scripts/indexnow.mjs                  submit only URLs changed since the last run
 *   node scripts/indexnow.mjs --force          submit every sitemap URL regardless
 *   node scripts/indexnow.mjs --dry-run        show what would be sent, send nothing
 *   node scripts/indexnow.mjs <url> [url...]   submit specific URLs only
 *
 * Bing reviews the submission pattern per site and flags whole-sitemap POSTs as
 * "IndexNow is in batch mode" — it asks for smaller groups sent as changes
 * occur. So a run now submits the difference instead of all ~500 URLs:
 * products diff on sitemap lastmod, and static pages (which carry no lastmod)
 * are re-sent only when the deployed release changes, since their copy only
 * moves with a build.
 *
 * api.indexnow.org fans out to every participating engine, so one POST covers
 * all of them. Google does not participate — it has its own crawl scheduling.
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
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

/** One entry per <url> block, keeping lastmod so a run can diff against the last one. */
const sitemapEntries = async () => {
  const res = await fetch(`${ORIGIN}/sitemap.xml`, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`sitemap.xml returned ${res.status}`);
  const xml = await res.text();
  return xml
    .split("<url>")
    .slice(1)
    .map((block) => {
      const loc = /<loc>([^<]+)<\/loc>/.exec(block);
      if (!loc) return null;
      const lastmod = /<lastmod>([^<]+)<\/lastmod>/.exec(block);
      return { url: loc[1].trim(), lastmod: lastmod ? lastmod[1].trim() : "" };
    })
    .filter((entry) => entry && entry.url.startsWith(ORIGIN));
};

const key = findKey();
const entries = explicitUrls.length ? [] : await sitemapEntries();

if (!explicitUrls.length && entries.length === 0) {
  console.error("no URLs to submit");
  process.exit(1);
}

// Static pages carry no lastmod, so their copy can only move with a build:
// re-send them when .deployed-sha changes. Products diff on lastmod.
const releaseFile = join(ROOT, ".deployed-sha");
const release = existsSync(releaseFile) ? readFileSync(releaseFile, "utf8").trim() : "";

const readState = () => {
  try {
    return JSON.parse(readFileSync(STATE, "utf8"));
  } catch {
    return null; // Unreadable state is not a reason to skip submitting.
  }
};

const selectUrls = () => {
  if (explicitUrls.length) return explicitUrls;
  if (force) return entries.map((entry) => entry.url);
  const previous = readState();
  if (!previous?.urls) return entries.map((entry) => entry.url); // first run: everything
  return entries
    .filter((entry) => {
      const seen = previous.urls[entry.url];
      if (seen === undefined) return true; // URL is new since the last run
      return entry.lastmod ? seen !== entry.lastmod : previous.release !== release;
    })
    .map((entry) => entry.url);
};

const urls = [...new Set(selectUrls())];

if (urls.length === 0) {
  console.log(`nothing changed since ${readState()?.submittedAt ?? "the last run"} — skipping`);
  console.log("use --force to submit every sitemap URL");
  process.exit(0);
}
if (urls.length > MAX_URLS) {
  console.error(`${urls.length} URLs exceeds the ${MAX_URLS} per-request limit`);
  process.exit(1);
}

const payload = {
  host: HOST,
  key,
  keyLocation: `${ORIGIN}/${key}.txt`,
  urlList: urls,
};

console.log(`IndexNow: ${urls.length} URL(s) to submit, key ${key.slice(0, 8)}…`);
if (dryRun) {
  console.log("--dry-run, nothing sent. First 5:");
  for (const u of urls.slice(0, 5)) console.log("  " + u);
  process.exit(0);
}

const res = await fetch(ENDPOINT, {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify(payload),
  signal: AbortSignal.timeout(15000),
});
const body = await res.text().catch(() => "");

// 200 accepted, 202 accepted pending key validation — both are success.
if (res.status === 200 || res.status === 202) {
  console.log(`submitted OK (HTTP ${res.status})`);
  if (!explicitUrls.length) {
    // Record every sitemap lastmod, not just the ones sent, so the next run
    // diffs against the whole site rather than a partial list.
    const sitemapState = Object.fromEntries(entries.map((entry) => [entry.url, entry.lastmod]));
    writeFileSync(STATE, JSON.stringify({ release, count: entries.length, urls: sitemapState, submittedAt: new Date().toISOString() }, null, 2));
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
