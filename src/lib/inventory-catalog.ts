import { markOpenIntakeRunsStale } from "@/lib/product-intake/stale-runs";
import { withTransaction } from '@/lib/db';

export const setInventoryCatalogEnabled = async (id: string, enabled: boolean) => withTransaction(async (db) => {
  const current = await db.query('SELECT id, is_active, catalog_enabled FROM products WHERE id = $1 FOR UPDATE', [id]);
  if (!current.rows.length) return null;
  const product = current.rows[0];
  if (product.catalog_enabled === enabled) return { catalogEnabled: enabled, active: Boolean(product.is_active) };

  // Selecting a product for editing never publishes it. Removing it also hides it from the store.
  await db.query('UPDATE products SET catalog_enabled = $2, is_active = false, updated_at = now() WHERE id = $1', [id, enabled]);
  await markOpenIntakeRunsStale(id, "Inventory catalog selection changed", db);
  return { catalogEnabled: enabled, active: false };
});

export const inventoryCatalogFrom = `FROM products product
  LEFT JOIN inventory_skus inventory ON inventory.product_id = product.id
    AND inventory.location = 'local' AND inventory.is_active = true`;

export const inventoryCatalogWhere = `WHERE ($1 = '' OR inventory.sku ILIKE $2 OR product.sku ILIKE $2 OR product.title ILIKE $2 OR coalesce(product.model, '') ILIKE $2)
  AND ($3 = 'all' OR ($3 = 'inventory' AND product.catalog_enabled = false)
    OR ($3 = 'draft' AND product.catalog_enabled = true AND coalesce(product.is_active, false) = false)
    OR ($3 = 'published' AND product.is_active = true))`;
