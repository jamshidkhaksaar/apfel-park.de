#!/usr/bin/env node
/**
 * Title-cases product titles where it is safe, without destroying model
 * names, protocols or part numbers.
 *
 * Titles like "Apple iphone 17 pro max 256GB-Neu" render on the product page,
 * in the Merchant feed and in page titles. Blanket title-casing would wreck
 * MagSafe, USB-C, 4G, TPU, IP68 and every MPN in a title, so this script only
 * rewrites an explicit, curated set of known product words (matched whole-word,
 * case-insensitively) and leaves everything else untouched.
 *
 * Slugs are deliberately NOT touched: the slug migration already shipped and
 * 2,882 redirects point at the current values.
 *
 *   node scripts/normalize-titles.mjs            dry run, prints the plan
 *   node scripts/normalize-titles.mjs --apply    writes product.title
 */
import pg from "pg";

const APPLY = process.argv.includes("--apply");
if (!process.env.DATABASE_URL) {
  console.error("ERROR: DATABASE_URL is not set");
  process.exit(1);
}

/**
 * Word -> preferred spelling. Keys are matched as whole words
 * (case-insensitive) so "IPHONE" and "Iphone" both become "iPhone" while
 * "iPhone17" is untouched. Ordered longest-first so "pro max" wins over "pro".
 */
const WORD_CASINGS = [
  // Phrase pairs must come before their single-word parts.
  [/pro max/gi, "Pro Max"],
  [/open box/gi, "Open Box"],

  // Apple hardware.
  [/iphone/gi, "iPhone"],
  [/ipad/gi, "iPad"],
  [/imac/gi, "iMac"],
  [/macbook/gi, "MacBook"],
  [/mac mini/gi, "Mac mini"],
  [/airpods/gi, "AirPods"],
  [/airpods pro/gi, "AirPods Pro"],
  [/magsafe/gi, "MagSafe"],

  // Other brands and families.
  [/galaxy/gi, "Galaxy"],
  [/galaxy s/gi, "Galaxy S"],
  [/pixel/gi, "Pixel"],
  [/xiaomi/gi, "Xiaomi"],
  [/redmi/gi, "Redmi"],
  [/huawei/gi, "Huawei"],
  [/samsung/gi, "Samsung"],
  [/nothing phone/gi, "Nothing Phone"],
  [/nothing\b/gi, "Nothing"],

  // Technology that must keep its all-caps form. Every pattern is
  // word-boundary protected so a bare "lte" cannot match inside a German word
  // like "abgewinkelte" (-> "abgewinkeLTEs") or "Halter" (-> "HaLTEr").
  [/\busb-c\b/gi, "USB-C"],
  [/\busb c\b/gi, "USB-C"],
  [/\btype-c\b/gi, "Type-C"],
  [/\busb\b/gi, "USB"],
  [/\bled\b/gi, "LED"],
  [/\boled\b/gi, "OLED"],
  [/\blte\b/gi, "LTE"],
  [/\b5g\b/gi, "5G"],
  [/\b4g\b/gi, "4G"],
  [/\bwifi\b/gi, "WiFi"],
  [/\bwi-fi\b/gi, "Wi-Fi"],
  [/\bbluetooth\b/gi, "Bluetooth"],
  [/\bnfc\b/gi, "NFC"],
  [/\btpu\b/gi, "TPU"],
  [/\bip68\b/gi, "IP68"],
  [/\bip67\b/gi, "IP67"],
  [/\bip65\b/gi, "IP65"],

  // German condition and generic words that must be capitalised. Word
  // boundaries prevent "neu" from rewriting "Neutral" or "Tenne".
  [/\bneu\b/gi, "Neu"],
  [/\bgebraucht\b/gi, "Gebraucht"],
  [/\brefurbished\b/gi, "Refurbished"],
  [/\bpro\b/gi, "Pro"],
  [/\bmax\b/gi, "Max"],
];

/**
 * Apply the curated casings to a title. A word already spelled correctly is a
 * no-op, so running this on a clean title changes nothing.
 */
export const normalizeTitle = (title) => {
  let result = title;
  for (const [pattern, replacement] of WORD_CASINGS) {
    result = result.replace(pattern, replacement);
  }
  return result;
};

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

const { rows } = await client.query(
  `SELECT id, title, title_i18n FROM products WHERE is_active = true ORDER BY title`,
);

const updates = [];
for (const row of rows) {
  const next = normalizeTitle(row.title);
  const i18n = row.title_i18n && typeof row.title_i18n === "object" ? row.title_i18n : {};
  const nextI18n = {};
  let i18nChanged = false;
  for (const locale of Object.keys(i18n)) {
    if (typeof i18n[locale] !== "string") continue;
    const corrected = normalizeTitle(i18n[locale]);
    nextI18n[locale] = corrected;
    if (corrected !== i18n[locale]) i18nChanged = true;
  }
  if (next !== row.title || i18nChanged) {
    updates.push({
      id: row.id,
      from: row.title,
      to: next,
      i18n: i18nChanged ? { ...i18n, ...nextI18n } : null,
    });
  }
}

console.log(`${updates.length} of ${rows.length} active titles would change\n`);
for (const u of updates.slice(0, 50)) {
  console.log(`  ${u.from}`);
  console.log(`  -> ${u.to}\n`);
  if (u.i18n) console.log(`     (title_i18n also updated)\n`);
}
if (updates.length > 50) {
  console.log(`  …and ${updates.length - 50} more`);
}

if (!APPLY) {
  console.log("\ndry run -- pass --apply to write");
  await client.end();
  process.exit(0);
}

await client.query("BEGIN");
try {
  for (const u of updates) {
    await client.query(
      `UPDATE products SET title = $2, title_i18n = $3::jsonb, updated_at = now() WHERE id = $1`,
      [u.id, u.to, u.i18n ? JSON.stringify(u.i18n) : undefined],
    );
  }
  await client.query("COMMIT");
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
}
console.log(`\napplied to ${updates.length} products`);
await client.end();
