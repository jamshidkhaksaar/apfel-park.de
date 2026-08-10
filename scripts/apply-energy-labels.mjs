#!/usr/bin/env node
/**
 * Attaches official EU energy labels (EU 2023/1669) to the shop's smartphones.
 *
 * No regulatory value is authored here. Every figure is read live from EPREL,
 * the EU's public register, and written verbatim. What this file does own is
 * the one link a machine cannot infer: the mapping from a marketing name
 * ("iPhone 17 Pro Max") to the manufacturer model number the registration is
 * filed under ("A3526"). EPREL stores no marketing name at all.
 *
 * Those model numbers come from the manufacturers themselves. Apple publishes
 * them on support.apple.com/en-us/108044; the EU variant is the one Apple lists
 * for "other countries and regions". Samsung's SM-codes follow its published
 * scheme, corroborated by the launch dates in the register.
 *
 * `ratedMah` records the rated battery capacity observed in the register when
 * each mapping was written. It is a tripwire, not a source: together with the
 * supplier and device-type gates it catches a model number pointing at the
 * wrong device -- a tablet registration, say, whose capacity is nowhere near a
 * phone's. Anything failing a gate is skipped and reported, never published on
 * a guess.
 *
 *   node scripts/apply-energy-labels.mjs            dry run
 *   node scripts/apply-energy-labels.mjs --apply    writes products + assets
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import pg from "pg";

const APPLY = process.argv.includes("--apply");
if (!process.env.DATABASE_URL) {
  console.error("ERROR: DATABASE_URL is not set");
  process.exit(1);
}

const GROUP = "smartphonestablets20231669";
const headers = {
  "User-Agent":
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  Referer: `https://eprel.ec.europa.eu/screen/product/${GROUP}`,
};

const ASSET_DIR = "public/energy-labels";
const ASSET_ROUTE = "/energy-labels";

/**
 * Ordered most specific first: the first rule a title matches wins, so
 * "iPhone 17 Pro Max" is claimed before the plain "iPhone 17" rule sees it.
 * `exclude` then stops a plain rule swallowing a variant that has no
 * registration of its own -- without it "iPhone 15 Pro Max", which Apple has
 * not registered, would inherit the iPhone 15 label. That is exactly the kind
 * of wrong that matters here.
 */
const MODELS = [
  { brand: "Apple", name: "iPhone 17 Pro Max", model: "A3526", ratedMah: 4823, match: /iphone 17 pro max/ },
  { brand: "Apple", name: "iPhone Air", model: "A3517", ratedMah: 3149, match: /iphone (17 )?air/ },
  { brand: "Apple", name: "iPhone 17", model: "A3520", ratedMah: 3692, match: /iphone 17\b/, exclude: /\b(pro|max|air|plus|mini)\b/ },
  { brand: "Apple", name: "iPhone 17 Pro", model: "A3523", ratedMah: 3988, match: /iphone 17 pro\b/, exclude: /\bmax\b/ },
  { brand: "Apple", name: "iPhone 16e", model: "A3409", ratedMah: 4005, match: /iphone 16e\b/ },
  { brand: "Apple", name: "iPhone 16 Pro Max", model: "A3296", ratedMah: 4685, match: /iphone 16 pro max/ },
  { brand: "Apple", name: "iPhone 16 Pro", model: "A3293", ratedMah: 3582, match: /iphone 16 pro\b/, exclude: /\bmax\b/ },
  { brand: "Apple", name: "iPhone 16", model: "A3287", ratedMah: 3561, match: /iphone 16\b/, exclude: /\b(pro|max|plus|mini)\b/ },
  { brand: "Apple", name: "iPhone 15", model: "A3090", ratedMah: 3349, match: /iphone 15\b/, exclude: /\b(pro|max|plus|mini)\b/ },
  { brand: "Samsung", name: "Galaxy S25 Ultra", model: "SM-S938B", ratedMah: 4855, match: /galaxy s25 ultra/ },
  { brand: "Samsung", name: "Galaxy S25 FE", model: "SM-S731B", ratedMah: 4755, match: /galaxy s25 fe/ },
  { brand: "Samsung", name: "Galaxy S25", model: "SM-S931B", ratedMah: 3885, match: /galaxy s25\b/, exclude: /\b(ultra|fe|plus|edge)\b/ },
  { brand: "Samsung", name: "Galaxy A57", model: "SM-A576B", ratedMah: 4905, match: /galaxy a57\b/ },
  { brand: "Samsung", name: "Galaxy A56", model: "SM-A566B", ratedMah: 4905, match: /galaxy a56\b/ },
  { brand: "Samsung", name: "Galaxy A36", model: "SM-A366B", ratedMah: 4905, match: /galaxy a36\b/ },
  { brand: "Samsung", name: "Galaxy A26", model: "SM-A266B", ratedMah: 4860, match: /galaxy a26\b/ },
];

const normalizeTitle = (title) =>
  title.toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();

const findModel = (title, models = MODELS) => {
  const normalized = normalizeTitle(title);
  return (
    models.find((entry) => entry.match.test(normalized) && !(entry.exclude && entry.exclude.test(normalized))) ??
    null
  );
};

/** Register value is in hundreds of cycles; the label prints the real number. */
const cyclesFromRegister = (value) =>
  typeof value === "number" && value > 0 ? Math.round(value) * 100 : undefined;

const enduranceFromMinutes = (minutes) =>
  typeof minutes === "number" && minutes > 0
    ? `${Math.floor(Math.round(minutes) / 60)} h ${Math.round(minutes) % 60} min`
    : undefined;

const lookup = async (modelIdentifier) => {
  const url = `https://eprel.ec.europa.eu/api/products/${GROUP}?_page=1&_limit=10&modelIdentifier=${encodeURIComponent(modelIdentifier)}`;
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`EPREL ${modelIdentifier}: HTTP ${response.status}`);
  const hits = (await response.json()).hits ?? [];
  return hits.sort((a, b) => (b.versionNumber ?? 0) - (a.versionNumber ?? 0))[0] ?? null;
};

/** Every reason a registration may not be published, in one place. */
const reject = (entry, hit) => {
  if (!hit) return "no registration found";
  if (!(hit.supplierOrTrademark ?? "").toLowerCase().includes(entry.brand.toLowerCase()))
    return `supplier is "${hit.supplierOrTrademark}", expected ${entry.brand}`;
  if (hit.deviceType !== "SMARTPHONE") return `device type is ${hit.deviceType}, expected SMARTPHONE`;
  if (hit.status !== "PUBLISHED") return `status is ${hit.status}`;
  const rated = hit.ratedBatteryCapacity;
  if (typeof rated !== "number" || Math.abs(rated - entry.ratedMah) / entry.ratedMah > 0.02)
    return `rated capacity ${rated} mAh no longer matches the ${entry.ratedMah} mAh this mapping was verified against`;
  return null;
};

const download = async (url) => {
  const response = await fetch(url, { headers, redirect: "follow" });
  if (!response.ok) throw new Error(`asset ${url}: HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
};

/** Pulls the official artwork and datasheet EPREL generates for a registration. */
const mirrorAssets = async (registration) => {
  const assets = {
    labelImage: `${ASSET_ROUTE}/Label_${registration}.png`,
    ficheDe: `${ASSET_ROUTE}/Fiche_${registration}_DE.pdf`,
    ficheEn: `${ASSET_ROUTE}/Fiche_${registration}_EN.pdf`,
  };
  if (!APPLY) return assets;
  mkdirSync(ASSET_DIR, { recursive: true });
  if (existsSync(`${ASSET_DIR}/Label_${registration}.png`)) return assets;

  const unzip = (buffer, member, target) => {
    const tmp = `/tmp/eprel_${registration}.zip`;
    writeFileSync(tmp, buffer);
    execFileSync("python3", [
      "-c",
      "import sys,zipfile;z=zipfile.ZipFile(sys.argv[1]);open(sys.argv[3],'wb').write(z.read(sys.argv[2]))",
      tmp,
      member,
      target,
    ]);
  };

  const labels = await download(`https://eprel.ec.europa.eu/api/products/${GROUP}/${registration}/labels`);
  unzip(labels, `Label_${registration}.png`, `${ASSET_DIR}/Label_${registration}.png`);
  const fiches = await download(`https://eprel.ec.europa.eu/api/products/${GROUP}/${registration}/fiches`);
  unzip(fiches, `Fiche_${registration}_DE.pdf`, `${ASSET_DIR}/Fiche_${registration}_DE.pdf`);
  unzip(fiches, `Fiche_${registration}_EN.pdf`, `${ASSET_DIR}/Fiche_${registration}_EN.pdf`);
  return assets;
};

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
const { rows: products } = await client.query(
  "SELECT id, title, brand, is_active FROM products WHERE subcategory = 'smartphones' ORDER BY brand, title",
);

const resolved = new Map();
const skipped = [];
for (const entry of MODELS) {
  const hit = await lookup(entry.model);
  const reason = reject(entry, hit);
  if (reason) {
    skipped.push(`${entry.brand} ${entry.name} (${entry.model}): ${reason}`);
    continue;
  }
  resolved.set(entry.model, {
    entry,
    registration: String(hit.eprelRegistrationNumber),
    label: {
      efficiencyClass: hit.energyClass ?? undefined,
      batteryEndurance: enduranceFromMinutes(hit.batteryEndurancePerCycle),
      batteryCycles: cyclesFromRegister(hit.batteryEnduranceInCycles),
      reliabilityClass: hit.repeatedFreeFallReliabilityClass ?? undefined,
      repairabilityClass: hit.repairabilityClass ?? undefined,
      ipRating: hit.ingressProtectionRating ?? undefined,
      ...(await mirrorAssets(String(hit.eprelRegistrationNumber))),
    },
  });
}

let written = 0;
const unmatched = [];
for (const product of products) {
  const entry = findModel(product.title);
  const match = entry ? resolved.get(entry.model) : null;
  if (!match) {
    unmatched.push(`${product.title}${product.is_active ? "" : "  (inactive)"}`);
    continue;
  }
  const { label } = match;
  console.log(`  ${product.title}`);
  console.log(
    `     -> ${match.entry.name} ${match.entry.model} · reg ${match.registration} · class ${label.efficiencyClass} · ${label.batteryEndurance} · ${label.batteryCycles} cycles · ${label.ipRating}`,
  );
  if (APPLY) {
    await client.query(
      "UPDATE products SET eprel_id = $1, energy_label = $2::jsonb, updated_at = now() WHERE id = $3",
      [match.registration, JSON.stringify(label), product.id],
    );
  }
  written += 1;
}

console.log(`\n${written} of ${products.length} smartphones carry a label`);
if (skipped.length) console.log(`\nmappings rejected by a gate:\n  ${skipped.join("\n  ")}`);
console.log(`\nno registration exists for these (label not required or not filed):\n  ${unmatched.join("\n  ")}`);
if (!APPLY) console.log("\ndry run -- pass --apply to write");
await client.end();
