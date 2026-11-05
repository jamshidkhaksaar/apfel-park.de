import { readdir, stat, unlink } from 'node:fs/promises';
import path from 'node:path';
import { query } from '../src/lib/db';

const main = async (): Promise<void> => {
  const root =
    process.env.TELEGRAM_PRODUCT_PRIVATE_DIR ||
    '/srv/apfel-intake/private/telegram';
  const retained = new Set<string>();
  const assets = (
    await query(
      `SELECT a.private_path,a.safe_path,a.edited_path FROM telegram_product_assets a JOIN telegram_product_sessions s ON s.id=a.session_id WHERE s.status NOT IN ('published','cancelled','rejected') OR s.updated_at>now()-interval '30 days'`,
    )
  ).rows;
  for (const asset of assets)
    for (const field of ['private_path', 'safe_path', 'edited_path'])
      if (asset[field]) retained.add(path.resolve(asset[field]));
  let removed = 0;
  for (const name of await readdir(root)) {
    if (!/^[a-f0-9-]{36}\.(?:jpg|jpeg|png|webp)$/.test(name)) continue;
    const file = path.resolve(root, name),
      metadata = await stat(file);
    if (!retained.has(file) && metadata.mtimeMs < Date.now() - 30 * 86400000) {
      await unlink(file);
      removed++;
    }
  }
  await query(
    "DELETE FROM telegram_product_updates WHERE created_at<now()-interval '30 days'",
  );
  await query(
    'DELETE FROM telegram_product_research_cache WHERE expires_at<now()',
  );
  console.log(
    `[telegram-product-cleanup] removed ${removed} expired private files`,
  );
};
void main()
  .then(() => process.exit(0))
  .catch(() => {
    console.error(
      '[telegram-product-cleanup] failed; no public files are deleted',
    );
    process.exit(1);
  });
