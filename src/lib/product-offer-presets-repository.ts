import { query, withTransaction } from './db';
import { defaultOfferPresets, sanitizeOfferPresets, type OfferPresets } from './product-offer-options';
import { getSafeConditionNote } from './product-page-presentation';

const key = 'product_offer_presets';
export const readOfferPresets = async (client: { query: typeof query } = { query }): Promise<OfferPresets> => {
  const existing = (await client.query('SELECT value FROM store_settings WHERE key=$1', [key])).rows[0]?.value;
  if (existing) return sanitizeOfferPresets(existing);
  const presets = defaultOfferPresets();
  const notes = (await client.query(`SELECT condition,coalesce(import_metadata->'smartphoneEditor'->>'conditionNote',condition_note) AS note,count(*) AS frequency
    FROM products WHERE condition_note IS NOT NULL AND condition_note<>''
    GROUP BY condition,note ORDER BY frequency DESC,note LIMIT 25`)).rows;
  for (const row of notes) {
    const condition = row.condition;
    const note = String(row.note ?? '').split(/\n(?:none\b|Inklusive Zubehör|Included accessories)/i)[0].trim();
    if (!['new', 'open_box', 'used'].includes(condition) || !note || note.length > 1000 || !getSafeConditionNote({ condition, note }) || presets.conditionNotes.some(preset => preset.text.de === note)) continue;
    presets.conditionNotes.push({ id: `catalog-${presets.conditionNotes.length}`, condition, label: { de: `Katalog: ${note.slice(0, 70)}`, en: `Catalog: ${note.slice(0, 70)}` }, text: { de: note, en: '' } });
    if (presets.conditionNotes.length >= 12) break;
  }
  return presets;
};

export const saveOfferPresets = async (input: unknown): Promise<OfferPresets> => {
  const presets = sanitizeOfferPresets(input);
  return withTransaction(async client => {
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended('product-offer-presets',0))");
    const current = await readOfferPresets(client);
    if (presets.revision !== current.revision) throw new Error('presets_conflict');
    const next = { ...presets, revision: current.revision + 1 };
    await client.query('INSERT INTO store_settings(key,value) VALUES($1,$2::jsonb) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=now()', [key, JSON.stringify(next)]);
    return next;
  });
};
