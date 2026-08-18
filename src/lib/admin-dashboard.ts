import { query } from "@/lib/db";

export type DashboardStats = {
  repairs: number;
  orders: number;
  reviews: number;
  liveUsers: number;
  unreadChats: number;
  catalogListings: number;
  inStockSkus: number;
  outOfStockSkus: number;
  sellableUnits: number;
  reservedUnits: number;
  lowStockSkus: number;
  pendingSyncs: number;
  failedSyncs: number;
  failedChannels: string[];
  lastSyncedAt: string | null;
  updatedAt: string;
};

export const loadDashboardStats = async (liveUsers = 0): Promise<DashboardStats> => {
  const [repairs, orders, reviews, chats, inventory, sync] = await Promise.all([
    query(`SELECT COUNT(*)::int AS count FROM repairs WHERE LOWER(COALESCE(status, 'new')) IN ('new', 'neu')`),
    query(`SELECT COUNT(*)::int AS count FROM orders WHERE LOWER(COALESCE(status, 'pending')) IN ('pending', 'neu', 'ausstehend')`),
    query(`SELECT COUNT(*)::int AS count FROM reviews`),
    query(`SELECT COALESCE(SUM(admin_unread_count), 0)::int AS count FROM chat_conversations`),
    query(
      `WITH catalog AS (
         SELECT count(*)::int AS catalog_listings
           FROM products
          WHERE is_active = true
       ), stock AS (
         SELECT
           count(*) FILTER (WHERE available_inventory(inventory.on_hand, inventory.reserved, inventory.safety_buffer) > 0)::int AS in_stock_skus,
           count(*) FILTER (WHERE available_inventory(inventory.on_hand, inventory.reserved, inventory.safety_buffer) = 0)::int AS out_of_stock_skus,
           coalesce(sum(available_inventory(inventory.on_hand, inventory.reserved, inventory.safety_buffer)), 0)::int AS sellable_units,
           coalesce(sum(inventory.reserved), 0)::int AS reserved_units,
           count(*) FILTER (WHERE available_inventory(inventory.on_hand, inventory.reserved, inventory.safety_buffer) BETWEEN 1 AND 3)::int AS low_stock_skus
         FROM inventory_skus inventory
         JOIN products product ON product.id = inventory.product_id
         WHERE inventory.location = 'local' AND inventory.is_active = true AND product.is_active = true
       )
       SELECT catalog.*, stock.* FROM catalog CROSS JOIN stock`,
    ),
    query(
      `WITH unresolved_jobs AS (
         SELECT job.marketplace, job.status, job.updated_at
           FROM marketplace_jobs job
          WHERE job.status IN ('queued', 'processing')
             OR (
               job.status = 'failed'
               AND NOT EXISTS (
                 SELECT 1 FROM marketplace_jobs newer
                  WHERE newer.marketplace = job.marketplace
                    AND newer.operation = job.operation
                    AND newer.sku IS NOT DISTINCT FROM job.sku
                    AND newer.status = 'succeeded'
                    AND newer.updated_at > job.updated_at
               )
             )
       ), states AS (
         SELECT marketplace, status, last_synced_at AS succeeded_at
           FROM inventory_sync_targets
         UNION ALL
         SELECT marketplace, status, updated_at
           FROM marketplace_jobs
          WHERE status = 'succeeded'
         UNION ALL
         SELECT marketplace, status, null::timestamptz
           FROM unresolved_jobs
       )
       SELECT
         count(*) FILTER (WHERE status IN ('queued', 'processing'))::int AS pending_syncs,
         count(*) FILTER (WHERE status = 'failed')::int AS failed_syncs,
         coalesce(array_agg(DISTINCT marketplace) FILTER (WHERE status = 'failed'), '{}') AS failed_channels,
         max(succeeded_at) AS last_synced_at
       FROM states`,
    ),
  ]);

  const inventoryRow = inventory.rows[0] ?? {};
  const syncRow = sync.rows[0] ?? {};
  return {
    repairs: Number(repairs.rows[0]?.count ?? 0),
    orders: Number(orders.rows[0]?.count ?? 0),
    reviews: Number(reviews.rows[0]?.count ?? 0),
    liveUsers,
    unreadChats: Number(chats.rows[0]?.count ?? 0),
    catalogListings: Number(inventoryRow.catalog_listings ?? 0),
    inStockSkus: Number(inventoryRow.in_stock_skus ?? 0),
    outOfStockSkus: Number(inventoryRow.out_of_stock_skus ?? 0),
    sellableUnits: Number(inventoryRow.sellable_units ?? 0),
    reservedUnits: Number(inventoryRow.reserved_units ?? 0),
    lowStockSkus: Number(inventoryRow.low_stock_skus ?? 0),
    pendingSyncs: Number(syncRow.pending_syncs ?? 0),
    failedSyncs: Number(syncRow.failed_syncs ?? 0),
    failedChannels: Array.isArray(syncRow.failed_channels) ? syncRow.failed_channels.map(String) : [],
    lastSyncedAt: syncRow.last_synced_at ? new Date(syncRow.last_synced_at).toISOString() : null,
    updatedAt: new Date().toISOString(),
  };
};
