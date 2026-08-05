import { query } from '@/lib/db';
import { enqueueMarketplaceJob } from '@/lib/marketplaces';
// inventory_skus is the ledger checkout reserves against, but a product only
// gets a row once something touches it. Seed it from products.stock first so a
// newly created product is sellable immediately rather than failing at payment.
const ensureInventoryRow = async (sku: string): Promise<void> => {
  await query(
    `INSERT INTO inventory_skus (product_id, sku, location, on_hand, reserved, safety_buffer)
     SELECT p.id, p.sku, 'local', greatest(coalesce(p.stock,0), 0), 0, 0
     FROM products p WHERE p.sku = $1
     ORDER BY p.created_at LIMIT 1
     ON CONFLICT (sku, location) DO NOTHING`,
    [sku],
  );
};

export const reserveInventory = async (sku: string, quantity: number, referenceType: string, referenceId: string, actor = 'system'): Promise<void> => { await ensureInventoryRow(sku); const result = await query('SELECT reserve_inventory($1, $2, $3, $4, $5) AS reserved', [sku, quantity, referenceType, referenceId, actor]); if (!result.rows[0]?.reserved) throw new Error(`Insufficient available stock for SKU ${sku}`); };
export const releaseInventoryReservation = async (referenceType: string, referenceId: string, sold = false): Promise<void> => { await query('SELECT release_inventory_reservation($1, $2, $3)', [referenceType, referenceId, sold]); };
export const queueAvailabilityForSku = async (sku: string): Promise<void> => { const result = await query(`SELECT greatest(0, on_hand - reserved - safety_buffer) AS available FROM inventory_skus WHERE sku = $1 AND location = 'local'`, [sku]); const quantity = Number(result.rows[0]?.available ?? 0); await Promise.all(['amazon_de', 'ebay_de'].map((marketplace) => enqueueMarketplaceJob(marketplace as 'amazon_de' | 'ebay_de', 'update_availability', sku, { quantity }))); };
