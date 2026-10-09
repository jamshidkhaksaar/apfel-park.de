import { query, withTransaction } from './db';
import { markOpenIntakeRunsStale } from './product-intake/stale-runs';

export class ProductDeletionError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
const validId = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
export const productDeletionPreview = async (id: string) => {
  if (!validId(id)) throw new ProductDeletionError('not_found', 404);
  const row = (await query("SELECT id,title,stock,md5(to_jsonb(p)::text) AS fingerprint FROM products p WHERE id=$1 AND import_metadata->>'catalogDeletedAt' IS NULL", [id])).rows[0];
  if (!row) throw new ProductDeletionError('not_found', 404);
  return { id: row.id, title: row.title, stock: Number(row.stock ?? 0), fingerprint: row.fingerprint };
};
export const deleteCatalogProduct = async (id: string, body: unknown, actor: string) => {
  if (!validId(id)) throw new ProductDeletionError('not_found', 404);
  const input = body && typeof body === 'object' ? body as {confirmation?: unknown;fingerprint?: unknown} : {};
  if (input.confirmation !== 'DELETE' || typeof input.fingerprint !== 'string' || !/^[a-f0-9]{32}$/.test(input.fingerprint)) throw new ProductDeletionError('confirmation_required');
  return withTransaction(async db => {
    // The editor locks family, product and SKU rows in this same order.
    await db.query('SELECT f.id FROM product_families f JOIN product_family_members m ON m.family_id=f.id WHERE m.product_id=$1 FOR UPDATE OF f', [id]);
    const row = (await db.query("SELECT p.*,md5(to_jsonb(p)::text) AS fingerprint FROM products p WHERE id=$1 AND import_metadata->>'catalogDeletedAt' IS NULL FOR UPDATE", [id])).rows[0];
    if (!row) throw new ProductDeletionError('not_found', 404);
    if (row.fingerprint !== input.fingerprint) throw new ProductDeletionError('conflict', 409);
    const skus = (await db.query('SELECT id,reserved FROM inventory_skus WHERE product_id=$1 ORDER BY sku FOR UPDATE', [id])).rows;
    if (skus.some(sku => Number(sku.reserved) > 0)) throw new ProductDeletionError('reservations', 409);
    await db.query("UPDATE products SET is_active=false,catalog_enabled=false,import_metadata=coalesce(import_metadata,'{}'::jsonb) || jsonb_build_object('catalogDeletedAt',now()::text,'catalogDeletedBy',$2::text,'stockAtDeletion',stock),updated_at=now() WHERE id=$1", [id, actor]);
    await db.query('UPDATE inventory_skus SET is_active=false WHERE product_id=$1', [id]);
    await db.query('UPDATE product_family_members SET is_active=false WHERE product_id=$1', [id]);
    await db.query("UPDATE store_settings SET value=coalesce((SELECT jsonb_agg(item) FROM jsonb_array_elements(value) item WHERE item<>to_jsonb($1::text)),'[]'::jsonb),updated_at=now() WHERE key='featured_product_ids' AND jsonb_typeof(value)='array'", [id]);
    await markOpenIntakeRunsStale(id, 'Product removed from catalog', db);
    return { success: true };
  });
};
