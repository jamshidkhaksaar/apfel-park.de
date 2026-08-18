import { query, type TransactionClient } from "@/lib/db";

type SqlExecutor = Pick<TransactionClient, "query">;
const defaultExecutor: SqlExecutor = { query } as SqlExecutor;

export type InventoryAdjustmentType = "shop_sale" | "marketplace_sale" | "restock" | "correction" | "return";

export type InventorySnapshot = {
  sku: string;
  onHand: number;
  reserved: number;
  available: number;
  version: number;
};

// The ledger normally receives rows when a product is created or edited. This
// fallback covers older records and variant SKUs during a rolling deployment.
const ensureInventoryRows = async (skus: string[], executor: SqlExecutor): Promise<void> => {
  if (skus.length === 0) return;
  await executor.query(
    `INSERT INTO inventory_skus (product_id, sku, location, on_hand, reserved, safety_buffer)
     SELECT DISTINCT ON (unit.sku)
            product.id, unit.sku, 'local', greatest(unit.stock, 0), 0, 0
     FROM products product
     CROSS JOIN LATERAL (
       SELECT product.sku, coalesce(product.stock, 0)::integer AS stock
       WHERE coalesce(product.sku, '') <> ''
       UNION ALL
       SELECT variant.value ->> 'sku',
              case
                when coalesce(variant.value ->> 'stock', '') ~ '^\\d+$'
                  then (variant.value ->> 'stock')::integer
                else coalesce(product.stock, 0)::integer
              end
       FROM jsonb_array_elements(
         case when jsonb_typeof(product.variants) = 'array' then product.variants else '[]'::jsonb end
       ) AS variant(value)
       WHERE coalesce(variant.value ->> 'sku', '') <> ''
     ) AS unit
     WHERE unit.sku = ANY($1::text[])
     ORDER BY unit.sku, product.created_at
     ON CONFLICT (sku, location) DO NOTHING`,
    [skus],
  );
};

export const reserveInventoryBatch = async (
  items: Array<{ sku: string; quantity: number }>,
  referenceType: string,
  referenceId: string,
  actor = "system",
  executor: SqlExecutor = defaultExecutor,
): Promise<void> => {
  const normalized = items
    .map((item) => ({ sku: item.sku.trim(), quantity: Math.floor(item.quantity) }))
    .filter((item) => item.sku && item.quantity > 0);
  if (normalized.length !== items.length || normalized.length === 0) {
    throw new Error("Inventory reservation contains an invalid SKU or quantity");
  }

  await ensureInventoryRows([...new Set(normalized.map((item) => item.sku))], executor);
  const result = await executor.query(
    "SELECT reserve_inventory_batch($1::jsonb, $2, $3, $4) AS reserved",
    [JSON.stringify(normalized), referenceType, referenceId, actor],
  );
  if (!result.rows[0]?.reserved) {
    throw new Error(`Insufficient available stock for ${normalized.map((item) => item.sku).join(", ")}`);
  }
};

export const reserveInventory = async (
  sku: string,
  quantity: number,
  referenceType: string,
  referenceId: string,
  actor = "system",
  executor: SqlExecutor = defaultExecutor,
): Promise<void> => reserveInventoryBatch([{ sku, quantity }], referenceType, referenceId, actor, executor);

export const releaseInventoryReservation = async (
  referenceType: string,
  referenceId: string,
  sold = false,
  executor: SqlExecutor = defaultExecutor,
): Promise<void> => {
  await executor.query("SELECT release_inventory_reservation($1, $2, $3)", [referenceType, referenceId, sold]);
};

export const adjustInventory = async (
  input: {
    sku: string;
    type: InventoryAdjustmentType;
    quantity: number;
    referenceType: string;
    referenceId: string;
    actor: string;
    metadata?: Record<string, unknown>;
  },
  executor: SqlExecutor = defaultExecutor,
): Promise<InventorySnapshot> => {
  const result = await executor.query(
    `SELECT sku, on_hand, reserved, available, version
       FROM adjust_inventory($1, $2, $3, $4, $5, $6, $7::jsonb)`,
    [
      input.sku.trim(),
      input.type,
      Math.trunc(input.quantity),
      input.referenceType,
      input.referenceId,
      input.actor,
      JSON.stringify(input.metadata ?? {}),
    ],
  );
  const row = result.rows[0];
  if (!row) throw new Error("Inventory adjustment returned no state");
  return {
    sku: String(row.sku),
    onHand: Number(row.on_hand),
    reserved: Number(row.reserved),
    available: Number(row.available),
    version: Number(row.version),
  };
};

export const queueAvailabilityForSku = async (sku: string, executor: SqlExecutor = defaultExecutor): Promise<string[]> => {
  const result = await executor.query("SELECT queue_inventory_sync($1) AS channels", [sku]);
  return Array.isArray(result.rows[0]?.channels) ? result.rows[0].channels.map(String) : [];
};
